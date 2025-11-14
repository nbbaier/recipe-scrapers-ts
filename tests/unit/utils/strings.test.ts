/**
 * Tests for string utilities
 */

import { normalizeString, csvToTags, formatDietName } from '../../../src/utils/strings';

describe('normalizeString', () => {
  it('should remove HTML tags', () => {
    expect(normalizeString('<p>Hello World</p>')).toBe('Hello World');
    expect(normalizeString('<div><span>Test</span></div>')).toBe('Test');
  });

  it('should unescape HTML entities', () => {
    // &lt;test&gt; unescapes to <test>, which is then removed as an HTML tag
    expect(normalizeString('&lt;test&gt;')).toBe('');
    expect(normalizeString('&amp; &quot;')).toBe('& "');
    expect(normalizeString('&#39;')).toBe("'");
    // Test that actual text with entities works
    expect(normalizeString('AT&amp;T')).toBe('AT&T');
  });

  it('should recursively unescape HTML entities', () => {
    expect(normalizeString('&amp;lt;')).toBe('<');
    expect(normalizeString('&amp;amp;')).toBe('&');
  });

  it('should replace special whitespace characters', () => {
    expect(normalizeString('Hello\xa0World')).toBe('Hello World');
    expect(normalizeString('Hello\u200bWorld')).toBe('HelloWorld');
    expect(normalizeString('Hello\r\nWorld')).toBe('Hello World');
    expect(normalizeString('Hello\nWorld')).toBe('Hello World');
    expect(normalizeString('Hello\tWorld')).toBe('Hello World');
  });

  it('should collapse multiple spaces', () => {
    expect(normalizeString('Hello    World')).toBe('Hello World');
    expect(normalizeString('  Multiple   Spaces  ')).toBe('Multiple Spaces');
  });

  it('should replace double parentheses if both present', () => {
    expect(normalizeString('((test))')).toBe('(test)');
    expect(normalizeString('((hello)) world')).toBe('(hello) world');
  });

  it('should not replace single occurrence of (( or ))', () => {
    expect(normalizeString('((test')).toBe('((test');
    expect(normalizeString('test))')).toBe('test))');
  });

  it('should trim leading and trailing whitespace', () => {
    expect(normalizeString('  Hello World  ')).toBe('Hello World');
    expect(normalizeString('\n\tTest\n\t')).toBe('Test');
  });

  it('should handle complex real-world examples', () => {
    expect(normalizeString('<p>Test&nbsp;&nbsp;Recipe</p>')).toBe('Test Recipe');
    // &lt;div&gt; unescapes to <div>, which is then removed as an HTML tag
    expect(normalizeString('&lt;div&gt;Hello&amp;Goodbye&lt;/div&gt;')).toBe(
      'Hello&Goodbye'
    );
  });

  it('should handle empty strings', () => {
    expect(normalizeString('')).toBe('');
  });
});

describe('csvToTags', () => {
  it('should split comma-separated values', () => {
    expect(csvToTags('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('should trim whitespace from tags', () => {
    expect(csvToTags('  a  ,  b  ,  c  ')).toEqual(['a', 'b', 'c']);
  });

  it('should remove case-insensitive duplicates', () => {
    expect(csvToTags('Italian, Pasta, italian, ITALIAN')).toEqual(['Italian', 'Pasta']);
  });

  it('should lowercase tags when requested', () => {
    expect(csvToTags('Italian, Pasta, Dinner', true)).toEqual([
      'italian',
      'pasta',
      'dinner',
    ]);
  });

  it('should preserve case when not lowercasing (keeping first occurrence)', () => {
    expect(csvToTags('Italian, PASTA, italian')).toEqual(['Italian', 'PASTA']);
  });

  it('should skip empty tags', () => {
    expect(csvToTags('a,,b,  ,c')).toEqual(['a', 'b', 'c']);
  });

  it('should handle empty string', () => {
    expect(csvToTags('')).toEqual([]);
  });

  it('should handle single tag', () => {
    expect(csvToTags('Italian')).toEqual(['Italian']);
  });
});

describe('formatDietName', () => {
  it('should format Schema.org diet URLs', () => {
    expect(formatDietName('http://schema.org/VeganDiet')).toBe('Vegan Diet');
    expect(formatDietName('https://schema.org/GlutenFreeDiet')).toBe(
      'Gluten Free Diet'
    );
  });

  it('should format diet names without URLs', () => {
    expect(formatDietName('VeganDiet')).toBe('Vegan Diet');
    expect(formatDietName('GlutenFreeDiet')).toBe('Gluten Free Diet');
  });

  it('should handle all standard diet types', () => {
    expect(formatDietName('DiabeticDiet')).toBe('Diabetic Diet');
    expect(formatDietName('HalalDiet')).toBe('Halal Diet');
    expect(formatDietName('HinduDiet')).toBe('Hindu Diet');
    expect(formatDietName('KosherDiet')).toBe('Kosher Diet');
    expect(formatDietName('LowCalorieDiet')).toBe('Low Calorie Diet');
    expect(formatDietName('LowFatDiet')).toBe('Low Fat Diet');
    expect(formatDietName('LowLactoseDiet')).toBe('Low Lactose Diet');
    expect(formatDietName('LowSaltDiet')).toBe('Low Salt Diet');
    expect(formatDietName('VegetarianDiet')).toBe('Vegetarian Diet');
  });

  it('should return null for empty schema.org URLs', () => {
    expect(formatDietName('http://schema.org/')).toBeNull();
    expect(formatDietName('schema.org/')).toBeNull();
  });

  it('should return input as-is for unrecognized diet names', () => {
    expect(formatDietName('CustomDiet')).toBe('CustomDiet');
    expect(formatDietName('Paleo')).toBe('Paleo');
  });

  it('should handle partial matches', () => {
    expect(formatDietName('VeganDiet is healthy')).toBe('Vegan Diet');
    expect(formatDietName('Try the GlutenFreeDiet')).toBe('Gluten Free Diet');
  });
});
