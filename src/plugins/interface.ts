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

export abstract class PluginInterface {
  /**
   * Hosts this plugin should run on
   * Default: ['*'] (all hosts)
   */
  static runOnHosts: string[] = ['*'];

  /**
   * Methods this plugin should decorate
   * Default: ['title']
   */
  static runOnMethods: string[] = ['title'];

  /**
   * Wrap a method with plugin functionality
   * @param _decorated - The original method to wrap
   * @returns The wrapped method
   */
  static run<T extends (...args: any[]) => any>(_decorated: T): T {
    throw new Error('Plugin must implement run() method');
  }

  /**
   * Check if plugin should run for given host and method
   */
  static shouldRun(host: string, method: string): boolean {
    return this._shouldRunHostCheck(host) && this._shouldRunMethodCheck(method);
  }

  /**
   * Check if plugin should run for given host
   */
  private static _shouldRunHostCheck(host: string): boolean {
    return this.runOnHosts.includes('*') || this.runOnHosts.includes(host);
  }

  /**
   * Check if plugin should run for given method
   */
  private static _shouldRunMethodCheck(method: string): boolean {
    return this.runOnMethods.includes(method);
  }
}
