/**
 * Plugin System Exports
 *
 * All plugins for recipe-scrapers.
 * Plugins wrap scraper methods to add cross-cutting functionality.
 */

export { PluginInterface } from './interface';
export { ExceptionHandlingPlugin } from './exception-handling';
export { BestImagePlugin } from './best-image';
export { StaticValueExceptionHandlingPlugin } from './static-value-exception-handling';
export { HTMLTagStripperPlugin } from './html-tag-stripper';
export { NormalizeStringPlugin } from './normalize-string';
export { OpenGraphImageFetchPlugin } from './opengraph-image-fetch';
export { OpenGraphFillPlugin } from './opengraph-fill';
export { SchemaOrgFillPlugin } from './schemaorg-fill';
