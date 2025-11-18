/**
 * GimmeSomeOven scraper
 * https://gimmesomeoven.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class GimmeSomeOvenScraper extends AbstractScraper {
	host(): string {
		return "gimmesomeoven.com";
	}
}
