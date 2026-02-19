/**
 * FoodAndWine scraper
 * https://foodandwine.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class FoodAndWineScraper extends AbstractScraper {
  host(): string {
    return "foodandwine.com";
  }

  /**
   * TODO: Implement custom yields() logic
   * Check Python implementation in recipe_scrapers/foodandwine.py
   */
  // yields(): ReturnType {
  // 	return undefined;
  // }
}
