/**
 * Minimalistbaker scraper
 * https://minimalistbaker.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class MinimalistbakerScraper extends AbstractScraper {
	host(): string {
		return "minimalistbaker.com";
	}
}
