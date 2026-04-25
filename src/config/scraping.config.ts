import { ScraperConfig } from '../types/index.js';
import os from 'node:os';

const totalCores = os.availableParallelism ? os.availableParallelism() : os.cpus().length;

export const config: ScraperConfig = {
  baseUrl: 'https://www.140online.com',
  classesPageUrl: 'https://www.140online.com/moreclasses.aspx',
  classLimit: 3, // Quick test - set to null for full run (~553 classes)
  concurrencyPerWorker: 2,
  requestTimeoutMs: 20000,
  delayBetweenRequestsMs: 800,
  retryConfig: {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 8000,
  },
  outputDir: './output',
};

export const availableThreads = totalCores;
