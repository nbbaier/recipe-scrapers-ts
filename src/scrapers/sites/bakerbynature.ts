/**
 * BakerByNature scraper
 * https://bakerbynature.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class BakerByNatureScraper extends AbstractScraper {
	host(): string {
		return "bakerbynature.com";
	}
}
