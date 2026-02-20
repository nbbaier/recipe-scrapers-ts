/**
 * SouthernLiving scraper
 * https://southernliving.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class SouthernLivingScraper extends AbstractScraper {
  host(): string {
    return "southernliving.com";
  }

  /**
   * TODO: Implement custom yields() logic
   * Check Python implementation in recipe_scrapers/southernliving.py
   */
  // yields(): ReturnType {
  // 	return undefined;
  // }
}
