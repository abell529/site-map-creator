import fs from "node:fs";
import path from "node:path";

export type JsonlStoreOptions = {
  dataDir: string;
};

export class JsonlStore {
  private readonly pagesStream: fs.WriteStream;
  private readonly resultsStream: fs.WriteStream;

  constructor(options: JsonlStoreOptions) {
    fs.mkdirSync(options.dataDir, { recursive: true });
    this.pagesStream = fs.createWriteStream(path.join(options.dataDir, "pages.jsonl"), {
      encoding: "utf8"
    });
    this.resultsStream = fs.createWriteStream(path.join(options.dataDir, "results.jsonl"), {
      encoding: "utf8"
    });
  }

  recordPage(page: unknown): void {
    this.pagesStream.write(`${JSON.stringify(page)}\n`);
  }

  recordResult(result: unknown): void {
    this.resultsStream.write(`${JSON.stringify(result)}\n`);
  }

  async close(): Promise<void> {
    await Promise.all([this.closeStream(this.pagesStream), this.closeStream(this.resultsStream)]);
  }

  private closeStream(stream: fs.WriteStream): Promise<void> {
    return new Promise((resolve, reject) => {
      stream.end(() => resolve());
      stream.on("error", reject);
    });
  }
}
