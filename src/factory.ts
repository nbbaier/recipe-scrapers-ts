/**
 * Factory Pattern for Recipe Scrapers
 *
 * Provides scraper selection and instantiation based on URL domain.
 */

import {
	NoSchemaFoundInWildMode,
	WebsiteNotImplementedError,
} from "./exceptions";
import { AbstractScraper } from "./scrapers/abstract";
import { SCRAPER_REGISTRY } from "./scrapers/sites";
import type { ScraperConstructor } from "./types/scraper";
import { getHostName } from "./utils/url";

// Re-export ScraperConstructor for backwards compatibility
export type { ScraperConstructor } from "./types/scraper";

/**
 * Generic Schema.org-based scraper for wild mode (unsupported domains)
 *
 * This is a minimal scraper that relies entirely on Schema.org data.
 * All recipe data is extracted via the SchemaOrgFillPlugin, which catches
 * NotImplementedError and falls back to schema methods automatically.
 */
export class SchemaScraper extends AbstractScraper {
	override host(): string {
		return getHostName(this.url);
	}

	// Equipment is not available in Schema.org, return empty array
	override equipment(): string[] {
		return [];
	}
}

/**
 * Registry of all supported scrapers
 * Maps hostname to scraper class
 *
 * This is populated from SCRAPER_REGISTRY in scrapers/sites/index.ts
 * Additional scrapers can be added via registerScraper()
 */
export const SCRAPERS: Record<string, ScraperConstructor> = {
	...SCRAPER_REGISTRY,
};

/**
 * Options for scrapeHtml function
 */
export interface ScrapeOptions {
	/** Whether to restrict to supported domains only (default: true) */
	supportedOnly?: boolean;
	/** Whether to enable best image selection (default: from settings) */
	bestImage?: boolean;
}

/**
 * Main entry point for scraping recipes from HTML
 *
 * @param html - HTML content of the recipe page
 * @param url - URL of the recipe
 * @param options - Scraping options
 * @returns Scraper instance for the recipe
 *
 * @throws {WebsiteNotImplementedError} When domain is not supported and supportedOnly is true
 * @throws {NoSchemaFoundInWildMode} When domain is not supported and no Schema.org data found
 */
export function scrapeHtml(
	html: string,
	url: string,
	options: ScrapeOptions = {},
): AbstractScraper {
	const { supportedOnly = true, bestImage } = options;

	const hostName = getHostName(url);

	// Check if we have a specific scraper for this domain
	const ScraperClass = SCRAPERS[hostName];
	if (ScraperClass) {
		return new ScraperClass(html, url, bestImage);
	}

	// Domain not supported
	if (supportedOnly) {
		const message = `The website '${hostName}' isn't currently supported by recipe-scrapers!
---
If you have time to help us out, please report this as a feature
request on our bugtracker.`;
		throw new WebsiteNotImplementedError(message);
	}

	// Wild mode: try generic Schema.org scraping
	const schemaScraper = new SchemaScraper(html, url, bestImage);
	if (schemaScraper.hasSchema()) {
		return schemaScraper;
	}

	throw new NoSchemaFoundInWildMode(`No Schema.org data found at URL: ${url}`);
}

/**
 * Register a scraper class for a specific domain
 *
 * Use this to add scrapers at runtime or for custom scrapers
 * not included in the default registry.
 *
 * @param hostname - Domain name (e.g., 'allrecipes.com')
 * @param scraperClass - Scraper class to use for this domain
 */
export function registerScraper(
	hostname: string,
	scraperClass: ScraperConstructor,
): void {
	SCRAPERS[hostname] = scraperClass;
}

/**
 * Get list of all supported domains
 *
 * @returns Array of supported domain names
 */
export function getSupportedUrls(): string[] {
	return Object.keys(SCRAPERS).sort();
}

/**
 * Check if a URL is supported
 *
 * @param url - URL to check
 * @returns True if the domain is supported
 */
export function isSupported(url: string): boolean {
	const hostName = getHostName(url);
	return hostName in SCRAPERS;
}
