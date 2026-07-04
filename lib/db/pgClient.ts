/**
 * Supabase-compatible thin wrapper over postgres.js for local PostgreSQL.
 * Replaces @supabase/supabase-js on the server side.
 * Client-side components must use fetch() to API routes instead.
 */
import postgres from "postgres";

let _sql: ReturnType<typeof postgres> | null = null;

export function getSql(): ReturnType<typeof postgres> | null {
  if (_sql) return _sql;
  const url = process.env.POSTGRES_URL;
  if (!url) return null;
  _sql = postgres(url, {
    ssl: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return _sql;
}

type PgError = { message: string; code?: string; details?: string; hint?: string };
type OkResult<T> = { data: T; error: null };
type ErrResult = { data: null; error: PgError };
type QueryResult<T> = OkResult<T> | ErrResult;

// Safe SQL identifier — only [a-zA-Z0-9_] allowed
function ident(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9_]/g, "");
  if (!clean) throw new Error(`Invalid SQL identifier: "${name}"`);
  return `"${clean}"`;
}

function buildSelectCols(cols: string): string {
  if (!cols || cols === "*") return "*";
  return cols
    .split(",")
    .map((c) => ident(c.trim()))
    .join(", ");
}

function buildSet(
  data: Record<string, any>,
  startIdx: number
): { clause: string; values: any[] } {
  const entries = Object.entries(data);
  const clause = entries.map(([col], i) => `${ident(col)} = $${startIdx + i}`).join(", ");
  return { clause, values: entries.map(([, v]) => v) };
}

class Builder<T = Record<string, any>> {
  private _table: string;
  private _selectCols = "*";
  private _returningCols = "*";
  private _wheres: [string, string, any][] = [];
  private _orders: [string, boolean][] = [];
  private _lim: number | null = null;
  private _op: "select" | "insert" | "upsert" | "update" | "delete" = "select";
  private _payload: any = null;
  private _conflictCols: string | null = null;

  constructor(table: string) {
    this._table = table;
  }

  select(cols: string) {
    if (this._op === "select") this._selectCols = cols;
    else this._returningCols = cols;
    return this;
  }

  eq(col: string, val: any) {
    this._wheres.push([col, "=", val]);
    return this;
  }

  gte(col: string, val: any) {
    this._wheres.push([col, ">=", val]);
    return this;
  }

  lte(col: string, val: any) {
    this._wheres.push([col, "<=", val]);
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this._orders.push([col, opts?.ascending ?? true]);
    return this;
  }

  limit(n: number) {
    this._lim = n;
    return this;
  }

  insert(data: any) {
    this._op = "insert";
    this._payload = data;
    return this;
  }

  upsert(data: any, opts?: { onConflict?: string }) {
    this._op = "upsert";
    this._payload = data;
    this._conflictCols = opts?.onConflict ?? null;
    return this;
  }

  update(data: any) {
    this._op = "update";
    this._payload = data;
    return this;
  }

  delete() {
    this._op = "delete";
    return this;
  }

  private buildWhere(startIdx = 1): { clause: string; values: any[] } {
    if (!this._wheres.length) return { clause: "", values: [] };
    const clause =
      "WHERE " +
      this._wheres
        .map(([col, op], i) => `${ident(col)} ${op} $${startIdx + i}`)
        .join(" AND ");
    return { clause, values: this._wheres.map(([, , v]) => v) };
  }

  private async _run(): Promise<T[]> {
    const sql = getSql();
    if (!sql) throw new Error("POSTGRES_URL not configured");

    const tbl = ident(this._table);

    if (this._op === "select") {
      const cols = buildSelectCols(this._selectCols);
      const { clause: where, values } = this.buildWhere();
      let q = `SELECT ${cols} FROM ${tbl} ${where}`;
      if (this._orders.length) {
        q +=
          " ORDER BY " +
          this._orders
            .map(([c, asc]) => `${ident(c)} ${asc ? "ASC" : "DESC"}`)
            .join(", ");
      }
      if (this._lim != null) q += ` LIMIT ${this._lim}`;
      return (await sql.unsafe(q, values)) as T[];
    }

    if (this._op === "delete") {
      const { clause: where, values } = this.buildWhere();
      await sql.unsafe(`DELETE FROM ${tbl} ${where}`, values);
      return [];
    }

    if (this._op === "update") {
      const data = this._payload as Record<string, any>;
      const { clause: where, values: whereVals } = this.buildWhere(
        Object.keys(data).length + 1
      );
      const { clause: setClause, values: setVals } = buildSet(data, 1);
      const ret = buildSelectCols(this._returningCols);
      const q = `UPDATE ${tbl} SET ${setClause} ${where} RETURNING ${ret}`;
      return (await sql.unsafe(q, [...setVals, ...whereVals])) as T[];
    }

    if (this._op === "insert") {
      const rows: Record<string, any>[] = Array.isArray(this._payload)
        ? this._payload
        : [this._payload];
      if (!rows.length) return [];

      const keys = Object.keys(rows[0]);
      const cols = keys.map(ident).join(", ");
      const allValues: any[] = [];
      const rowPlaceholders = rows.map((row, ri) => {
        const base = ri * keys.length;
        keys.forEach((k) => allValues.push(row[k] ?? null));
        return `(${keys.map((_, ki) => `$${base + ki + 1}`).join(", ")})`;
      });
      const ret = buildSelectCols(this._returningCols);
      const q = `INSERT INTO ${tbl} (${cols}) VALUES ${rowPlaceholders.join(", ")} RETURNING ${ret}`;
      return (await sql.unsafe(q, allValues)) as T[];
    }

    if (this._op === "upsert") {
      const data = this._payload as Record<string, any>;
      const keys = Object.keys(data);
      const cols = keys.map(ident).join(", ");
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const values = keys.map((k) => data[k] ?? null);
      const ret = buildSelectCols(this._returningCols);

      let q = `INSERT INTO ${tbl} (${cols}) VALUES (${placeholders})`;
      if (this._conflictCols) {
        const conflictIdents = this._conflictCols
          .split(",")
          .map((c) => ident(c.trim()))
          .join(", ");
        const updateSet = keys.map((k) => `${ident(k)} = EXCLUDED.${ident(k)}`).join(", ");
        q += ` ON CONFLICT (${conflictIdents}) DO UPDATE SET ${updateSet}`;
      } else {
        q += " ON CONFLICT DO NOTHING";
      }
      q += ` RETURNING ${ret}`;
      return (await sql.unsafe(q, values)) as T[];
    }

    return [];
  }

  async maybeSingle(): Promise<QueryResult<T | null>> {
    try {
      this._lim = 1;
      const rows = await this._run();
      return { data: (rows[0] ?? null) as T | null, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  }

  async single(): Promise<QueryResult<T>> {
    try {
      this._lim = 1;
      const rows = await this._run();
      if (!rows.length) {
        return { data: null, error: { message: "Row not found", code: "PGRST116" } };
      }
      return { data: rows[0] as T, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  }

  // Awaitable as array result: const {data, error} = await supabase.from(...).select(...)...
  then<R1, R2 = never>(
    onFulfilled: (v: QueryResult<T[]>) => R1 | PromiseLike<R1>,
    onRejected?: (r: any) => R2 | PromiseLike<R2>
  ): Promise<R1 | R2> {
    const p: Promise<QueryResult<T[]>> = (async () => {
      try {
        const rows = await this._run();
        return { data: rows, error: null };
      } catch (e: any) {
        return { data: null, error: { message: e.message } };
      }
    })();
    return p.then(onFulfilled, onRejected);
  }
}

// Postgres-backed storage (replaces Supabase Storage).
//
// NOTE: this used to write to the local filesystem (public/uploads/<bucket>/<path>),
// which breaks the moment there's more than one app instance/replica behind a load
// balancer — an upload lands on disk of whichever instance handled the POST, but the
// following GET for that file can be routed to a different instance that never wrote
// it, producing an immediate 404. Storing bytes in the shared Postgres database keeps
// every instance consistent without requiring new infra (S3/Vercel Blob/etc).
let _blobTableReady: Promise<void> | null = null;
function ensureBlobTable(sql: ReturnType<typeof postgres>): Promise<void> {
  if (!_blobTableReady) {
    _blobTableReady = sql`
      CREATE TABLE IF NOT EXISTS blob_storage (
        bucket text NOT NULL,
        path text NOT NULL,
        content_type text,
        data bytea NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (bucket, path)
      )
    `.then(() => undefined);
  }
  return _blobTableReady;
}

class StorageBucket {
  private bucket: string;
  constructor(bucket: string) {
    this.bucket = bucket;
  }

  async upload(
    filePath: string,
    file: Blob,
    opts?: { contentType?: string; upsert?: boolean }
  ) {
    try {
      const sql = getSql();
      if (!sql) throw new Error("POSTGRES_URL not configured");
      await ensureBlobTable(sql);

      const buf = Buffer.from(await file.arrayBuffer());
      const contentType = opts?.contentType ?? "application/octet-stream";

      if (opts?.upsert === false) {
        await sql`
          INSERT INTO blob_storage (bucket, path, content_type, data)
          VALUES (${this.bucket}, ${filePath}, ${contentType}, ${buf})
        `;
      } else {
        await sql`
          INSERT INTO blob_storage (bucket, path, content_type, data)
          VALUES (${this.bucket}, ${filePath}, ${contentType}, ${buf})
          ON CONFLICT (bucket, path) DO UPDATE
            SET content_type = EXCLUDED.content_type,
                data = EXCLUDED.data,
                created_at = now()
        `;
      }
      return { error: null };
    } catch (e: any) {
      return { error: { message: e.message } };
    }
  }

  getPublicUrl(filePath: string) {
    return {
      data: {
        publicUrl: `/api/uploads/${this.bucket}/${filePath}`,
      },
    };
  }
}

export function createPgAdmin() {
  return {
    from<T = Record<string, any>>(table: string) {
      return new Builder<T>(table);
    },
    storage: {
      from(bucket: string) {
        return new StorageBucket(bucket);
      },
    },
  };
}

let _admin: ReturnType<typeof createPgAdmin> | null = null;

/** Server-side singleton — replaces supabaseAdmin() / getSupabaseAdmin() */
export function getPgAdmin() {
  if (!_admin) _admin = createPgAdmin();
  return _admin;
}
