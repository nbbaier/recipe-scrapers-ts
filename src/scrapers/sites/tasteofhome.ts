/**
 * TasteOfHome scraper
 * https://tasteofhome.com/
 */

import { AbstractScraper } from "../abstract";
import { normalizeString } from "../../utils";

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
