/**
 * Scraper type definitions
 */

import type { AbstractScraper } from "../scrapers/abstract";

/**
 * Type for scraper constructor
 */
export type ScraperConstructor = new (
	html: string,
	url: string,
	bestImage?: boolean,
) => AbstractScraper;
