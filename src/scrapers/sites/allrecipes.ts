/**
 * AllRecipes scraper
 * https://www.allrecipes.com/
 *
 * This is a minimal scraper that relies entirely on Schema.org data.
 * All recipe data is extracted via the SchemaOrgFillPlugin.
 */

import { AbstractScraper } from '../abstract';

export class AllRecipesScraper extends AbstractScraper {
  host(): string {
    return 'allrecipes.com';
  }
}
