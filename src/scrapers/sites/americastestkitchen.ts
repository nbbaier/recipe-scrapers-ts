/**
 * AmericasTestKitchen scraper
 * https://americastestkitchen.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class AmericasTestKitchenScraper extends AbstractScraper {
	host(): string {
		return "americastestkitchen.com";
	}

	/**
	 * TODO: Implement custom ingredients() logic
	 * Check Python implementation in recipe_scrapers/americastestkitchen.py
	 */
	// ingredients(): ReturnType {
	// 	return undefined;
	// }
}
