/**
 * Settings System
 *
 * Configurable settings for recipe-scrapers behavior.
 * Users can customize plugin configuration, logging, and exception handling.
 */

import type { PluginInterface } from '../plugins/interface';

export interface Settings {
  /** Plugins to attach to scrapers (outer-most executed first) */
  PLUGINS: (typeof PluginInterface)[];

  /** Enable best image selection plugin */
  BEST_IMAGE_SELECTION: boolean;

  /** Suppress exceptions and return default values */
  SUPPRESS_EXCEPTIONS: boolean;

  /** Default values to return when exceptions are suppressed */
  ON_EXCEPTION_RETURN_VALUES: Record<string, any>;

  /** Logging level (0=debug, 1=info, 2=warn, 3=error) */
  LOG_LEVEL: number;
}

/**
 * Default settings configuration
 */
export const defaultSettings: Settings = {
  // Plugins are loaded dynamically to avoid circular dependencies
  PLUGINS: [],

  BEST_IMAGE_SELECTION: true,

  SUPPRESS_EXCEPTIONS: false,

  ON_EXCEPTION_RETURN_VALUES: {
    title: null,
    total_time: null,
    yields: null,
    image: null,
    ingredients: null,
    instructions: null,
    instructions_list: null,
    ratings: null,
    links: null,
    language: null,
    nutrients: null,
  },

  LOG_LEVEL: 2, // warn level
};

/**
 * Global settings instance
 * Can be modified by users to customize behavior
 */
export const settings: Settings = { ...defaultSettings };

/**
 * Reset settings to default values
 */
export function resetSettings(): void {
  settings.PLUGINS = [...defaultSettings.PLUGINS];
  settings.BEST_IMAGE_SELECTION = defaultSettings.BEST_IMAGE_SELECTION;
  settings.SUPPRESS_EXCEPTIONS = defaultSettings.SUPPRESS_EXCEPTIONS;
  settings.ON_EXCEPTION_RETURN_VALUES = structuredClone(defaultSettings.ON_EXCEPTION_RETURN_VALUES);
  settings.LOG_LEVEL = defaultSettings.LOG_LEVEL;
}

/**
 * Update settings with custom values
 */
export function updateSettings(customSettings: Partial<Settings>): void {
  Object.assign(settings, customSettings);
}

/**
 * Configure plugins (called after all plugins are loaded)
 */
export function configureDefaultPlugins(plugins: (typeof PluginInterface)[]): void {
  settings.PLUGINS = [...plugins];
  defaultSettings.PLUGINS = [...plugins];
}
