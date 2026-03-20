/**
 * SallysBakingAddiction scraper
 * https://sallysbakingaddiction.com/
 */

import type { IngredientGroup } from "../../types/recipe";
import { groupIngredients } from "../../utils/grouping";
import { AbstractScraper } from "../abstract";

export class SallysBakingAddictionScraper extends AbstractScraper {
  host(): string {
    return "sallysbakingaddiction.com";
  }

  ingredientGroups(): IngredientGroup[] {
    return groupIngredients(
      this.ingredients(),
      this.$,
      ".tasty-recipes-ingredients-body h4",
      "li[data-tr-ingredient-checkbox]",
    );
  }
}
