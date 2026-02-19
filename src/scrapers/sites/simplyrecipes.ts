/**
 * Simply Recipes scraper
 * https://www.simplyrecipes.com/
 *
 * Custom instructions extraction from structured HTML.
 */

import { normalizeString } from "../../utils/strings";
import { AbstractScraper } from "../abstract";

export class SimplyRecipesScraper extends AbstractScraper {
  host(): string {
    return "simplyrecipes.com";
  }

  /**
   * Extract instructions from structured steps div
   */
  instructions(): string {
    const stepsContainer = this.$("div.structured-project__steps");
    if (stepsContainer.length === 0) {
      // Fallback to schema.org data if custom structure not found
      return this.schema.instructions();
    }

    const orderedList = stepsContainer.find("ol");
    if (orderedList.length === 0) {
      return this.schema.instructions();
    }

    const steps: string[] = [];
    orderedList.find("li").each((_, step) => {
      const $step = this.$(step);
      const divText = $step.find("div").first().text();
      const paragraphTexts = $step
        .find("p")
        .map((_, p) => this.$(p).text())
        .get()
        .join("");
      const fullText = divText + paragraphTexts;
      steps.push(normalizeString(fullText));
    });

    return steps.join("\n");
  }
}
