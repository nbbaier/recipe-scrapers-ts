/**
 * BettyCrocker scraper
 * https://bettycrocker.com/
 */

import type { IngredientGroup } from "../../types/recipe";
import { groupIngredients } from "../../utils/grouping";
import { AbstractScraper } from "../abstract";

export class BettyCrockerScraper extends AbstractScraper {
  host(): string {
    return "bettycrocker.com";
  }

  ingredientGroups(): IngredientGroup[] {
    return groupIngredients(
      this.ingredients(),
      this.$,
      ".recipeIngredients h3",
      ".recipeIngredients li",
    );
  }
}
