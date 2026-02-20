/**
 * AverieCooks scraper
 * https://averiecooks.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class AverieCooksScraper extends AbstractScraper {
  host(): string {
    return "averiecooks.com";
  }
}
