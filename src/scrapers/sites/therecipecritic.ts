/**
 * TheRecipeCritic scraper
 * https://therecipecritic.com/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class TheRecipeCriticScraper extends AbstractScraper {
	host(): string {
		return "therecipecritic.com";
	}

	/**
	 * TODO: Implement custom author() logic
	 * Check Python implementation in recipe_scrapers/therecipecritic.py
	 */
	// author(): ReturnType {
	// 	return undefined;
	// }
}
