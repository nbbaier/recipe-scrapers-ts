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
