/**
 * CafeDelites scraper
 * https://cafedelites.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class CafeDelitesScraper extends AbstractScraper {
  host(): string {
    return "cafedelites.com";
  }
}
