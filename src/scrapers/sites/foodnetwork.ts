/**
 * FoodNetwork scraper
 * https://www.foodnetwork.com/ and https://www.foodnetwork.co.uk/
 *
 * Handles both .com and .co.uk domains with custom author/site name extraction.
 */

import { AbstractScraper } from "../abstract";

export class FoodNetworkScraper extends AbstractScraper {
	/**
	 * Host domain - supports both .com and .co.uk
	 */
	host(): string {
		return "foodnetwork.co.uk";
	}

	/**
	 * Author from copyrightNotice field or fallback to schema author
	 */
	author(): string | undefined {
		const schemaData = (this.schema as any).data;
		if (schemaData?.copyrightNotice) {
			return schemaData.copyrightNotice as string;
		}
		return this.schema.author();
	}

	/**
	 * Site name from schema author
	 */
	siteName(): string {
		return this.schema.author() || "Food Network";
	}
}
