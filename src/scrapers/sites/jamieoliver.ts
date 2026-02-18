/**
 * JamieOliver scraper
 * https://jamieoliver.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class JamieOliverScraper extends AbstractScraper {
	host(): string {
		return "jamieoliver.com";
	}

	/**
	 * TODO: Implement custom instructions() logic
	 * Check Python implementation in recipe_scrapers/jamieoliver.py
	 */
	// instructions(): ReturnType {
	// 	return undefined;
	// }

	/**
	 * TODO: Implement custom ingredients() logic
	 * Check Python implementation in recipe_scrapers/jamieoliver.py
	 */
	// ingredients(): ReturnType {
	// 	return undefined;
	// }

	/**
	 * TODO: Implement custom ingredient_groups() logic
	 * Check Python implementation in recipe_scrapers/jamieoliver.py
	 */
	// ingredient_groups(): ReturnType {
	// 	return undefined;
	// }
}
