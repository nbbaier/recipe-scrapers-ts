/**
 * CulinaryHill scraper
 * https://culinaryhill.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class CulinaryHillScraper extends AbstractScraper {
  host(): string {
    return "culinaryhill.com";
  }

  /**
   * TODO: Implement custom ingredients() logic
   * Check Python implementation in recipe_scrapers/culinaryhill.py
   */
  // ingredients(): ReturnType {
  // 	return undefined;
  // }
}
