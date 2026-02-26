/**
 * AbuelasCounter scraper
 * https://abuelascounter.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class AbuelasCounterScraper extends AbstractScraper {
  host(): string {
    return "abuelascounter.com";
  }

  /**
   * TODO: Implement custom ingredient_groups() logic
   * Check Python implementation in recipe_scrapers/abuelascounter.py
   */
  // ingredient_groups(): ReturnType {
  // 	return undefined;
  // }
}
