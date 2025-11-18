/**
 * TasteOfHome scraper
 * https://tasteofhome.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class TasteOfHomeScraper extends AbstractScraper {
	host(): string {
		return "tasteofhome.com";
	}

	/**
	 * TODO: Implement custom instructions() logic
	 * Check Python implementation in recipe_scrapers/tasteofhome.py
	 */
	// instructions(): ReturnType {
	// 	return undefined;
	// }
}
