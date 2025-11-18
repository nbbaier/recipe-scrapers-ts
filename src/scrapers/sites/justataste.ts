/**
 * JustATaste scraper
 * https://justataste.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class JustATasteScraper extends AbstractScraper {
	host(): string {
		return "justataste.com";
	}
}
