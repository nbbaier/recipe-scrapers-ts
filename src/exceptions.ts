/**
 * Custom exception classes for recipe-scrapers
 */

/**
 * Base exception class for all recipe-scrapers errors
 */
export class RecipeScrapersException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecipeScrapersException';
    Object.setPrototypeOf(this, RecipeScrapersException.prototype);
  }
}

/**
 * Exception raised when schema.org data is not found or invalid
 */
export class SchemaOrgException extends RecipeScrapersException {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaOrgException';
    Object.setPrototypeOf(this, SchemaOrgException.prototype);
  }
}

/**
 * Exception raised when OpenGraph data is not found or invalid
 */
export class OpenGraphException extends RecipeScrapersException {
  constructor(message: string) {
    super(message);
    this.name = 'OpenGraphException';
    Object.setPrototypeOf(this, OpenGraphException.prototype);
  }
}

/**
 * Exception raised when an expected HTML element is not found
 */
export class ElementNotFoundInHtml extends RecipeScrapersException {
  constructor(message: string) {
    super(message);
    this.name = 'ElementNotFoundInHtml';
    Object.setPrototypeOf(this, ElementNotFoundInHtml.prototype);
  }
}

/**
 * Exception raised when a website scraper is not implemented
 */
export class WebsiteNotImplementedError extends RecipeScrapersException {
  constructor(message: string) {
    super(message);
    this.name = 'WebsiteNotImplementedError';
    Object.setPrototypeOf(this, WebsiteNotImplementedError.prototype);
  }
}

/**
 * Exception raised when no schema.org data is found in wild mode
 */
export class NoSchemaFoundInWildMode extends RecipeScrapersException {
  constructor(message: string) {
    super(message);
    this.name = 'NoSchemaFoundInWildMode';
    Object.setPrototypeOf(this, NoSchemaFoundInWildMode.prototype);
  }
}

/**
 * Exception raised when a fill plugin should try alternate data sources
 */
export class FillPluginException extends RecipeScrapersException {
  constructor(message: string) {
    super(message);
    this.name = 'FillPluginException';
    Object.setPrototypeOf(this, FillPluginException.prototype);
  }
}

/**
 * Exception raised when recipe schema.org data is not found
 */
export class RecipeSchemaNotFound extends SchemaOrgException {
  constructor(message: string) {
    super(message);
    this.name = 'RecipeSchemaNotFound';
    Object.setPrototypeOf(this, RecipeSchemaNotFound.prototype);
  }
}

/**
 * Base exception for static value returns
 */
export class StaticValueException extends RecipeScrapersException {
  // biome-ignore lint/suspicious/noExplicitAny: returnValue can be of any type for fallback values
  returnValue: any;

  // biome-ignore lint/suspicious/noExplicitAny: returnValue can be of any type for fallback values
  constructor(message: string, returnValue?: any) {
    super(message);
    this.name = 'StaticValueException';
    this.returnValue = returnValue;
    Object.setPrototypeOf(this, StaticValueException.prototype);
  }
}

/**
 * Exception raised when a field is not provided by the website
 */
export class FieldNotProvidedByWebsiteException extends StaticValueException {
  // biome-ignore lint/suspicious/noExplicitAny: returnValue can be of any type for fallback values
  constructor(message: string, returnValue?: any) {
    super(message, returnValue);
    this.name = 'FieldNotProvidedByWebsiteException';
    Object.setPrototypeOf(this, FieldNotProvidedByWebsiteException.prototype);
  }
}

/**
 * Exception raised when a method is not implemented by a scraper
 */
export class NotImplementedError extends RecipeScrapersException {
  constructor(message: string) {
    super(message);
    this.name = 'NotImplementedError';
    Object.setPrototypeOf(this, NotImplementedError.prototype);
  }
}
