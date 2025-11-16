/**
 * HTMLTagStripperPlugin
 *
 * Strips HTML tags from method outputs.
 * Handles both string outputs and arrays of strings.
 */

import { settings } from '../settings';
import { PluginInterface } from './interface';

/**
 * Strip HTML tags from a string
 * Uses a simple regex-based approach for safety
 */
function stripTags(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove HTML tags
  let result = html.replace(/<[^>]*>/g, '');

  // Decode HTML entities (handle any level of encoding)
  let prevResult;
  do {
    prevResult = result;
    result = result
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  } while (result !== prevResult);
  return result;
}

export class HTMLTagStripperPlugin extends PluginInterface {
  static override runOnHosts = ['*'];
  static override runOnMethods = ['title', 'instructions', 'ingredients'];

  static override run<T extends (...args: any[]) => any>(decorated: T): T {
    const wrapper = function (this: any, ...args: any[]) {
      if (settings.LOG_LEVEL <= 0) {
        // debug level
        const className = this.constructor.name;
        const methodName = decorated.name;
        console.debug(
          `Decorating: ${className}.${methodName}() with HTMLTagStripperPlugin`
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

    Object.defineProperty(wrapper, 'name', { value: decorated.name });
    return wrapper as T;
  }
}
