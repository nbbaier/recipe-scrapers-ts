/**
 * ThreeSixFiveDaysOfBakingAndMore scraper
 * https://365daysofbakingandmore.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class ThreeSixFiveDaysOfBakingAndMoreScraper extends AbstractScraper {
  host(): string {
    return "365daysofbakingandmore.com";
  }
}
