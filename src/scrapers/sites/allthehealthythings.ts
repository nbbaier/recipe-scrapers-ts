/**
 * AllTheHealthyThings scraper
 * https://allthehealthythings.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class AllTheHealthyThingsScraper extends AbstractScraper {
	host(): string {
		return "allthehealthythings.com";
	}

	/**
	 * TODO: Implement custom ingredient_groups() logic
	 * Check Python implementation in recipe_scrapers/allthehealthythings.py
	 */
	// ingredient_groups(): ReturnType {
	// 	return undefined;
	// }
}
