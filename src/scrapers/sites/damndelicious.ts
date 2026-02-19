/**
 * DamnDelicious scraper
 * https://damndelicious.net/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class DamnDeliciousScraper extends AbstractScraper {
  host(): string {
    return "damndelicious.net";
  }
}
