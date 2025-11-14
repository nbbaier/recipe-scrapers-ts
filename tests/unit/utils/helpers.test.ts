/**
 * Tests for helper utilities
 */

import {
  changeKeys,
  getEquipment,
  NUTRITION_KEYS,
  type NutritionKey,
} from '../../../src/utils/helpers';

describe('changeKeys', () => {
  describe('Basic transformations', () => {
    it('should transform object keys', () => {
      const input = { firstName: 'John', lastName: 'Doe' };
      const result = changeKeys(input, (k) => k.toUpperCase());
      expect(result).toEqual({ FIRSTNAME: 'John', LASTNAME: 'Doe' });
    });

    it('should handle nested objects', () => {
      const input = { user: { firstName: 'John', lastName: 'Doe' } };
      const result = changeKeys(input, (k) => k.toUpperCase());
      expect(result).toEqual({
        USER: { FIRSTNAME: 'John', LASTNAME: 'Doe' },
      });
    });

    it('should handle arrays', () => {
      const input = [{ name: 'John' }, { name: 'Jane' }];
      const result = changeKeys(input, (k) => k.toUpperCase());
      expect(result).toEqual([{ NAME: 'John' }, { NAME: 'Jane' }]);
    });

    it('should handle arrays within objects', () => {
      const input = {
        users: [{ name: 'John' }, { name: 'Jane' }],
      };
      const result = changeKeys(input, (k) => k.toUpperCase());
      expect(result).toEqual({
        USERS: [{ NAME: 'John' }, { NAME: 'Jane' }],
      });
    });

    it('should handle deeply nested structures', () => {
      const input = {
        level1: {
          level2: {
            level3: { deepKey: 'value' },
          },
        },
      };
      const result = changeKeys(input, (k) => k.toUpperCase());
      expect(result).toEqual({
        LEVEL1: {
          LEVEL2: {
            LEVEL3: { DEEPKEY: 'value' },
          },
        },
      });
    });
  });

  describe('JSON-LD specific use cases', () => {
    it('should remove @ prefix from JSON-LD keys', () => {
      const input = {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: 'Chocolate Cake',
      };
      const result = changeKeys(input, (k) => k.replace('@', ''));
      expect(result).toEqual({
        context: 'https://schema.org',
        type: 'Recipe',
        name: 'Chocolate Cake',
      });
    });

    it('should handle @graph arrays', () => {
      const input = {
        '@graph': [
          { '@type': 'Recipe', name: 'Recipe 1' },
          { '@type': 'Recipe', name: 'Recipe 2' },
        ],
      };
      const result = changeKeys(input, (k) => k.replace('@', ''));
      expect(result).toEqual({
        graph: [
          { type: 'Recipe', name: 'Recipe 1' },
          { type: 'Recipe', name: 'Recipe 2' },
        ],
      });
    });

    it('should convert to camelCase', () => {
      const input = { 'first-name': 'John', 'last-name': 'Doe' };
      const toCamelCase = (key: string) =>
        key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      const result = changeKeys(input, toCamelCase);
      expect(result).toEqual({ firstName: 'John', lastName: 'Doe' });
    });
  });

  describe('Edge cases', () => {
    it('should handle null', () => {
      expect(changeKeys(null, (k) => k.toUpperCase())).toBeNull();
    });

    it('should handle undefined', () => {
      expect(changeKeys(undefined, (k) => k.toUpperCase())).toBeUndefined();
    });

    it('should handle empty objects', () => {
      expect(changeKeys({}, (k) => k.toUpperCase())).toEqual({});
    });

    it('should handle empty arrays', () => {
      expect(changeKeys([], (k) => k.toUpperCase())).toEqual([]);
    });

    it('should handle primitive values', () => {
      expect(changeKeys('string', (k) => k.toUpperCase())).toBe('string');
      expect(changeKeys(123, (k) => k.toUpperCase())).toBe(123);
      expect(changeKeys(true, (k) => k.toUpperCase())).toBe(true);
    });

    it('should handle Sets', () => {
      const input = new Set([{ name: 'John' }, { name: 'Jane' }]);
      const result = changeKeys(input, (k) => k.toUpperCase());
      expect(result).toEqual(new Set([{ NAME: 'John' }, { NAME: 'Jane' }]));
    });

    it('should handle mixed nested structures', () => {
      const input = {
        array: [1, 'two', { three: 3 }],
        object: { nested: { value: 'test' } },
        primitive: 'value',
      };
      const result = changeKeys(input, (k) => k.toUpperCase());
      expect(result).toEqual({
        ARRAY: [1, 'two', { THREE: 3 }],
        OBJECT: { NESTED: { VALUE: 'test' } },
        PRIMITIVE: 'value',
      });
    });
  });
});

describe('getEquipment', () => {
  it('should remove duplicates', () => {
    const input = ['Oven', 'Bowl', 'Oven', 'Spoon'];
    expect(getEquipment(input)).toEqual(['Oven', 'Bowl', 'Spoon']);
  });

  it('should preserve order', () => {
    const input = ['Oven', 'Bowl', 'Spoon', 'Oven', 'Bowl'];
    expect(getEquipment(input)).toEqual(['Oven', 'Bowl', 'Spoon']);
  });

  it('should handle empty array', () => {
    expect(getEquipment([])).toEqual([]);
  });

  it('should handle array with no duplicates', () => {
    const input = ['Oven', 'Bowl', 'Spoon'];
    expect(getEquipment(input)).toEqual(['Oven', 'Bowl', 'Spoon']);
  });

  it('should handle array with all duplicates', () => {
    const input = ['Oven', 'Oven', 'Oven'];
    expect(getEquipment(input)).toEqual(['Oven']);
  });

  it('should be case-sensitive', () => {
    const input = ['Oven', 'oven', 'OVEN'];
    expect(getEquipment(input)).toEqual(['Oven', 'oven', 'OVEN']);
  });

  it('should handle real-world equipment lists', () => {
    const input = [
      'Large bowl',
      'Whisk',
      'Baking sheet',
      'Large bowl',
      'Oven',
      'Whisk',
    ];
    expect(getEquipment(input)).toEqual([
      'Large bowl',
      'Whisk',
      'Baking sheet',
      'Oven',
    ]);
  });
});

describe('NUTRITION_KEYS constant', () => {
  it('should contain all standard nutrition fields', () => {
    expect(NUTRITION_KEYS).toContain('servingSize');
    expect(NUTRITION_KEYS).toContain('calories');
    expect(NUTRITION_KEYS).toContain('fatContent');
    expect(NUTRITION_KEYS).toContain('saturatedFatContent');
    expect(NUTRITION_KEYS).toContain('unsaturatedFatContent');
    expect(NUTRITION_KEYS).toContain('transFatContent');
    expect(NUTRITION_KEYS).toContain('carbohydrateContent');
    expect(NUTRITION_KEYS).toContain('sugarContent');
    expect(NUTRITION_KEYS).toContain('proteinContent');
    expect(NUTRITION_KEYS).toContain('sodiumContent');
    expect(NUTRITION_KEYS).toContain('fiberContent');
    expect(NUTRITION_KEYS).toContain('cholesterolContent');
  });

  it('should have exactly 12 keys', () => {
    expect(NUTRITION_KEYS).toHaveLength(12);
  });

  it('should be readonly array', () => {
    // TypeScript should enforce this at compile time
    // Runtime check that it's an array
    expect(Array.isArray(NUTRITION_KEYS)).toBe(true);
  });
});

describe('NutritionKey type', () => {
  it('should allow valid nutrition keys', () => {
    const key1: NutritionKey = 'calories';
    const key2: NutritionKey = 'fatContent';
    const key3: NutritionKey = 'servingSize';

    expect(key1).toBe('calories');
    expect(key2).toBe('fatContent');
    expect(key3).toBe('servingSize');
  });

  // TypeScript type checking happens at compile time
  // These would fail compilation if uncommented:
  // const invalidKey: NutritionKey = 'invalidKey';
  // const wrongType: NutritionKey = 123;
});
