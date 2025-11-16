/**
 * OpenGraphFillPlugin
 *
 * If a method is not implemented or throws a FillPluginException,
 * attempt to return results from OpenGraph metadata.
 */

import { FillPluginException, NotImplementedError } from '../exceptions';
import { settings } from '../settings';
import { PluginInterface } from './interface';

export class OpenGraphFillPlugin extends PluginInterface {
  static override runOnHosts = ['*'];
  static override runOnMethods = ['siteName', 'image'];

  // biome-ignore lint/suspicious/noExplicitAny: decorator pattern requires flexible type signature
  static override run<T extends (...args: any[]) => any>(decorated: T): T {
    // biome-ignore lint/suspicious/noExplicitAny: decorator needs to preserve 'this' context of any type
    const wrapper = function (this: any, ...args: any[]) {
      const className = this.constructor.name;
      const methodName = decorated.name;

      if (settings.LOG_LEVEL <= 0) {
        // debug level
        console.debug(`Decorating: ${className}.${methodName}() with OpenGraphFillPlugin`);
      }

      try {
        return decorated.apply(this, args);
      } catch (error) {
        // Only handle FillPluginException and NotImplementedError
        if (error instanceof FillPluginException || error instanceof NotImplementedError) {
          // Try to get function from opengraph
          const opengraphMethod = this.opengraph?.[decorated.name];

          if (this.opengraph && opengraphMethod) {
            if (settings.LOG_LEVEL <= 1) {
              // info level
              console.info(
                `${className}.${methodName}() not implemented but OpenGraph metadata available. Returning from OpenGraph.`
              );
            }
            return opengraphMethod.apply(this.opengraph, args);
          }
        }

        throw error;
      }
    };

    Object.defineProperty(wrapper, 'name', { value: decorated.name });
    return wrapper as T;
  }
}
