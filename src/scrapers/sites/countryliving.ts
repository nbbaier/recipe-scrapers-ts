/**
 * CountryLiving scraper
 * https://countryliving.com/
 */

import type { IngredientGroup } from "../../types/recipe";
import { groupIngredients } from "../../utils/grouping";
import { AbstractScraper } from "../abstract";

export class CountryLivingScraper extends AbstractScraper {
  host(): string {
    return "countryliving.com";
  }

  ingredientGroups(): IngredientGroup[] {
    return groupIngredients(
      this.ingredients(),
      this.$,
      ".ingredients-body h3",
      ".ingredients-body li",
    );
  }
}
