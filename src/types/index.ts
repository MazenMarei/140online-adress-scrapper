export interface ClassUrl {
  classId: string;
  slug: string;
  baseUrl: string;
}

export interface ScrapedAddress {
  address: string;
}

export interface WorkerTask {
  workerId: number;
  classUrls: ClassUrl[];
}

export interface WorkerResult {
  workerId: number;
  addresses: ScrapedAddress[];
  outputFile: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export interface ScraperConfig {
  baseUrl: string;
  classesPageUrl: string;
  classLimit: number | null;
  concurrencyPerWorker: number;
  requestTimeoutMs: number;
  delayBetweenRequestsMs: number;
  retryConfig: RetryConfig;
  outputDir: string;
}
