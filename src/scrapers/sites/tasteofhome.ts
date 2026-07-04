/**
 * TasteOfHome scraper
 * https://tasteofhome.com/
 */

import { normalizeString } from "../../utils";
import { AbstractScraper } from "../abstract";

export class TasteOfHomeScraper extends AbstractScraper {
  host(): string {
    return "tasteofhome.com";
  }

  instructions(): string {
    const items = this.$("li.recipe-directions__item");
    if (items.length > 0) {
      const instructions: string[] = [];
      items.each((_, el) => {
        const text = normalizeString(this.$(el).text());
        if (text) {
          instructions.push(text);
        }
      });
      return instructions.join("\n");
    }
    return this.schema.instructions();
  }
}
