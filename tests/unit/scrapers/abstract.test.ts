/**
 * Tests for AbstractScraper
 */

import { AbstractScraper } from '../../../src/scrapers/abstract';
import { updateSettings, resetSettings } from '../../../src/settings';
import { PluginInterface } from '../../../src/plugins/interface';

// Test implementation of AbstractScraper
class TestScraper extends AbstractScraper {
  host(): string {
    return 'test.com';
  }

  author(): string | undefined {
    return 'Test Author';
  }

  siteName(): string {
    return 'Test Site';
  }

  title(): string {
    return 'Test Recipe';
  }

  category(): string | undefined {
    return 'Test Category';
  }

  yields(): string {
    return '4 servings';
  }

  description(): string {
    return 'Test Description';
  }

  ingredients(): string[] {
    return ['ingredient 1', 'ingredient 2'];
  }

  instructions(): string {
    return 'Test instructions';
  }

  totalTime(): number | null {
    return 60;
  }

  cookTime(): number | null {
    return 30;
  }

  prepTime(): number | null {
    return 30;
  }

  ratings(): number | null {
    return 4.5;
  }

  ratingsCount(): number | null {
    return 100;
  }

  cuisine(): string {
    return 'Test Cuisine';
  }

  cookingMethod(): string {
    return 'Test Method';
  }

  image(): string {
    return 'https://example.com/image.jpg';
  }

  keywords(): string[] {
    return ['test', 'recipe'];
  }

  dietaryRestrictions(): string[] {
    return ['vegetarian'];
  }

  nutrients(): Record<string, string> {
    return { calories: '100' };
  }

  equipment(): string[] {
    return ['oven'];
  }
}

// Test plugin
class TestPlugin extends PluginInterface {
  static override runOnHosts = ['*'];
  static override runOnMethods = ['title'];

  static override run<T extends (...args: any[]) => any>(decorated: T): T {
    const wrapper = function (this: any, ...args: any[]) {
      const result = decorated.apply(this, args);
      return `[PLUGIN] ${result}`;
    };
    Object.defineProperty(wrapper, 'name', { value: decorated.name });
    return wrapper as T;
  }
}

describe('AbstractScraper', () => {
  const testHtml = `
    <html>
      <head>
        <title>Test Recipe</title>
        <link rel="canonical" href="https://test.com/recipe" />
      </head>
      <body>
        <h1>Test Recipe</h1>
      </body>
    </html>
  `;

  beforeEach(() => {
    resetSettings();
  });

  afterEach(() => {
    resetSettings();
  });

  describe('constructor', () => {
    it('should create scraper instance', () => {
      const scraper = new TestScraper(testHtml, 'https://test.com/recipe');
      expect(scraper).toBeInstanceOf(AbstractScraper);
    });

    it('should initialize bestImageSelection from settings by default', () => {
      updateSettings({ BEST_IMAGE_SELECTION: true });
      const scraper = new TestScraper(testHtml, 'https://test.com/recipe');
      expect((scraper as any).bestImageSelection).toBe(true);
    });

    it('should override bestImageSelection when provided', () => {
      updateSettings({ BEST_IMAGE_SELECTION: true });
      const scraper = new TestScraper(testHtml, 'https://test.com/recipe', false);
      expect((scraper as any).bestImageSelection).toBe(false);
    });
  });

  describe('plugin application', () => {
    it('should apply plugins to methods', () => {
      // Configure plugin
      updateSettings({ PLUGINS: [TestPlugin] });

      // Create a new scraper class (force plugin re-initialization)
      class TestScraper2 extends TestScraper {
        override host(): string {
          return 'test2.com';
        }
      }

      // Reset plugin initialization flag
      (TestScraper2 as any).pluginsInitialized = false;

      const scraper = new TestScraper2(testHtml, 'https://test.com/recipe');
      const title = scraper.title();

      // Plugin should wrap the title method
      expect(title).toBe('[PLUGIN] Test Recipe');
    });

    it('should only apply plugins once per class', () => {
      updateSettings({ PLUGINS: [TestPlugin] });

      class TestScraper3 extends TestScraper {
        override host(): string {
          return 'test3.com';
        }
      }

      // Reset plugin initialization flag
      (TestScraper3 as any).pluginsInitialized = false;

      // Create two instances of the same class
      const scraper1 = new TestScraper3(testHtml, 'https://test.com/recipe');
      const scraper2 = new TestScraper3(testHtml, 'https://test.com/recipe');

      // Both should have plugins applied
      expect(scraper1.title()).toBe('[PLUGIN] Test Recipe');
      expect(scraper2.title()).toBe('[PLUGIN] Test Recipe');
    });

    it('should respect plugin host filters', () => {
      // Plugin that only runs on specific host
      class HostSpecificPlugin extends PluginInterface {
        static override runOnHosts = ['other.com'];
        static override runOnMethods = ['title'];

        static override run<T extends (...args: any[]) => any>(decorated: T): T {
          const wrapper = function (this: any, ...args: any[]) {
            const result = decorated.apply(this, args);
            return `[HOST_PLUGIN] ${result}`;
          };
          Object.defineProperty(wrapper, 'name', { value: decorated.name });
          return wrapper as T;
        }
      }

      updateSettings({ PLUGINS: [HostSpecificPlugin] });

      class TestScraper4 extends TestScraper {
        override host(): string {
          return 'test4.com';
        }
      }

      // Reset plugin initialization flag
      (TestScraper4 as any).pluginsInitialized = false;

      const scraper = new TestScraper4(testHtml, 'https://test.com/recipe');

      // Plugin should NOT be applied because host doesn't match
      expect(scraper.title()).toBe('Test Recipe');
    });
  });

  describe('canonicalUrl', () => {
    it('should extract canonical URL from HTML', () => {
      const scraper = new TestScraper(testHtml, 'https://test.com/recipe');
      expect(scraper.canonicalUrl()).toBe('https://test.com/recipe');
    });

    it('should fall back to provided URL if no canonical link', () => {
      const htmlNoCanonical = '<html><body>Test</body></html>';
      const scraper = new TestScraper(htmlNoCanonical, 'https://test.com/recipe');
      expect(scraper.canonicalUrl()).toBe('https://test.com/recipe');
    });
  });

  describe('language', () => {
    it('should extract language from html lang attribute', () => {
      const htmlWithLang = '<html lang="en-US"><body>Test</body></html>';
      const scraper = new TestScraper(htmlWithLang, 'https://test.com/recipe');
      expect(scraper.language()).toBe('en-US');
    });

    it('should throw error when language not found', () => {
      const htmlNoLang = '<html><body>Test</body></html>';
      const scraper = new TestScraper(htmlNoLang, 'https://test.com/recipe');
      expect(() => scraper.language()).toThrow('Could not find language.');
    });
  });

  describe('instructionsList', () => {
    it('should split instructions into list', () => {
      const scraper = new TestScraper(testHtml, 'https://test.com/recipe');
      const instructionsList = scraper.instructionsList();
      expect(instructionsList).toEqual(['Test instructions']);
    });
  });
});
