/**
 * OpenGraphImageFetchPlugin
 *
 * If .image() method returns null/undefined or throws an exception,
 * try to fetch the recipe image from og:image metadata.
 */

import { settings } from "../settings";
import { PluginInterface } from "./interface";

export class OpenGraphImageFetchPlugin extends PluginInterface {
	static override runOnHosts = ["*"];
	static override runOnMethods = ["image"];

	static override run<T extends (...args: any[]) => any>(decorated: T): T {
		const wrapper = function (this: any, ...args: any[]) {
			if (settings.LOG_LEVEL <= 0) {
				// debug level
				const className = this.constructor.name;
				const methodName = decorated.name;
				console.debug(
					`Decorating: ${className}.${methodName}() with OpenGraphImageFetchPlugin`,
				);
			}

			let image: string | null = null;

			try {
				image = decorated.apply(this, args);
			} catch (_error) {
				// Silently catch exception
			}

			if (image) {
				return image;
			}

			// Try to fetch from OpenGraph
			if (settings.LOG_LEVEL <= 1) {
				// info level
				console.info(
					`${this.constructor.name}.${decorated.name}() did not find recipe image. OpenGraphImageFetchPlugin will attempt fallback.`,
				);
			}

			// Use Cheerio to find the og:image meta tag
			const ogImage = this.$('meta[property="og:image"][content]').attr(
				"content",
			);

			return ogImage || null;
		};

		Object.defineProperty(wrapper, "name", { value: decorated.name });
		return wrapper as T;
	}
}
