/**
 * Tests for time parsing utilities
 */

import { getMinutes } from '../../../src/utils/time';

describe('getMinutes', () => {
  describe('Numeric values', () => {
    it('should parse integer numbers', () => {
      expect(getMinutes(45)).toBe(45);
      expect(getMinutes(90)).toBe(90);
      expect(getMinutes(0)).toBe(0);
    });

    it('should parse numeric strings', () => {
      expect(getMinutes('45')).toBe(45);
      expect(getMinutes('90')).toBe(90);
      expect(getMinutes('120')).toBe(120);
    });

    it('should return null for zero minutes', () => {
      expect(getMinutes('0')).toBe(null);
    });
  });

  describe('ISO 8601 duration format', () => {
    it('should parse ISO 8601 durations', () => {
      expect(getMinutes('PT1H')).toBe(60); // 1 hour
      expect(getMinutes('PT30M')).toBe(30); // 30 minutes
      expect(getMinutes('PT1H30M')).toBe(90); // 1 hour 30 minutes
      expect(getMinutes('PT2H15M')).toBe(135); // 2 hours 15 minutes
    });

    it('should parse ISO 8601 with seconds', () => {
      expect(getMinutes('PT45S')).toBe(1); // 45 seconds, rounded up
      expect(getMinutes('PT1M30S')).toBe(2); // 1 min 30 sec, rounded up
      expect(getMinutes('PT90S')).toBe(2); // 90 seconds = 1.5 minutes, rounded
    });

    it('should parse ISO 8601 with days', () => {
      expect(getMinutes('P1D')).toBe(1440); // 1 day = 1440 minutes
      expect(getMinutes('P1DT2H')).toBe(1560); // 1 day 2 hours
    });

    it('should ceil fractional minutes from ISO durations', () => {
      expect(getMinutes('PT30S')).toBe(1); // 0.5 minutes, ceiled to 1
    });

    it('should return null for zero-duration ISO strings', () => {
      expect(getMinutes('PT0M')).toBe(null);
    });
  });

  describe('Text-based time formats', () => {
    it('should parse hours', () => {
      expect(getMinutes('1 hour')).toBe(60);
      expect(getMinutes('2 hours')).toBe(120);
      expect(getMinutes('1.5 hours')).toBe(90);
      expect(getMinutes('2.5 hrs')).toBe(150);
    });

    it('should parse minutes', () => {
      expect(getMinutes('30 minutes')).toBe(30);
      expect(getMinutes('45 mins')).toBe(45);
      expect(getMinutes('15 min')).toBe(15);
      expect(getMinutes('60 m')).toBe(60);
    });

    it('should parse combined hours and minutes', () => {
      expect(getMinutes('1 hour 30 minutes')).toBe(90);
      expect(getMinutes('2 hrs 15 mins')).toBe(135);
      expect(getMinutes('1h 45m')).toBe(105);
    });

    it('should parse fractional hours with Unicode fractions', () => {
      expect(getMinutes('1½ hours')).toBe(90);
      expect(getMinutes('2¼ hours')).toBe(135);
      expect(getMinutes('½ hour')).toBe(30);
    });

    it('should parse fractional hours with slash notation', () => {
      expect(getMinutes('1 1/2 hours')).toBe(90);
      expect(getMinutes('2 1/4 hours')).toBe(135);
    });

    it('should parse days', () => {
      expect(getMinutes('1 day')).toBe(1440);
      expect(getMinutes('2 days')).toBe(2880);
    });

    it('should parse seconds', () => {
      expect(getMinutes('30 seconds')).toBe(1); // Rounded up
      expect(getMinutes('90 secs')).toBe(2); // 1.5 minutes rounded
      expect(getMinutes('120 sec')).toBe(2);
    });

    it('should parse complex combinations', () => {
      expect(getMinutes('1 day 2 hours 30 minutes')).toBe(1590);
      expect(getMinutes('2 hours 45 minutes 30 seconds')).toBe(166); // Rounded
    });
  });

  describe('Range formats', () => {
    it('should use the maximum value for dash ranges', () => {
      expect(getMinutes('12-15 minutes')).toBe(15);
      expect(getMinutes('1-2 hours')).toBe(120);
      expect(getMinutes('30-45 mins')).toBe(45);
    });

    it('should use the maximum value for "to" ranges', () => {
      expect(getMinutes('12 to 15 minutes')).toBe(15);
      expect(getMinutes('1 to 2 hours')).toBe(120);
      expect(getMinutes('30 to 45 mins')).toBe(45);
    });
  });

  describe('Edge cases', () => {
    it('should throw error for null', () => {
      expect(() => getMinutes(null)).toThrow();
    });

    it('should throw error for undefined', () => {
      expect(() => getMinutes(undefined as any)).toThrow();
    });

    it('should return null for unparseable strings', () => {
      expect(getMinutes('invalid')).toBe(null);
      expect(getMinutes('no time here')).toBe(null);
    });

    it('should handle objects with text property', () => {
      expect(getMinutes({ text: '45 minutes' })).toBe(45);
      expect(getMinutes({ text: 'PT1H' })).toBe(60);
    });

    it('should round to nearest minute', () => {
      expect(getMinutes('1.4 minutes')).toBe(1);
      expect(getMinutes('1.5 minutes')).toBe(2);
      expect(getMinutes('1.6 minutes')).toBe(2);
    });

    it('should return null when total is zero', () => {
      expect(getMinutes('0 minutes')).toBe(null);
      expect(getMinutes('0 hours')).toBe(null);
    });
  });

  describe('Real-world recipe examples', () => {
    it('should parse common recipe time formats', () => {
      expect(getMinutes('Prep: 15 minutes')).toBe(15);
      expect(getMinutes('Cook Time: 1 hour 30 minutes')).toBe(90);
      expect(getMinutes('Total: 2h 45m')).toBe(165);
      expect(getMinutes('Ready in 30-35 minutes')).toBe(35);
    });

    it('should handle messy real-world input', () => {
      expect(getMinutes(' 1 hour  30  minutes ')).toBe(90);
      expect(getMinutes('About 45 minutes')).toBe(45);
      expect(getMinutes('Approximately 1½ hours')).toBe(90);
    });
  });
});
