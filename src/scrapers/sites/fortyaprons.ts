/**
 * FortyAprons scraper
 * https://40aprons.com/
 */

import type { IngredientGroup } from "../../types/recipe";
import { groupIngredients } from "../../utils/grouping";
import { AbstractScraper } from "../abstract";

export class FortyApronsScraper extends AbstractScraper {
  host(): string {
    return "40aprons.com";
  }

  ingredientGroups(): IngredientGroup[] {
    return groupIngredients(
      this.ingredients(),
      this.$,
      "h4.wprm-recipe-group-name",
      "li.wprm-recipe-ingredient"
    );
  }
}
