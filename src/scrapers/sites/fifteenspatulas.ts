/**
 * FifteenSpatulas scraper
 * https://fifteenspatulas.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class FifteenSpatulasScraper extends AbstractScraper {
	host(): string {
		return "fifteenspatulas.com";
	}
}
