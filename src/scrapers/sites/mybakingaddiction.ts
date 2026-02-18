/**
 * MyBakingAddiction scraper
 * https://mybakingaddiction.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class MyBakingAddictionScraper extends AbstractScraper {
	host(): string {
		return "mybakingaddiction.com";
	}
}
