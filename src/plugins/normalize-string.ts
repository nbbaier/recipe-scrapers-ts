/**
 * NormalizeStringPlugin
 *
 * Runs the output of specified methods through string normalization.
 * This removes extra whitespace and cleans up text.
 */

import { settings } from "../settings";
import { normalizeString } from "../utils/strings";
import { PluginInterface } from "./interface";

export class NormalizeStringPlugin extends PluginInterface {
	static override runOnHosts = ["*"];
	static override runOnMethods = ["title"];

	// biome-ignore lint/suspicious/noExplicitAny: decorator pattern requires flexible type signatures
	static override run<T extends (...args: any[]) => any>(decorated: T): T {
		// biome-ignore lint/suspicious/noExplicitAny: decorator pattern requires flexible type signatures
		const wrapper = function (this: any, ...args: any[]) {
			if (settings.LOG_LEVEL <= 0) {
				// debug level
				const className = this.constructor.name;
				const methodName = decorated.name;
				console.debug(
					`Decorating: ${className}.${methodName}() with NormalizeStringPlugin`,
				);
			}

			const result = decorated.apply(this, args);
			// TEMPORARY DEBUG LOGGING
			console.log(`[NormalizeStringPlugin] decorated.name="${decorated.name}", received:`, result);
			const normalized = result == null ? result : normalizeString(result);
			console.log(`[NormalizeStringPlugin] returning:`, normalized);
			return normalized;
		};

		Object.defineProperty(wrapper, "name", { value: decorated.name });
		return wrapper as T;
	}
}
