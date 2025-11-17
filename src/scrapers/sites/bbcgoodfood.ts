/**
 * BBC Good Food scraper
 * https://www.bbcgoodfood.com/
 *
 * Uses ingredient grouping to organize ingredients by section.
 */

import type { IngredientGroup } from "../../types/recipe";
import { groupIngredients } from "../../utils/grouping";
import { AbstractScraper } from "../abstract";

export class BBCGoodFoodScraper extends AbstractScraper {
	host(): string {
		return "bbcgoodfood.com";
	}

	/**
	 * Extract ingredient groups with section headings
	 */
	ingredientGroups(): IngredientGroup[] {
		return groupIngredients(
			this.ingredients(),
			this.$,
			".recipe__ingredients h3",
			".recipe__ingredients li",
		);
	}
}
