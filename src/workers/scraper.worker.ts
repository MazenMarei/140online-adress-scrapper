import { ClassUrl } from "../types/index.js";
import { PageScraper } from "../scraper/page.scraper.js";
import fs from "node:fs/promises";
import path from "node:path";

export class ScraperWorker {
  private workerId: number;
  private concurrency: number;
  private outputDir: string;

  constructor(workerId: number, concurrency: number, outputDir: string) {
    this.workerId = workerId;
    this.concurrency = concurrency;
    this.outputDir = outputDir;
  }

  async execute(
    classUrls: ClassUrl[],
  ): Promise<{
    addresses: Map<string, string[]>;
    outputFileMap: Map<number, string>;
  }> {
    console.log(
      `[Worker ${this.workerId}] Assigned ${classUrls.length} classes`,
    );
    const allAddresses = new Map<string, string[]>();
    const outputFileMap = new Map<number, string>();
    const queue = [...classUrls];
    const inProgress = new Set<string>();
    const scraper = new PageScraper();

    while (queue.length > 0 || inProgress.size > 0) {
      const batches: Promise<void>[] = [];

      while (batches.length < this.concurrency && queue.length > 0) {
        const classUrl = queue.shift()!;
        inProgress.add(classUrl.classId);

        batches.push(
          scraper
            .scrapeClass(classUrl)
            .then((addresses) => {
              allAddresses.set(classUrl.classId, addresses);
              outputFileMap.set(
                parseInt(classUrl.classId),
                path.join(
                  this.outputDir,
                  `class_${classUrl.classId}_${new Date().getTime()}.csv`,
                ),
              );
              inProgress.delete(classUrl.classId);
            })
            .catch((error) => {
              console.error(
                `[Worker ${this.workerId}] Error processing class ${classUrl.classId}:`,
                error.message,
              );
              inProgress.delete(classUrl.classId);
            }),
        );
      }

      if (batches.length > 0) {
        await Promise.all(batches);
      } else if (inProgress.size > 0) {
        await this.sleep(100);
      }
    }

    for (const [classId, addresses] of allAddresses) {
      const filePath = outputFileMap.get(parseInt(classId))!;
      await this.saveCsv(addresses, filePath);
      console.log(
        `[Worker ${this.workerId}] Saved ${addresses.length} addresses to ${filePath}`,
      );
    }

    return { addresses: allAddresses, outputFileMap };
  }

  private async saveCsv(addresses: string[], filePath: string): Promise<void> {
    const lines = ["address"];
    for (const address of addresses) {
      const escaped = `"${address.replace(/"/g, '""')}"`;
      lines.push(escaped);
    }
    await fs.writeFile(filePath, lines.join("\n"), "utf-8");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
