/**
 * BettyCrocker scraper
 * https://bettycrocker.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class BettyCrockerScraper extends AbstractScraper {
	host(): string {
		return "bettycrocker.com";
	}

	/**
	 * TODO: Implement custom ingredient_groups() logic
	 * Check Python implementation in recipe_scrapers/bettycrocker.py
	 */
	// ingredient_groups(): ReturnType {
	// 	return undefined;
	// }
}
