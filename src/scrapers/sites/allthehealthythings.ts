/**
 * AllTheHealthyThings scraper
 * https://allthehealthythings.com/
 */

import type { IngredientGroup } from "../../types/recipe";
import { groupIngredients } from "../../utils/grouping";
import { AbstractScraper } from "../abstract";

export class AllTheHealthyThingsScraper extends AbstractScraper {
  host(): string {
    return "allthehealthythings.com";
  }

  ingredientGroups(): IngredientGroup[] {
    return groupIngredients(
      this.ingredients(),
      this.$,
      ".tasty-recipes-ingredients-body strong",
      ".tasty-recipes-ingredients-body li"
    );
  }
}
