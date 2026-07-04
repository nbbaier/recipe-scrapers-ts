/**
 * TheKitchn scraper
 * https://thekitchn.com/
 */

import type { IngredientGroup } from "../../types/recipe";
import { groupIngredients } from "../../utils/grouping";
import { AbstractScraper } from "../abstract";

export class TheKitchnScraper extends AbstractScraper {
  host(): string {
    return "thekitchn.com";
  }

  ingredientGroups(): IngredientGroup[] {
    return groupIngredients(
      this.ingredients(),
      this.$,
      ".Recipe__ingredientsGroupName",
      ".Recipe__ingredient"
    );
  }
}
