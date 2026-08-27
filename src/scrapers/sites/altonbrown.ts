/**
 * AltonBrown scraper
 * https://altonbrown.com/
 *
 * Uses WordPress Recipe Maker (WPRM) plugin for equipment extraction
 */

import { getEquipment, normalizeString } from "../../utils";
import { AbstractScraper } from "../abstract";

const TRAILING_ASTERISK_PATTERN = /\*$/;

export class AltonBrownScraper extends AbstractScraper {
  host(): string {
    return "altonbrown.com";
  }

  equipment(): string[] {
    const equipmentItems = this.$(".wprm-recipe-equipment-name")
      .map((_, elem) => {
        const text = this.$(elem).text();
        return text
          ? normalizeString(text.replace(TRAILING_ASTERISK_PATTERN, ""))
          : "";
      })
      .get()
      .filter(Boolean);

    return getEquipment(equipmentItems);
  }
}
