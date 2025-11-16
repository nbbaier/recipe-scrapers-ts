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

// Factory exports
export {
  scrapeHtml,
  registerScraper,
  getSupportedUrls,
  isSupported,
  SchemaScraper,
  SCRAPERS,
  type ScrapeOptions,
} from './factory';

// Exception exports
export {
  RecipeScrapersException,
  ElementNotFoundInHtml,
  SchemaOrgException,
  OpenGraphException,
  WebsiteNotImplementedError,
  NoSchemaFoundInWildMode,
  FillPluginException,
  RecipeSchemaNotFound,
  StaticValueException,
  FieldNotProvidedByWebsiteException,
} from './exceptions';

// Plugin exports
export * from './plugins';

// Settings exports
export { settings, updateSettings, resetSettings } from './settings';

// Utility exports
export * from './utils';

// Version
export const VERSION = '0.1.0';

// Initialize default plugins
import { configureDefaultPlugins } from './settings';
import {
  ExceptionHandlingPlugin,
  BestImagePlugin,
  StaticValueExceptionHandlingPlugin,
  HTMLTagStripperPlugin,
  NormalizeStringPlugin,
  OpenGraphImageFetchPlugin,
  OpenGraphFillPlugin,
  SchemaOrgFillPlugin,
} from './plugins';

configureDefaultPlugins([
  ExceptionHandlingPlugin,
  BestImagePlugin,
  StaticValueExceptionHandlingPlugin,
  HTMLTagStripperPlugin,
  NormalizeStringPlugin,
  OpenGraphImageFetchPlugin,
  OpenGraphFillPlugin,
  SchemaOrgFillPlugin,
]);
