/**
 * The Pioneer Woman scraper
 * https://www.thepioneerwoman.com/
 *
 * Uses ingredient grouping and custom instructions extraction.
 */

import type { IngredientGroup } from "../../types/recipe";
import { groupIngredients } from "../../utils/grouping";
import { AbstractScraper } from "../abstract";

export class ThePioneerWomanScraper extends AbstractScraper {
  host(): string {
    return "thepioneerwoman.com";
  }

  /**
   * Extract ingredient groups with section headings
   */
  ingredientGroups(): IngredientGroup[] {
    return groupIngredients(
      this.ingredients(),
      this.$,
      ".ingredients-body h3",
      ".ingredient-lists li",
    );
  }

  /**
   * Extract instructions with fallback to custom selector
   */
  instructions(): string {
    let instructions = this.schema.instructions();

    // If schema.org instructions are empty, try custom selector
    if (instructions === "") {
      const directionsElement = this.$(".directions");
      if (directionsElement.length > 0) {
        instructions = directionsElement.text();
      }
    }

    return instructions;
  }
}
