/**
 * Common utilities and constants shared across migration/generation scripts
 */

/**
 * Regular expression to match scraper class names in TypeScript files.
 * Assumes all scraper class names end with 'Scraper' (current convention).
 *
 * Example matches:
 * - export class AllRecipesScraper
 * - export class BBCGoodFoodScraper
 *
 * Capture group 1: Full class name including 'Scraper' suffix
 */
export const SCRAPER_CLASS_NAME_REGEX = /export class (\w+Scraper)/;
