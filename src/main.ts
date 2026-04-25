import os from 'node:os';
import fs from 'node:fs/promises';
import { ClassUrl } from './types/index.js';
import { ClassDiscovery } from './discovery/class.discovery.js';
import { ScraperWorker } from './workers/scraper.worker.js';
import { OutputMerger } from './output/output.merger.js';
import { config, availableThreads } from './config/scraping.config.js';

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('140Online Address Scraper');
  console.log(`Available CPU threads: ${availableThreads}`);
  console.log(`Workers: ${availableThreads} (one per core)`);
  console.log(`Class limit: ${config.classLimit ?? 'none'}`);
  console.log('='.repeat(60));

  const startTime = Date.now();

  await fs.mkdir(config.outputDir, { recursive: true });

  // Phase 1: Discover all class URLs
  console.log('\n--- PHASE 1: DISCOVERY ---');
  const discovery = new ClassDiscovery();
  const classUrls = await discovery.discoverClasses();

  if (classUrls.length === 0) {
    console.log('No classes found. Exiting.');
    return;
  }

  // Phase 2: Distribute work across workers
  console.log(`\n--- PHASE 2: SCRAPING (${availableThreads} WORKERS) ---`);
  const chunkSize = Math.ceil(classUrls.length / availableThreads);
  const workerTasks: ClassUrl[][] = [];

  for (let i = 0; i < availableThreads; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, classUrls.length);
    const chunk = classUrls.slice(start, end);
    if (chunk.length > 0) {
      workerTasks.push(chunk);
    }
  }

  console.log(`Distributing ${classUrls.length} classes across ${workerTasks.length} workers`);

  // Phase 3: Execute all workers concurrently
  const workerPromises = workerTasks.map((taskClasses, index) => {
    const workerId = index + 1;
    return new ScraperWorker(workerId, config.concurrencyPerWorker, config.outputDir).execute(
      taskClasses
    );
  });

  const workerResults = await Promise.allSettled(workerPromises);

  let totalAddresses = 0;
  for (const result of workerResults) {
    if (result.status === 'fulfilled') {
      for (const addresses of result.value.addresses.values()) {
        totalAddresses += addresses.length;
      }
    } else {
      console.error('[Main] Worker failed:', result.reason);
    }
  }

  // Phase 4: Merge results
  console.log('\n--- PHASE 3: MERGING ---');
  const finalFile = await OutputMerger.mergeClassFiles(config.outputDir);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log(`Completed in ${elapsed}s`);
  console.log(`Total addresses scraped: ${totalAddresses}`);
  console.log(`Per-class CSVs saved in: ${config.outputDir}/`);
  console.log(`Final merged output: ${finalFile}`);
  console.log('='.repeat(60));
}

main().catch((error) => {
  console.error('[Fatal] Scraper failed:', error);
  process.exit(1);
});
