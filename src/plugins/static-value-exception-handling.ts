/**
 * StaticValueExceptionHandlingPlugin
 *
 * Handles cases where a scraper returns static values or indicates
 * that a field is not provided by the website.
 */

import {
	FieldNotProvidedByWebsiteException,
	StaticValueException,
} from "../exceptions";
import { PluginInterface } from "./interface";

export class StaticValueExceptionHandlingPlugin extends PluginInterface {
	static readonly BUG_REPORT_LINK =
		"https://github.com/hhursev/recipe-scrapers/issues";

	static override runOnHosts = ["*"];
	static override runOnMethods = [
		"author",
		"site_name",
		"language",
		"cuisine",
		"cooking_method",
		"total_time",
		"yields",
	];

	// biome-ignore lint/suspicious/noExplicitAny: decorator pattern requires flexible type signatures
	static override run<T extends (...args: any[]) => any>(decorated: T): T {
		// biome-ignore lint/suspicious/noExplicitAny: decorator pattern requires flexible type signatures
		const wrapper = function (this: any, ...args: any[]) {
			try {
				return decorated.apply(this, args);
			} catch (error) {
				if (error instanceof FieldNotProvidedByWebsiteException) {
					const message = `${this.host()} doesn't seem to support the ${
						decorated.name
					} field. If you know this to be untrue for some recipe, please submit a bug report at ${
						StaticValueExceptionHandlingPlugin.BUG_REPORT_LINK
					}`;

					console.warn(message);
					return error.returnValue;
				}

				if (error instanceof StaticValueException) {
					const message = `${this.host()} returns a constant value from the ${
						decorated.name
					} field. If you believe we can and should determine that dynamically, please submit a bug report at ${
						StaticValueExceptionHandlingPlugin.BUG_REPORT_LINK
					}`;

					console.warn(message);
					return error.returnValue;
				}

				throw error;
			}
		};

		Object.defineProperty(wrapper, "name", { value: decorated.name });
		return wrapper as T;
	}
}
