/**
 * AmbitiousKitchen scraper
 * https://ambitiouskitchen.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class AmbitiousKitchenScraper extends AbstractScraper {
  host(): string {
    return "ambitiouskitchen.com";
  }
}
