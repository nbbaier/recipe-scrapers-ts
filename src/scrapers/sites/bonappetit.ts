/**
 * Bon Appétit scraper
 * https://www.bonappetit.com/
 *
 * Overrides total_time to return null as the site doesn't provide reliable total time data.
 */

import { AbstractScraper } from "../abstract";

export class BonAppetitScraper extends AbstractScraper {
	host(): string {
		return "bonappetit.com";
	}

	/**
	 * Total time is not reliably available for Bon Appétit recipes
	 */
	totalTime(): number | null {
		return null;
	}
}
