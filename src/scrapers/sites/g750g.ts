/**
 * G750g scraper
 * https://750g.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class G750gScraper extends AbstractScraper {
  host(): string {
    return "750g.com";
  }

  /**
   * TODO: Implement custom site_name() logic
   * Check Python implementation in recipe_scrapers/g750g.py
   */
  // site_name(): ReturnType {
  // 	return undefined;
  // }
}
