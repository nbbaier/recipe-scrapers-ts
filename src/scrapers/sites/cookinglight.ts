/**
 * CookingLight scraper
 * https://cookinglight.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class CookingLightScraper extends AbstractScraper {
  host(): string {
    return "cookinglight.com";
  }

  /**
   * TODO: Implement custom ingredients() logic
   * Check Python implementation in recipe_scrapers/cookinglight.py
   */
  // ingredients(): ReturnType {
  // 	return undefined;
  // }

  /**
   * TODO: Implement custom instructions() logic
   * Check Python implementation in recipe_scrapers/cookinglight.py
   */
  // instructions(): ReturnType {
  // 	return undefined;
  // }

  /**
   * TODO: Implement custom ratings() logic
   * Check Python implementation in recipe_scrapers/cookinglight.py
   */
  // ratings(): ReturnType {
  // 	return undefined;
  // }
}
