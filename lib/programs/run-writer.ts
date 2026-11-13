export type RunWrite = {
  mode: "DRAFT" | "COMPLETE";
  runId: string;
  currentSectionId: string;
  responses: Record<string, unknown>;
  assignmentRecipientId?: string;
  completeDay?: number;
};

/** Serialize every save and completion for one run. A conflicting tab must reload explicitly. */
export class ProgramRunWriter {
  private tail: Promise<unknown> = Promise.resolve();
  private conflict = false;
  private readonly url: string;
  private revision: number;
  private readonly send: typeof fetch;
  constructor(
    url: string,
    revision: number,
    send: typeof fetch = (input, init) => globalThis.fetch(input, init)
  ) {
    this.url = url;
    this.revision = revision;
    this.send = send;
  }
  write(payload: RunWrite) {
    const snapshot = JSON.parse(JSON.stringify(payload)) as RunWrite;
    const operation = this.tail.then(async () => {
      if (this.conflict) throw new Error("run_revision_conflict");
      const response = await this.send(this.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...snapshot, expectedRevision: this.revision }),
      });
      if (response.status === 409) {
        this.conflict = true;
        throw new Error("run_revision_conflict");
      }
      if (!response.ok) throw new Error("run_save_failed");
      const result = await response.json();
      if (typeof result.run?.revision === "number")
        this.revision = result.run.revision;
      return result;
    });
    this.tail = operation.catch(() => {
      /* The caller retains the failure; later saves may retry transient errors. */
    });
    return operation;
  }
}
