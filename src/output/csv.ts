import fs from "node:fs";
import path from "node:path";

export type CsvWriterOptions = {
  outputPath: string;
};

export class CsvWriter {
  private readonly stream: fs.WriteStream;
  private headerWritten = false;

  constructor(options: CsvWriterOptions) {
    fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });
    this.stream = fs.createWriteStream(options.outputPath, { encoding: "utf8" });
  }

  writeHeader(): void {
    if (this.headerWritten) return;
    this.stream.write("Page,Link\n");
    this.headerWritten = true;
  }

  writeRow(page: string, link: string): void {
    this.writeHeader();
    const csvLine = `${escapeCsv(page)},${escapeCsv(link)}\n`;
    this.stream.write(csvLine);
  }

  end(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stream.end(() => resolve());
      this.stream.on("error", reject);
    });
  }
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replaceAll("\"", '""')}"`;
  }
  return value;
}
