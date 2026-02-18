/**
 * HalfBakedHarvest scraper
 * https://halfbakedharvest.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class HalfBakedHarvestScraper extends AbstractScraper {
	host(): string {
		return "halfbakedharvest.com";
	}
}
