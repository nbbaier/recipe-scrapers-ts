/**
 * NormalizeStringPlugin
 *
 * Runs the output of specified methods through string normalization.
 * This removes extra whitespace and cleans up text.
 */

import { normalizeString } from '../utils/strings';
import { settings } from '../settings';
import { PluginInterface } from './interface';

export class NormalizeStringPlugin extends PluginInterface {
  static override runOnHosts = ['*'];
  static override runOnMethods = ['title'];

  static override run<T extends (...args: any[]) => any>(decorated: T): T {
    const wrapper = function (this: any, ...args: any[]) {
      if (settings.LOG_LEVEL <= 0) {
        // debug level
        const className = this.constructor.name;
        const methodName = decorated.name;
        console.debug(
          `Decorating: ${className}.${methodName}() with NormalizeStringPlugin`
        );
      }

      const result = decorated.apply(this, args);
      return normalizeString(result);
    };

    Object.defineProperty(wrapper, 'name', { value: decorated.name });
    return wrapper as T;
  }
}
