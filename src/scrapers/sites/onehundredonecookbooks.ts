/**
 * OneHundredOneCookBooks scraper
 * https://101cookbooks.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class OneHundredOneCookBooksScraper extends AbstractScraper {
  host(): string {
    return "101cookbooks.com";
  }
}
