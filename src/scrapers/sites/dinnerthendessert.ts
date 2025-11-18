/**
 * DinnerThenDessert scraper
 * https://dinnerthendessert.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class DinnerThenDessertScraper extends AbstractScraper {
	host(): string {
		return "dinnerthendessert.com";
	}
}
