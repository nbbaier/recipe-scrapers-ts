/**
 * FifteenGram scraper
 * https://15gram.be/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class FifteenGramScraper extends AbstractScraper {
  host(): string {
    return "15gram.be";
  }

  /**
   * TODO: Implement custom canonical_url() logic
   * Check Python implementation in recipe_scrapers/fifteengram.py
   */
  // canonical_url(): ReturnType {
  // 	return undefined;
  // }

  /**
   * TODO: Implement custom author() logic
   * Check Python implementation in recipe_scrapers/fifteengram.py
   */
  // author(): ReturnType {
  // 	return undefined;
  // }
}
