/**
 * TheKitchn scraper
 * https://thekitchn.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class TheKitchnScraper extends AbstractScraper {
	host(): string {
		return "thekitchn.com";
	}

	/**
	 * TODO: Implement custom ingredient_groups() logic
	 * Check Python implementation in recipe_scrapers/thekitchn.py
	 */
	// ingredient_groups(): ReturnType {
	// 	return undefined;
	// }

	/**
	 * TODO: Implement custom site_name() logic
	 * Check Python implementation in recipe_scrapers/thekitchn.py
	 */
	// site_name(): ReturnType {
	// 	return undefined;
	// }
}
