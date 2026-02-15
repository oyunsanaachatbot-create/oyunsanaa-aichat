// rows: { type, amount, category, date, note, source, raw_text }[]
// userId: auth()-оос

// 1) давхардлыг шалгах түлхүүрүүд: (user_id, date, amount, note, source='receipt')
const keys = rows.map((r: any) => ({
  user_id: userId,
  date: r.date,
  amount: r.amount,
  note: r.note,
  source: r.source ?? "receipt",
}));

// 2) DB-ээс ижил мөрүүдийг татна
const { data: existing, error: existErr } = await supabaseAdmin
  .from("transactions")
  .select("id,date,amount,note,source")
  .eq("user_id", userId)
  .in(
    "note",
    keys.map((k) => k.note)
  )
  .in(
    "amount",
    keys.map((k) => k.amount)
  )
  .in(
    "date",
    keys.map((k) => k.date)
  )
  .eq("source", "receipt");

if (existErr) {
  return NextResponse.json({ error: existErr.message }, { status: 400 });
}

const existSet = new Set(
  (existing ?? []).map((x: any) => `${x.date}__${x.amount}__${x.note}__${x.source}`)
);

// 3) insert хийх мөрүүдээс “байгаа”-г шүүнэ
const safeRows = rows
  .map((r: any) => ({ ...r, user_id: userId }))
  .filter((r: any) => !existSet.has(`${r.date}__${r.amount}__${r.note}__${(r.source ?? "receipt")}`));

if (!safeRows.length) {
  return NextResponse.json({ ok: true, inserted: 0, skipped: rows.length }, { status: 200 });
}

// 4) insert
const { error } = await supabaseAdmin.from("transactions").insert(safeRows);
if (error) return NextResponse.json({ error: error.message }, { status: 400 });

return NextResponse.json({ ok: true, inserted: safeRows.length, skipped: rows.length - safeRows.length }, { status: 200 });
