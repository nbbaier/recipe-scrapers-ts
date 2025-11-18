/**
 * MarthaStewart scraper
 * https://marthastewart.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class MarthaStewartScraper extends AbstractScraper {
	host(): string {
		return "marthastewart.com";
	}
}
