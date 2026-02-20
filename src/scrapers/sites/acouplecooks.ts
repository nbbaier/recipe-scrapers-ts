/**
 * ACoupleCooks scraper
 * https://acouplecooks.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class ACoupleCooksScraper extends AbstractScraper {
	host(): string {
		return "acouplecooks.com";
	}

	/**
	 * TODO: Implement custom ingredient_groups() logic
	 * Check Python implementation in recipe_scrapers/acouplecooks.py
	 */
	// ingredient_groups(): ReturnType {
	// 	return undefined;
	// }

	/**
	 * TODO: Implement custom ingredients() logic
	 * Check Python implementation in recipe_scrapers/acouplecooks.py
	 */
	// ingredients(): ReturnType {
	// 	return undefined;
	// }
}
