/**
 * Delish scraper
 * https://www.delish.com/
 *
 * Uses ingredient grouping to organize ingredients by section.
 */

import type { IngredientGroup } from "../../types/recipe";
import { groupIngredients } from "../../utils/grouping";
import { AbstractScraper } from "../abstract";

export class DelishScraper extends AbstractScraper {
	host(): string {
		return "delish.com";
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
}
