/**
 * JamieOliver scraper
 * https://jamieoliver.com/
 */

import type { IngredientGroup } from "../../types/recipe";
import { normalizeString } from "../../utils";
import { groupIngredients } from "../../utils/grouping";
import { AbstractScraper } from "../abstract";

export class JamieOliverScraper extends AbstractScraper {
  host(): string {
    return "jamieoliver.com";
  }

  instructions(): string {
    const methodHeading = this.$("h2").filter((_, el) =>
      this.$(el).text().trim() === "Method"
    );
    // Python uses find_next("ol") which searches forward in document order
    // In cheerio, search within the parent container
    const instructionsList = methodHeading.parent().find("ol");
    const instructions: string[] = [];
    instructionsList.find("li").each((_, el) => {
      const text = normalizeString(this.$(el).text());
      if (text) {
        instructions.push(text);
      }
    });
    return instructions.join("\n");
  }

  ingredients(): string[] {
    const ingredientsList = this.$(".ingredients-rich-text p.type-body");
    const ingredients: string[] = [];
    ingredientsList.each((_, el) => {
      const text = normalizeString(this.$(el).text());
      if (text) {
        ingredients.push(text);
      }
    });
    return ingredients;
  }

  ingredientGroups(): IngredientGroup[] {
    return groupIngredients(
      this.ingredients(),
      this.$,
      ".ingredients-rich-text p.type-h5",
      ".ingredients-rich-text p.type-body",
    );
  }
}
