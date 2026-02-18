/**
 * SallysBakingAddiction scraper
 * https://sallysbakingaddiction.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class SallysBakingAddictionScraper extends AbstractScraper {
	host(): string {
		return "sallysbakingaddiction.com";
	}

	/**
	 * TODO: Implement custom ingredient_groups() logic
	 * Check Python implementation in recipe_scrapers/sallysbakingaddiction.py
	 */
	// ingredient_groups(): ReturnType {
	// 	return undefined;
	// }
}
