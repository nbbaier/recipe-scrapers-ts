/**
 * Food52 scraper
 * https://food52.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class Food52Scraper extends AbstractScraper {
	host(): string {
		return "food52.com";
	}
}
