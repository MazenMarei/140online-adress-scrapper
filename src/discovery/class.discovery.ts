import { ClassUrl } from '../types/index.js';
import { HttpFetcher } from '../utils/http.fetcher.js';
import { HtmlParser } from '../utils/html.parser.js';
import { config } from '../config/scraping.config.js';

export class ClassDiscovery {
  private fetcher: HttpFetcher;

  constructor() {
    this.fetcher = new HttpFetcher(config.requestTimeoutMs);
  }

  async discoverClasses(): Promise<ClassUrl[]> {
    console.log('[Discovery] Fetching classes page...');
    const html = await this.fetcher.fetchWithRetry(
      config.classesPageUrl,
      config.retryConfig
    );

    console.log('[Discovery] Parsing class URLs from HTML...');
    const classUrlsMap = HtmlParser.extractClassUrls(html, config.baseUrl);
    const classes: ClassUrl[] = [];

    for (const [key, url] of classUrlsMap) {
      const match = url.match(/\/Class\/(\d+)(?:\/(.*))?$/);
      if (match) {
        const classId = match[1];
        const slug = match[2] || '';
        classes.push({ classId, slug, baseUrl: url });
      }
    }

    if (config.classLimit !== null && config.classLimit > 0) {
      console.log(`[Discovery] Limiting to ${config.classLimit} classes`);
      return classes.slice(0, config.classLimit);
    }

    console.log(`[Discovery] Found ${classes.length} classes`);
    return classes;
  }
}
