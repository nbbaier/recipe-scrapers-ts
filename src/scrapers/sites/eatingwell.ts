/**
 * EatingWell scraper
 * https://eatingwell.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class EatingWellScraper extends AbstractScraper {
	host(): string {
		return "eatingwell.com";
	}
}
