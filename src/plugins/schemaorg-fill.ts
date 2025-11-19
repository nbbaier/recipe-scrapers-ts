/**
 * SchemaOrgFillPlugin
 *
 * If a method is not implemented or throws a FillPluginException,
 * attempt to return results from Schema.org data.
 */

import {
	FillPluginException,
	NotImplementedError,
	RecipeSchemaNotFound,
} from "../exceptions";
import { settings } from "../settings";
import { PluginInterface } from "./interface";

export class SchemaOrgFillPlugin extends PluginInterface {
	static override runOnHosts = ["*"];
	static override runOnMethods = [
		"author",
		"site_name",
		"title",
		"category",
		"totalTime",
		"yields",
		"image",
		"ingredients",
		"instructions",
		"ratings",
		"links",
		"language",
		"nutrients",
		"cookingMethod",
		"cuisine",
		"description",
		"cookTime",
		"prepTime",
		"keywords",
		"ratingsCount",
		"dietaryRestrictions",
	];

	// biome-ignore lint/suspicious/noExplicitAny: decorator pattern requires flexible type signatures
	static override run<T extends (...args: any[]) => any>(decorated: T): T {
		// biome-ignore lint/suspicious/noExplicitAny: decorator pattern requires flexible type signatures
		const wrapper = function (this: any, ...args: any[]) {
			const className = this.constructor.name;
			const methodName = decorated.name;

			if (settings.LOG_LEVEL <= 0) {
				// debug level
				console.debug(
					`Decorating: ${className}.${methodName}() with SchemaOrgFillPlugin`,
				);
			}

			try {
				return decorated.apply(this, args);
			} catch (error) {
				// Only handle FillPluginException and NotImplementedError
				if (
					error instanceof FillPluginException ||
					error instanceof NotImplementedError
				) {
					// Check if schema data exists
					if (!this.schema?.data) {
						throw new RecipeSchemaNotFound(
							`No Schema.org data found at URL: ${this.url}`,
						);
					}

					// Try to get function from schema
					const schemaMethod = this.schema?.[decorated.name];

					if (schemaMethod) {
						if (settings.LOG_LEVEL <= 1) {
							// info level
							console.info(
								`${className}.${methodName}() not implemented but Schema.org available. Returning from Schema.org.`,
							);
						}
						const result = schemaMethod.apply(this.schema, args);
						return result;
					}
				}

				throw error;
			}
		};

		Object.defineProperty(wrapper, "name", { value: decorated.name });
		return wrapper as T;
	}
}
