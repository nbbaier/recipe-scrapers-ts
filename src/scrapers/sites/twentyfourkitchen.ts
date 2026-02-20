/**
 * TwentyFourKitchen scraper
 * https://24kitchen.nl/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class TwentyFourKitchenScraper extends AbstractScraper {
  host(): string {
    return "24kitchen.nl";
  }

  /**
   * TODO: Implement custom ingredient_groups() logic
   * Check Python implementation in recipe_scrapers/twentyfourkitchen.py
   */
  // ingredient_groups(): ReturnType {
  // 	return undefined;
  // }

  /**
   * TODO: Implement custom instructions() logic
   * Check Python implementation in recipe_scrapers/twentyfourkitchen.py
   */
  // instructions(): ReturnType {
  // 	return undefined;
  // }
}
