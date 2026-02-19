/**
 * FeastingAtHome scraper
 * https://feastingathome.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class FeastingAtHomeScraper extends AbstractScraper {
  host(): string {
    return "feastingathome.com";
  }
}
