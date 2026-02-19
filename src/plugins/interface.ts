/**
 * Plugin Interface
 *
 * Base interface that all plugins must implement.
 * Plugins wrap scraper methods to add cross-cutting concerns like:
 * - Exception handling
 * - Data normalization
 * - Fallback value retrieval
 */

export interface PluginConfig {
  runOnHosts?: string[];
  runOnMethods?: string[];
}

// biome-ignore lint/complexity/noStaticOnlyClass: intentional plugin pattern using static methods for decorator functionality
export abstract class PluginInterface {
  /**
   * Hosts this plugin should run on
   * Default: ['*'] (all hosts)
   */
  static runOnHosts: string[] = ["*"];

  /**
   * Methods this plugin should decorate
   * Default: ['title']
   */
  static runOnMethods: string[] = ["title"];

  /**
   * Wrap a method with plugin functionality
   * @param _decorated - The original method to wrap
   * @returns The wrapped method
   */
  // biome-ignore lint/suspicious/noExplicitAny: decorator pattern requires flexible type signatures
  static run<T extends (...args: any[]) => any>(_decorated: T): T {
    throw new Error("Plugin must implement run() method");
  }

  /**
   * Check if plugin should run for given host and method
   */
  static shouldRun(host: string, method: string): boolean {
    // biome-ignore lint/complexity/noThisInStatic: in a static method, `this` is the concrete plugin class (intended)
    const pluginClass = this as unknown as typeof PluginInterface;
    return shouldRunPlugin(pluginClass, host, method);
  }
}

/**
 * Check if plugin should run for given host and method
 */
function shouldRunPlugin(
  pluginClass: typeof PluginInterface,
  host: string,
  method: string,
): boolean {
  return (
    shouldRunHostCheck(pluginClass, host) &&
    shouldRunMethodCheck(pluginClass, method)
  );
}

/**
 * Check if plugin should run for given host
 */
function shouldRunHostCheck(
  pluginClass: typeof PluginInterface,
  host: string,
): boolean {
  return (
    pluginClass.runOnHosts.includes("*") ||
    pluginClass.runOnHosts.includes(host)
  );
}

/**
 * Check if plugin should run for given method
 */
function shouldRunMethodCheck(
  pluginClass: typeof PluginInterface,
  method: string,
): boolean {
  return pluginClass.runOnMethods.includes(method);
}
