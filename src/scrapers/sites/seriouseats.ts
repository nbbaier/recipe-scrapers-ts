/**
 * Serious Eats scraper
 * https://www.seriouseats.com/
 *
 * This is a minimal scraper that relies entirely on Schema.org data.
 * All recipe data is extracted via the SchemaOrgFillPlugin.
 */

import { AbstractScraper } from '../abstract';

export class SeriousEatsScraper extends AbstractScraper {
  host(): string {
    return 'seriouseats.com';
  }
}
