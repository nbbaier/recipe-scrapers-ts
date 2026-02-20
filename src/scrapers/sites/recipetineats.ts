/**
 * RecipeTinEats scraper
 * https://recipetineats.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class RecipeTinEatsScraper extends AbstractScraper {
  host(): string {
    return "recipetineats.com";
  }
}
