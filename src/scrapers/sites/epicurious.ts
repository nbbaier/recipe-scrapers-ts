/**
 * Epicurious scraper
 * https://www.epicurious.com/
 *
 * Custom author extraction from HTML (itemprop="author").
 */

import { AbstractScraper } from '../abstract';

export class EpicuriousScraper extends AbstractScraper {
  host(): string {
    return 'epicurious.com';
  }

  /**
   * Extract author from itemprop="author" attribute
   */
  author(): string | undefined {
    const authorElement = this.$('a[itemprop="author"]');
    if (authorElement.length > 0) {
      return authorElement.text().trim();
    }
    return undefined;
  }
}
