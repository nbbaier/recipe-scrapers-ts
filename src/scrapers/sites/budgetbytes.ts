/**
 * BudgetBytes scraper
 * https://budgetbytes.com/
 *
 * Uses WordPress Recipe Maker (WPRM) plugin for equipment extraction
 */

import { AbstractScraper } from "../abstract";
import { getEquipment, normalizeString } from "../../utils";

export class BudgetBytesScraper extends AbstractScraper {
	host(): string {
		return "budgetbytes.com";
	}

	/**
	 * Extract equipment from WPRM plugin markup
	 */
	equipment(): string[] {
		const equipmentItems = this.$(".wprm-recipe-equipment-name")
			.map((_, elem) => {
				const text = this.$(elem).text();
				return text ? normalizeString(text.replace(/\*$/, "")) : "";
			})
			.get()
			.filter(Boolean);

		return getEquipment(equipmentItems);
	}
}
