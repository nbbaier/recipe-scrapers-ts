/**
 * CookieAndKate scraper
 * https://cookieandkate.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class CookieAndKateScraper extends AbstractScraper {
  host(): string {
    return "cookieandkate.com";
  }
}
