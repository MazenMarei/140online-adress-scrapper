import * as cheerio from 'cheerio';

export class HtmlParser {
  static extractClassUrls(html: string, baseUrl: string): Map<string, string> {
    const $ = cheerio.load(html);
    const classUrls = new Map<string, string>();

    $('span').each((_, element) => {
      const id = $(element).attr('id');
      if (id && id.endsWith('Class')) {
        $(element)
          .find('a')
          .each((_, anchor) => {
            const href = $(anchor).attr('href');
            if (href && href.includes('Class/')) {
              let fullUrl: string;
              if (href.startsWith('http')) {
                fullUrl = href;
              } else {
                // Ensure proper path joining with leading slash
                const pathPart = href.startsWith('/') ? href : '/' + href;
                fullUrl = baseUrl + pathPart;
              }

              const match = fullUrl.match(/\/Class\/(\d+)\/(.*)$/);
              if (match) {
                const classId = match[1];
                const slug = decodeURIComponent(match[2] || '');
                const key = `${classId}_${slug}`;
                if (!classUrls.has(key)) {
                  classUrls.set(key, fullUrl);
                }
              }
            }
          });
      }
    });

    return classUrls;
  }

  static extractAddresses(html: string): string[] {
    const $ = cheerio.load(html);
    const addresses: string[] = [];

    $('span').each((_, element) => {
      const id = $(element).attr('id');
      if (id && id.endsWith('Address')) {
        const text = $(element).text().trim();
        if (text.length > 0) {
          addresses.push(text);
        }
      }
    });

    return addresses;
  }

  static hasMorePages(html: string): boolean {
    const $ = cheerio.load(html);
    let hasPagination = false;
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('/pages/')) {
        hasPagination = true;
      }
    });
    return hasPagination;
  }
}
