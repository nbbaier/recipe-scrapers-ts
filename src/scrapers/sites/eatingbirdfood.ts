/**
 * EatingBirdFood scraper
 * https://eatingbirdfood.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class EatingBirdFoodScraper extends AbstractScraper {
  host(): string {
    return "eatingbirdfood.com";
  }
}
