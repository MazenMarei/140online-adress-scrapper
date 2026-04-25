import fs from "node:fs/promises";
import path from "node:path";
import { promises as fsp } from "node:fs";

export class OutputMerger {
  static async mergeClassFiles(outputDir: string): Promise<string> {
    const outputFile = path.join(
      outputDir,
      `final_addresses_${new Date().getTime()}.csv`,
    );
    const allLines = ["address"];
    let totalAddresses = 0;

    // Glob for all per-class CSV files
    const classFilesPattern = path.join(outputDir, "class_*.csv");
    console.log(`[Merger] Looking for files matching ${classFilesPattern}`);

    const entries = await fsp.readdir(outputDir);
    const classFiles = entries
      .filter((entry) => entry.startsWith("class_") && entry.endsWith(".csv"))
      .map((entry) => path.join(outputDir, entry))
      .sort(); // Sort for deterministic output

    console.log(`[Merger] Found ${classFiles.length} per-class files`);

    for (const classFile of classFiles) {
      try {
        const content = await fsp.readFile(classFile, "utf-8");
        const lines = content
          .split("\n")
          .filter((line) => line.trim().length > 0);
        if (lines.length > 1) {
          allLines.push(...lines.slice(1)); // Skip header
          totalAddresses += lines.length - 1;
        }
      } catch (error: any) {
        console.error(`[Merger] Error reading ${classFile}:`, error.message);
      }
    }

    await fsp.writeFile(outputFile, allLines.join("\n"), "utf-8");
    console.log(
      `[Merger] Merged ${totalAddresses} addresses from ${classFiles.length} files into ${outputFile}`,
    );
    return outputFile;
  }
}
