/**
 * ClosetCooking scraper
 * https://closetcooking.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class ClosetCookingScraper extends AbstractScraper {
  host(): string {
    return "closetcooking.com";
  }
}
