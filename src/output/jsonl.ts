import fs from "node:fs";
import path from "node:path";

export type JsonlWriterOptions = {
  outputPath: string;
};

export class JsonlWriter {
  private readonly stream: fs.WriteStream;

  constructor(options: JsonlWriterOptions) {
    fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });
    this.stream = fs.createWriteStream(options.outputPath, { encoding: "utf8" });
  }

  writeRow(record: unknown): void {
    this.stream.write(`${JSON.stringify(record)}\n`);
  }

  end(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stream.end(() => resolve());
      this.stream.on("error", reject);
    });
  }
}
