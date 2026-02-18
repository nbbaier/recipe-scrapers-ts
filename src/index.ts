/**
 * recipe-scrapers TypeScript
 *
 * TypeScript port of the popular Python recipe-scrapers library.
 * Extract recipe data from 518+ cooking websites.
 */

// Exception exports
export {
	ElementNotFoundInHtml,
	FieldNotProvidedByWebsiteException,
	FillPluginException,
	NoSchemaFoundInWildMode,
	OpenGraphException,
	RecipeSchemaNotFound,
	RecipeScrapersException,
	SchemaOrgException,
	StaticValueException,
	WebsiteNotImplementedError,
} from "./exceptions";
// Factory exports
export {
	getSupportedUrls,
	isSupported,
	registerScraper,
	SCRAPERS,
	SchemaScraper,
	type ScrapeOptions,
	scrapeHtml,
} from "./factory";
export { OpenGraph } from "./parsers/opengraph";
// Parser exports
export { SchemaOrg } from "./parsers/schema-org";
// Plugin exports
export * from "./plugins";
// Scraper exports
export { AbstractScraper } from "./scrapers/abstract";
export * from "./scrapers/sites";
// Settings exports
export { resetSettings, settings, updateSettings } from "./settings";
// Type exports
export type { IngredientGroup, Nutrients, Recipe } from "./types/recipe";
export type { ScraperConstructor } from "./types/scraper";

// Utility exports
export * from "./utils";

// Version
export const VERSION = "0.1.0";

import {
	BestImagePlugin,
	ExceptionHandlingPlugin,
	HTMLTagStripperPlugin,
	NormalizeStringPlugin,
	OpenGraphFillPlugin,
	OpenGraphImageFetchPlugin,
	SchemaOrgFillPlugin,
	StaticValueExceptionHandlingPlugin,
} from "./plugins";
// Initialize default plugins
import { configureDefaultPlugins } from "./settings";

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
