/**
 * recipe-scrapers TypeScript
 *
 * TypeScript port of the popular Python recipe-scrapers library.
 * Extract recipe data from 518+ cooking websites.
 */

// Type exports
export type { Recipe, IngredientGroup, Nutrients } from './types/recipe';

// Scraper exports
export { AbstractScraper } from './scrapers/abstract';

// Parser exports
export { SchemaOrg } from './parsers/schema-org';
export { OpenGraph } from './parsers/opengraph';

// Exception exports
export {
  RecipeScrapersException,
  ElementNotFoundInHtml,
  SchemaOrgException,
  OpenGraphException,
  WebsiteNotImplementedError,
} from './exceptions';

// Utility exports
export * from './utils';

// Version
export const VERSION = '0.1.0';
