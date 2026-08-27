/**
 * TwentyFourKitchen scraper
 * https://24kitchen.nl/
 */

import type { IngredientGroup } from "../../types/recipe";
import { groupIngredients } from "../../utils/grouping";
import { AbstractScraper } from "../abstract";

const STEP_PREFIX_PATTERN = /^Stap\s*\d+:?/;

export class TwentyFourKitchenScraper extends AbstractScraper {
  host(): string {
    return "24kitchen.nl";
  }

  ingredientGroups(): IngredientGroup[] {
    const groups = groupIngredients(
      this.ingredients(),
      this.$,
      ".ingredient-list-title",
      ".recipe-ingredient"
    );
    if (
      groups.length === 1 &&
      groups[0].purpose &&
      groups[0].purpose.trim() === this.schema.title()
    ) {
      groups[0].purpose = null;
    }
    return groups;
  }

  instructions(): string {
    const instructions: string[] = [];

    // Instructions format #1
    this.$(".preparation-step .field--name-field-text").each((_, el) => {
      const text = this.$(el).text().trim();
      if (!text.toLowerCase().startsWith("stap:")) {
        instructions.push(text);
      }
    });

    // Instructions format #2
    this.$(".preparation-text p").each((_, el) => {
      const text = this.$(el).text().trim();
      const cleaned = text.replace(STEP_PREFIX_PATTERN, "").trim();
      if (cleaned) {
        instructions.push(cleaned);
      }
    });

    return instructions.join("\n");
  }
}
