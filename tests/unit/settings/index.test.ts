/**
 * Tests for Settings system
 */

import {
  configureDefaultPlugins,
  defaultSettings,
  resetSettings,
  settings,
  updateSettings,
} from '../../../src/settings';
import { PluginInterface } from '../../../src/plugins/interface';

// Mock plugin for testing
class MockPlugin extends PluginInterface {
  // biome-ignore lint/suspicious/noExplicitAny: test mock needs flexible signature
  static override run<T extends (...args: any[]) => any>(decorated: T): T {
    return decorated; // Pass-through for testing
  }
}
class AnotherMockPlugin extends PluginInterface {
  // biome-ignore lint/suspicious/noExplicitAny: test mock needs flexible signature
  static override run<T extends (...args: any[]) => any>(decorated: T): T {
    return decorated; // Pass-through for testing
  }
}

describe('Settings System', () => {
  // Reset settings before each test to ensure clean state
  beforeEach(() => {
    resetSettings();
  });

  describe('Default Settings', () => {
    it('should have correct default values', () => {
      expect(defaultSettings.BEST_IMAGE_SELECTION).toBe(true);
      expect(defaultSettings.SUPPRESS_EXCEPTIONS).toBe(false);
      expect(defaultSettings.LOG_LEVEL).toBe(2);
      expect(defaultSettings.PLUGINS).toEqual([]);
    });

    it('should have default ON_EXCEPTION_RETURN_VALUES', () => {
      expect(defaultSettings.ON_EXCEPTION_RETURN_VALUES).toMatchObject({
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
      });
    });
  });

  describe('resetSettings', () => {
    it('should reset settings to default values', () => {
      // Modify settings
      settings.BEST_IMAGE_SELECTION = false;
      settings.SUPPRESS_EXCEPTIONS = true;
      settings.LOG_LEVEL = 0;

      // Reset
      resetSettings();

      // Verify reset
      expect(settings.BEST_IMAGE_SELECTION).toBe(defaultSettings.BEST_IMAGE_SELECTION);
      expect(settings.SUPPRESS_EXCEPTIONS).toBe(defaultSettings.SUPPRESS_EXCEPTIONS);
      expect(settings.LOG_LEVEL).toBe(defaultSettings.LOG_LEVEL);
    });

    it('should reset nested ON_EXCEPTION_RETURN_VALUES', () => {
      // Modify nested object
      settings.ON_EXCEPTION_RETURN_VALUES.title = 'custom';
      settings.ON_EXCEPTION_RETURN_VALUES.yields = 'custom yields';

      // Reset
      resetSettings();

      // Verify reset
      expect(settings.ON_EXCEPTION_RETURN_VALUES.title).toBeNull();
      expect(settings.ON_EXCEPTION_RETURN_VALUES.yields).toBeNull();
    });

    it('should reset plugins array', () => {
      // Modify plugins
      settings.PLUGINS = [MockPlugin as typeof PluginInterface];

      // Reset
      resetSettings();

      // Verify reset (should be whatever configureDefaultPlugins set, or empty)
      expect(settings.PLUGINS).toEqual(defaultSettings.PLUGINS);
    });

    it('should create independent copy of ON_EXCEPTION_RETURN_VALUES', () => {
      resetSettings();

      // Modify settings
      settings.ON_EXCEPTION_RETURN_VALUES.title = 'modified';

      // Reset again
      resetSettings();

      // Default should not be affected
      expect(settings.ON_EXCEPTION_RETURN_VALUES.title).toBeNull();
    });
  });

  describe('updateSettings', () => {
    it('should update boolean settings', () => {
      updateSettings({ BEST_IMAGE_SELECTION: false });
      expect(settings.BEST_IMAGE_SELECTION).toBe(false);

      updateSettings({ SUPPRESS_EXCEPTIONS: true });
      expect(settings.SUPPRESS_EXCEPTIONS).toBe(true);
    });

    it('should update numeric settings', () => {
      updateSettings({ LOG_LEVEL: 0 });
      expect(settings.LOG_LEVEL).toBe(0);

      updateSettings({ LOG_LEVEL: 3 });
      expect(settings.LOG_LEVEL).toBe(3);
    });

    it('should update plugins array', () => {
      const newPlugins = [MockPlugin as typeof PluginInterface];
      updateSettings({ PLUGINS: newPlugins });

      expect(settings.PLUGINS).toEqual(newPlugins);
    });

    it('should update multiple settings at once', () => {
      updateSettings({
        BEST_IMAGE_SELECTION: false,
        SUPPRESS_EXCEPTIONS: true,
        LOG_LEVEL: 1,
      });

      expect(settings.BEST_IMAGE_SELECTION).toBe(false);
      expect(settings.SUPPRESS_EXCEPTIONS).toBe(true);
      expect(settings.LOG_LEVEL).toBe(1);
    });

    it('should deep merge ON_EXCEPTION_RETURN_VALUES', () => {
      updateSettings({
        ON_EXCEPTION_RETURN_VALUES: {
          title: 'Custom Title',
          yields: 'Custom Yields',
        },
      });

      expect(settings.ON_EXCEPTION_RETURN_VALUES.title).toBe('Custom Title');
      expect(settings.ON_EXCEPTION_RETURN_VALUES.yields).toBe('Custom Yields');
      // Other values should remain unchanged
      expect(settings.ON_EXCEPTION_RETURN_VALUES.ingredients).toBeNull();
      expect(settings.ON_EXCEPTION_RETURN_VALUES.instructions).toBeNull();
    });

    it('should not affect unspecified settings', () => {
      const originalLogLevel = settings.LOG_LEVEL;
      const originalSuppressExceptions = settings.SUPPRESS_EXCEPTIONS;

      updateSettings({ BEST_IMAGE_SELECTION: false });

      expect(settings.LOG_LEVEL).toBe(originalLogLevel);
      expect(settings.SUPPRESS_EXCEPTIONS).toBe(originalSuppressExceptions);
    });

    it('should allow partial updates to ON_EXCEPTION_RETURN_VALUES', () => {
      // Set initial custom values
      updateSettings({
        ON_EXCEPTION_RETURN_VALUES: {
          title: 'First Custom',
          ingredients: ['custom'],
        },
      });

      // Update only one field
      updateSettings({
        ON_EXCEPTION_RETURN_VALUES: {
          yields: '10 servings',
        },
      });

      // Both updates should be preserved
      expect(settings.ON_EXCEPTION_RETURN_VALUES.title).toBe('First Custom');
      expect(settings.ON_EXCEPTION_RETURN_VALUES.ingredients).toEqual(['custom']);
      expect(settings.ON_EXCEPTION_RETURN_VALUES.yields).toBe('10 servings');
    });

    it('should handle empty partial settings', () => {
      const originalSettings = { ...settings };

      updateSettings({});

      expect(settings.BEST_IMAGE_SELECTION).toBe(originalSettings.BEST_IMAGE_SELECTION);
      expect(settings.SUPPRESS_EXCEPTIONS).toBe(originalSettings.SUPPRESS_EXCEPTIONS);
    });
  });

  describe('configureDefaultPlugins', () => {
    it('should set default plugins and only allow configuration once', () => {
      const firstPlugins = [MockPlugin as typeof PluginInterface];
      const secondPlugins = [AnotherMockPlugin as typeof PluginInterface];

      // Spy on console.warn
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Note: configureDefaultPlugins can only be called once successfully
      // It's already been called in index.ts during module loading
      // So we test that it warns when called again
      configureDefaultPlugins(firstPlugins);

      const settingsAfterFirst = [...settings.PLUGINS];

      // Try to call again - should be ignored
      configureDefaultPlugins(secondPlugins);

      // Settings should not have changed
      expect(settings.PLUGINS).toEqual(settingsAfterFirst);

      // At least one of the calls should have warned
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe('Settings Isolation', () => {
    it('should not affect default settings when modifying current settings', () => {
      settings.BEST_IMAGE_SELECTION = false;
      settings.LOG_LEVEL = 0;

      expect(defaultSettings.BEST_IMAGE_SELECTION).toBe(true);
      expect(defaultSettings.LOG_LEVEL).toBe(2);
    });

    it('should create independent ON_EXCEPTION_RETURN_VALUES', () => {
      settings.ON_EXCEPTION_RETURN_VALUES.title = 'modified';

      expect(defaultSettings.ON_EXCEPTION_RETURN_VALUES.title).toBeNull();
    });
  });

  describe('Deep Merge Functionality', () => {
    it('should merge nested objects', () => {
      updateSettings({
        ON_EXCEPTION_RETURN_VALUES: {
          title: 'New Title',
        },
      });

      updateSettings({
        ON_EXCEPTION_RETURN_VALUES: {
          ingredients: ['new ingredient'],
        },
      });

      expect(settings.ON_EXCEPTION_RETURN_VALUES.title).toBe('New Title');
      expect(settings.ON_EXCEPTION_RETURN_VALUES.ingredients).toEqual(['new ingredient']);
      expect(settings.ON_EXCEPTION_RETURN_VALUES.yields).toBeNull();
    });

    it('should overwrite arrays instead of merging them', () => {
      settings.ON_EXCEPTION_RETURN_VALUES.ingredients = ['old'];

      updateSettings({
        ON_EXCEPTION_RETURN_VALUES: {
          ingredients: ['new'],
        },
      });

      expect(settings.ON_EXCEPTION_RETURN_VALUES.ingredients).toEqual(['new']);
    });

    it('should handle null values', () => {
      settings.ON_EXCEPTION_RETURN_VALUES.title = 'some title';

      updateSettings({
        ON_EXCEPTION_RETURN_VALUES: {
          title: null,
        },
      });

      expect(settings.ON_EXCEPTION_RETURN_VALUES.title).toBeNull();
    });
  });

  describe('Type Safety', () => {
    it('should accept valid Settings partial', () => {
      const validUpdate = {
        BEST_IMAGE_SELECTION: false,
        LOG_LEVEL: 1,
      };

      expect(() => updateSettings(validUpdate)).not.toThrow();
    });

    it('should handle all setting types', () => {
      updateSettings({
        BEST_IMAGE_SELECTION: false, // boolean
        SUPPRESS_EXCEPTIONS: true, // boolean
        LOG_LEVEL: 0, // number
        PLUGINS: [], // array
        ON_EXCEPTION_RETURN_VALUES: {
          // object
          title: 'test',
        },
      });

      expect(settings.BEST_IMAGE_SELECTION).toBe(false);
      expect(settings.SUPPRESS_EXCEPTIONS).toBe(true);
      expect(settings.LOG_LEVEL).toBe(0);
      expect(settings.PLUGINS).toEqual([]);
      expect(settings.ON_EXCEPTION_RETURN_VALUES.title).toBe('test');
    });
  });
});
