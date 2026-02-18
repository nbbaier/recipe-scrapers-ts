/**
 * CountryLiving scraper
 * https://countryliving.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class CountryLivingScraper extends AbstractScraper {
	host(): string {
		return "countryliving.com";
	}

	/**
	 * TODO: Implement custom author() logic
	 * Check Python implementation in recipe_scrapers/countryliving.py
	 */
	// author(): ReturnType {
	// 	return undefined;
	// }

	/**
	 * TODO: Implement custom ingredient_groups() logic
	 * Check Python implementation in recipe_scrapers/countryliving.py
	 */
	// ingredient_groups(): ReturnType {
	// 	return undefined;
	// }

	/**
	 * TODO: Implement custom keywords() logic
	 * Check Python implementation in recipe_scrapers/countryliving.py
	 */
	// keywords(): ReturnType {
	// 	return undefined;
	// }
}
