/**
 * FineDiningLovers scraper
 * https://finedininglovers.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class FineDiningLoversScraper extends AbstractScraper {
	host(): string {
		return "finedininglovers.com";
	}

	/**
	 * TODO: Implement custom site_name() logic
	 * Check Python implementation in recipe_scrapers/finedininglovers.py
	 */
	// site_name(): ReturnType {
	// 	return undefined;
	// }
}
