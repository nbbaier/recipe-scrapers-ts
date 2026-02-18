/**
 * Plugin System Exports
 *
 * All plugins for recipe-scrapers.
 * Plugins wrap scraper methods to add cross-cutting functionality.
 */

export { BestImagePlugin } from "./best-image";
export { ExceptionHandlingPlugin } from "./exception-handling";
export { HTMLTagStripperPlugin } from "./html-tag-stripper";
export { PluginInterface } from "./interface";
export { NormalizeStringPlugin } from "./normalize-string";
export { OpenGraphFillPlugin } from "./opengraph-fill";
export { OpenGraphImageFetchPlugin } from "./opengraph-image-fetch";
export { SchemaOrgFillPlugin } from "./schemaorg-fill";
export { StaticValueExceptionHandlingPlugin } from "./static-value-exception-handling";
