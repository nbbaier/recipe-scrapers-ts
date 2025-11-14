/**
 * Tests for yield/serving parsing utilities
 */

import { getYields, RECIPE_YIELD_TYPES } from '../../../src/utils/yields';

describe('RECIPE_YIELD_TYPES constant', () => {
  it('should contain common yield types', () => {
    expect(RECIPE_YIELD_TYPES).toContainEqual(['dozen', 'dozen']);
    expect(RECIPE_YIELD_TYPES).toContainEqual(['batch', 'batches']);
    expect(RECIPE_YIELD_TYPES).toContainEqual(['cookie', 'cookies']);
    // Note: 'serving' is the default fallback, not a specific yield type
  });

  it('should have singular and plural forms', () => {
    RECIPE_YIELD_TYPES.forEach(([singular, plural]) => {
      expect(singular).toBeTruthy();
      expect(plural).toBeTruthy();
    });
  });
});

describe('getYields', () => {
  describe('Basic servings', () => {
    it('should parse numeric servings', () => {
      expect(getYields('4')).toBe('4 servings');
      expect(getYields('6')).toBe('6 servings');
      expect(getYields('12')).toBe('12 servings');
    });

    it('should parse servings with text', () => {
      expect(getYields('Serves 4')).toBe('4 servings');
      expect(getYields('6 servings')).toBe('6 servings');
      expect(getYields('Makes 8 servings')).toBe('8 servings');
    });

    it('should use singular for 1 serving', () => {
      expect(getYields('1')).toBe('1 serving');
      expect(getYields('Serves 1')).toBe('1 serving');
    });

    it('should handle decimal servings', () => {
      expect(getYields('4.5')).toBe('4.5 servings');
      expect(getYields('2.5 servings')).toBe('2.5 servings');
    });
  });

  describe('Range formats', () => {
    it('should use maximum value for dash ranges', () => {
      expect(getYields('4-6 servings')).toBe('6 servings');
      expect(getYields('Serves 4-6')).toBe('6 servings');
      expect(getYields('2-3 dozen')).toBe('3 dozen');
    });

    it('should use maximum value for "to" ranges', () => {
      expect(getYields('4 to 6 servings')).toBe('6 servings');
      expect(getYields('Serves 4 to 6')).toBe('6 servings');
    });
  });

  describe('Specific yield types', () => {
    it('should identify dozen', () => {
      expect(getYields('2 dozen')).toBe('2 dozen');
      // When both "dozen" and item type are present, longer match wins
      expect(getYields('Makes 4 dozen cookies')).toBe('4 cookies');
      expect(getYields('1 dozen')).toBe('1 dozen');
    });

    it('should identify batches', () => {
      expect(getYields('2 batches')).toBe('2 batches');
      expect(getYields('Makes 3 batches')).toBe('3 batches');
      expect(getYields('1 batch')).toBe('1 batch');
    });

    it('should identify cookies', () => {
      expect(getYields('24 cookies')).toBe('24 cookies');
      expect(getYields('Makes 12 cookies')).toBe('12 cookies');
      expect(getYields('1 cookie')).toBe('1 cookie');
    });

    it('should identify muffins', () => {
      expect(getYields('12 muffins')).toBe('12 muffins');
      expect(getYields('Makes 6 muffins')).toBe('6 muffins');
      expect(getYields('1 muffin')).toBe('1 muffin');
    });

    it('should identify cakes', () => {
      expect(getYields('1 cake')).toBe('1 cake');
      expect(getYields('Makes 2 cakes')).toBe('2 cakes');
    });

    it('should identify cups', () => {
      expect(getYields('4 cups')).toBe('4 cups');
      expect(getYields('Makes 2 cups')).toBe('2 cups');
      expect(getYields('1 cup')).toBe('1 cup');
    });

    it('should identify loaves', () => {
      expect(getYields('2 loaves')).toBe('2 loaves');
      expect(getYields('1 loaf')).toBe('1 loaf');
    });

    it('should identify pies', () => {
      expect(getYields('2 pies')).toBe('2 pies');
      expect(getYields('1 pie')).toBe('1 pie');
    });

    it('should use longest match for ambiguous cases', () => {
      // "hamburger bun" should match before "bun"
      expect(getYields('8 hamburger buns')).toBe('8 hamburger buns');
      expect(getYields('1 hamburger bun')).toBe('1 hamburger bun');
    });
  });

  describe('Item detection', () => {
    it('should detect items when specific keywords present', () => {
      expect(getYields('Makes 12 items')).toBe('12 items');
      expect(getYields('6 sandwiches')).toBe('6 items');
      expect(getYields('8 buns')).toBe('8 items');
    });

    it('should default to servings for unrecognized types', () => {
      expect(getYields('Makes 1 sandwich')).toBe('1 serving');
    });
  });

  describe('Edge cases', () => {
    it('should throw error for null', () => {
      expect(() => getYields(null)).toThrow();
    });

    it('should throw error for empty string', () => {
      expect(() => getYields('')).toThrow();
    });

    it('should handle objects with getText method', () => {
      const element = { getText: () => '4 servings' };
      expect(getYields(element)).toBe('4 servings');
    });

    it('should default to 0 servings for no number found', () => {
      expect(getYields('servings')).toBe('0 servings');
      expect(getYields('no number here')).toBe('0 servings');
    });

    it('should handle whitespace', () => {
      expect(getYields('  4  servings  ')).toBe('4 servings');
    });
  });

  describe('Case insensitivity', () => {
    it('should handle different cases', () => {
      expect(getYields('4 SERVINGS')).toBe('4 servings');
      expect(getYields('Makes 2 DOZEN')).toBe('2 dozen');
      expect(getYields('6 Cookies')).toBe('6 cookies');
    });
  });

  describe('Real-world recipe examples', () => {
    it('should parse common recipe yield formats', () => {
      expect(getYields('Yield: 4 servings')).toBe('4 servings');
      expect(getYields('Makes 2 dozen cookies')).toBe('2 cookies');
      expect(getYields('Recipe makes 12 muffins')).toBe('12 muffins');
      expect(getYields('Serves: 6-8')).toBe('8 servings');
      expect(getYields('Yields 1 9-inch pie')).toBe('1 pie');
    });

    it('should handle messy real-world input', () => {
      expect(getYields('Serves 4 to 6 people')).toBe('6 servings');
      expect(getYields('Makes about 24 cookies')).toBe('24 cookies');
      expect(getYields('Yields approximately 8 servings')).toBe('8 servings');
    });
  });

  describe('Plural vs singular handling', () => {
    it('should correctly pluralize based on count', () => {
      expect(getYields('1 serving')).toBe('1 serving');
      expect(getYields('2 servings')).toBe('2 servings');
      expect(getYields('1 cookie')).toBe('1 cookie');
      expect(getYields('2 cookies')).toBe('2 cookies');
      expect(getYields('1 loaf')).toBe('1 loaf');
      expect(getYields('2 loaves')).toBe('2 loaves');
    });
  });
});
