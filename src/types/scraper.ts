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
  bestImage?: boolean
) => AbstractScraper;

/**
 * Hostname -> scraper class registry.
 * Open by design: `registerScraper()` extends it at runtime.
 */
export type ScraperRegistry = Record<string, ScraperConstructor>;
