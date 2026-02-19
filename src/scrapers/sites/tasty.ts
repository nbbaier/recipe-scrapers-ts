/**
 * Tasty scraper
 * https://tasty.co/
 *
 * Uses ingredient grouping to organize ingredients by section.
 */

import type { IngredientGroup } from "../../types/recipe";
import { groupIngredients } from "../../utils/grouping";
import { AbstractScraper } from "../abstract";

export class TastyScraper extends AbstractScraper {
  host(): string {
    return "tasty.co";
  }

  /**
   * Extract ingredient groups with section headings
   */
  ingredientGroups(): IngredientGroup[] {
    return groupIngredients(
      this.ingredients(),
      this.$,
      ".ingredient-section-name",
      ".ingredient",
    );
  }
}
