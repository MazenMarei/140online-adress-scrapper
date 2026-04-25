import axios, { AxiosInstance } from 'axios';
import { RetryConfig } from '../types/index.js';

export class HttpFetcher {
  private client: AxiosInstance;

  constructor(timeoutMs: number) {
    this.client = axios.create({
      timeout: timeoutMs,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
  }

  async fetchWithRetry(url: string, retryConfig: RetryConfig): Promise<string> {
    let lastError: Error | null = null;
    const { maxRetries, baseDelayMs, maxDelayMs } = retryConfig;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.get(url);
        return response.data;
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries) {
          const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
          console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed for ${url}. Waiting ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`Failed to fetch ${url} after ${maxRetries} retries: ${lastError?.message}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
