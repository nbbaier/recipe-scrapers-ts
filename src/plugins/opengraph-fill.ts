/**
 * OpenGraphFillPlugin
 *
 * If a method is not implemented or throws a FillPluginException,
 * attempt to return results from OpenGraph metadata.
 */

import { FillPluginException } from '../exceptions';
import { settings } from '../settings';
import { PluginInterface } from './interface';

export class OpenGraphFillPlugin extends PluginInterface {
  static override runOnHosts = ['*'];
  static override runOnMethods = ['site_name', 'image'];

  static override run<T extends (...args: any[]) => any>(decorated: T): T {
    const wrapper = function (this: any, ...args: any[]) {
      const className = this.constructor.name;
      const methodName = decorated.name;

      if (settings.LOG_LEVEL <= 0) {
        // debug level
        console.debug(
          `Decorating: ${className}.${methodName}() with OpenGraphFillPlugin`
        );
      }

      try {
        return decorated.apply(this, args);
      } catch (error) {
        // Only handle FillPluginException and NotImplementedError
        if (
          error instanceof FillPluginException ||
          (error instanceof Error && error.message.includes('not implemented'))
        ) {
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
