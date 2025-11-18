/**
 * DinnerAtTheZoo scraper
 * https://dinneratthezoo.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class DinnerAtTheZooScraper extends AbstractScraper {
	host(): string {
		return "dinneratthezoo.com";
	}
}
