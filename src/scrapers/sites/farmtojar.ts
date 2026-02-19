/**
 * FarmToJar scraper
 * https://farmtojar.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class FarmToJarScraper extends AbstractScraper {
  host(): string {
    return "farmtojar.com";
  }

  /**
   * TODO: Implement custom author() logic
   * Check Python implementation in recipe_scrapers/farmtojar.py
   */
  // author(): ReturnType {
  // 	return undefined;
  // }
}
