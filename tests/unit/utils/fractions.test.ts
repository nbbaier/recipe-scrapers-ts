/**
 * Tests for fraction utilities
 */

import { FRACTIONS, extractFractional } from '../../../src/utils/fractions';

describe('FRACTIONS constant', () => {
  it('should contain all common Unicode fractions', () => {
    expect(FRACTIONS['½']).toBe(0.5);
    expect(FRACTIONS['⅓']).toBeCloseTo(1 / 3);
    expect(FRACTIONS['⅔']).toBeCloseTo(2 / 3);
    expect(FRACTIONS['¼']).toBe(0.25);
    expect(FRACTIONS['¾']).toBe(0.75);
    expect(FRACTIONS['⅕']).toBe(0.2);
    expect(FRACTIONS['⅖']).toBe(0.4);
    expect(FRACTIONS['⅗']).toBe(0.6);
    expect(FRACTIONS['⅘']).toBe(0.8);
    expect(FRACTIONS['⅙']).toBeCloseTo(1 / 6);
    expect(FRACTIONS['⅚']).toBeCloseTo(5 / 6);
    expect(FRACTIONS['⅛']).toBe(0.125);
    expect(FRACTIONS['⅜']).toBe(0.375);
    expect(FRACTIONS['⅝']).toBe(0.625);
    expect(FRACTIONS['⅞']).toBe(0.875);
  });
});

describe('extractFractional', () => {
  describe('Unicode fractions', () => {
    it('should parse standalone Unicode fractions', () => {
      expect(extractFractional('½')).toBe(0.5);
      expect(extractFractional('¾')).toBe(0.75);
      expect(extractFractional('⅓')).toBeCloseTo(1 / 3);
    });

    it('should parse mixed numbers with Unicode fractions', () => {
      expect(extractFractional('1½')).toBe(1.5);
      expect(extractFractional('2¾')).toBe(2.75);
      expect(extractFractional('1⅔')).toBeCloseTo(1 + 2 / 3);
    });

    it('should handle Unicode fractions with spaces', () => {
      expect(extractFractional(' ½ ')).toBe(0.5);
      expect(extractFractional(' 1½ ')).toBe(1.5);
    });
  });

  describe('Slash fractions', () => {
    it('should parse simple slash fractions', () => {
      expect(extractFractional('1/2')).toBe(0.5);
      expect(extractFractional('3/4')).toBe(0.75);
      expect(extractFractional('1/3')).toBeCloseTo(1 / 3);
      expect(extractFractional('2/3')).toBeCloseTo(2 / 3);
    });

    it('should parse mixed numbers with slash fractions', () => {
      expect(extractFractional('1 1/2')).toBe(1.5);
      expect(extractFractional('2 3/4')).toBe(2.75);
      expect(extractFractional('1 2/3')).toBeCloseTo(1 + 2 / 3);
    });

    it('should handle slash fractions with multiple spaces', () => {
      expect(extractFractional('1  1/2')).toBe(1.5);
    });
  });

  describe('Decimal numbers', () => {
    it('should parse simple decimal numbers', () => {
      expect(extractFractional('1.5')).toBe(1.5);
      expect(extractFractional('2.75')).toBe(2.75);
      expect(extractFractional('0.5')).toBe(0.5);
    });

    it('should parse whole numbers', () => {
      expect(extractFractional('1')).toBe(1);
      expect(extractFractional('10')).toBe(10);
      expect(extractFractional('0')).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle whitespace', () => {
      expect(extractFractional('  1  ')).toBe(1);
      expect(extractFractional('  1/2  ')).toBe(0.5);
    });

    it('should throw error for unrecognized format', () => {
      expect(() => extractFractional('abc')).toThrow();
      expect(() => extractFractional('one half')).toThrow();
      expect(() => extractFractional('')).toThrow();
    });

    it('should handle zero values', () => {
      expect(extractFractional('0')).toBe(0);
      expect(extractFractional('0/1')).toBe(0);
    });
  });

  describe('Real-world recipe examples', () => {
    it('should parse common recipe measurements', () => {
      expect(extractFractional('1½')).toBe(1.5); // 1½ cups
      expect(extractFractional('2 1/2')).toBe(2.5); // 2 1/2 tablespoons
      expect(extractFractional('¼')).toBe(0.25); // ¼ teaspoon
      expect(extractFractional('⅔')).toBeCloseTo(2 / 3); // ⅔ cup
    });
  });
});
