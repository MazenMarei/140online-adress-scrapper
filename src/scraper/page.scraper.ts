import { ClassUrl } from '../types/index.js';
import { HttpFetcher } from '../utils/http.fetcher.js';
import { HtmlParser } from '../utils/html.parser.js';
import { config } from '../config/scraping.config.js';

export class PageScraper {
  private fetcher: HttpFetcher;

  constructor() {
    this.fetcher = new HttpFetcher(config.requestTimeoutMs);
  }

  async scrapeClass(classUrl: ClassUrl): Promise<string[]> {
    const allAddresses: string[] = [];
    let pageNumber = 1;

    console.log(`[Scraper] Starting class ${classUrl.classId} (${classUrl.slug})`);

    while (true) {
      let pageUrl: string;
      if (pageNumber === 1) {
        pageUrl = classUrl.baseUrl;
      } else {
        const slugPart = classUrl.slug ? `/${classUrl.slug}` : '';
        pageUrl = `${config.baseUrl}/class/pages/${classUrl.classId}${slugPart}/${pageNumber}/`;
      }

      try {
        const html = await this.fetcher.fetchWithRetry(pageUrl, config.retryConfig);
        const addresses = HtmlParser.extractAddresses(html);

        if (addresses.length === 0) {
          console.log(`[Scraper] No more data on page ${pageNumber} for class ${classUrl.classId}`);
          break;
        }

        allAddresses.push(...addresses);
        console.log(
          `[Scraper] Page ${pageNumber}: Found ${addresses.length} addresses for class ${classUrl.classId}`
        );

        pageNumber++;
        await this.sleep(config.delayBetweenRequestsMs);
      } catch (error: any) {
        console.error(
          `[Scraper] Error scraping page ${pageNumber} for class ${classUrl.classId}:`,
          error.message
        );
        break;
      }
    }

    return allAddresses;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
