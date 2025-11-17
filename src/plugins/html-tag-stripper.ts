/**
 * HTMLTagStripperPlugin
 *
 * Strips HTML tags from method outputs.
 * Handles both string outputs and arrays of strings.
 */

import * as cheerio from "cheerio";
import { settings } from "../settings";
import { PluginInterface } from "./interface";

/**
 * Strip HTML tags from a string using cheerio
 * Properly handles edge cases like comments, CDATA, and malformed HTML
 */
function stripTags(html: string): string {
	if (!html || typeof html !== "string") {
		return "";
	}

	try {
		// Use cheerio to parse and extract text content
		// This properly handles all HTML edge cases
		const $ = cheerio.load(html);
		// Use $.root().text() instead of $('*').text() to avoid duplication
		// $('*') selects ALL elements (html, body, etc.) causing text to appear multiple times
		return $.root().text().trim();
	} catch {
		// Fallback: if cheerio fails to parse, return empty string
		// We prefer failing safely rather than using incomplete sanitization
		return "";
	}
}

export class HTMLTagStripperPlugin extends PluginInterface {
	static override runOnHosts = ["*"];
	static override runOnMethods = ["title", "instructions", "ingredients"];

	// biome-ignore lint/suspicious/noExplicitAny: decorator pattern requires flexible type signatures
	static override run<T extends (...args: any[]) => any>(decorated: T): T {
		// biome-ignore lint/suspicious/noExplicitAny: decorator pattern requires flexible type signatures
		const wrapper = function (this: any, ...args: any[]) {
			if (settings.LOG_LEVEL <= 0) {
				// debug level
				const className = this.constructor.name;
				const methodName = decorated.name;
				console.debug(
					`Decorating: ${className}.${methodName}() with HTMLTagStripperPlugin`,
				);
			}

			const result = decorated.apply(this, args);

			// Handle array results
			if (Array.isArray(result)) {
				return result.map((item) => stripTags(item));
			}

			// Handle string results
			return stripTags(result);
		};

		Object.defineProperty(wrapper, "name", { value: decorated.name });
		return wrapper as T;
	}
}
