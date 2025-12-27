/**
 * ExceptionHandlingPlugin
 *
 * The outer-most plugin that silently catches exceptions
 * when SUPPRESS_EXCEPTIONS is enabled and returns default values.
 */

import { settings } from "../settings";
import { PluginInterface } from "./interface";

export class ExceptionHandlingPlugin extends PluginInterface {
	static override runOnHosts = ["*"];
	static override runOnMethods = [
		"title",
		"totalTime",
		"yields",
		"image",
		"ingredients",
		"instructions",
		"ratings",
		"links",
		"language",
		"nutrients",
	];

	// biome-ignore lint/suspicious/noExplicitAny: decorator pattern requires flexible type signatures
	static override run<T extends (...args: any[]) => any>(decorated: T): T {
		// biome-ignore lint/suspicious/noExplicitAny: decorator pattern requires flexible type signatures
		const wrapper = function (this: any, ...args: any[]) {
			if (settings.SUPPRESS_EXCEPTIONS) {
				if (settings.LOG_LEVEL <= 0) {
					// debug level
					const className = this.constructor.name;
					const methodName = decorated.name;
					console.debug(
						`Decorating: ${className}.${methodName}() with ExceptionHandlingPlugin`,
					);
				}

				try {
					return decorated.apply(this, args);
				} catch (error) {
					if (settings.LOG_LEVEL <= 1) {
						// info level
						const errorMessage =
							error instanceof Error ? error.message : String(error);
						console.info(
							`ExceptionHandlingPlugin silenced exception: ${errorMessage} in ${this.constructor.name}.${decorated.name}()`,
						);
					}

					return settings.ON_EXCEPTION_RETURN_VALUES[decorated.name] ?? null;
				}
			}

			return decorated.apply(this, args);
		};

		Object.defineProperty(wrapper, "name", { value: decorated.name });
		return wrapper as T;
	}
}
