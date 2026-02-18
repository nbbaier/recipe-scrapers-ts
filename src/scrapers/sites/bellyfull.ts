/**
 * BellyFull scraper
 * https://bellyfull.net/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class BellyFullScraper extends AbstractScraper {
	host(): string {
		return "bellyfull.net";
	}
}
