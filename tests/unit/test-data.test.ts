/**
 * Tests for test data helper functions
 */

import {
  loadTestHtml,
  loadExpectedJson,
  getTestDataPath,
  getTestDomains,
  getTestCases,
} from '../helpers/test-data';
import { existsSync } from 'fs';

describe('Test Data Helpers', () => {
  describe('getTestDomains', () => {
    it('should return array of test domains', () => {
      const domains = getTestDomains();

      expect(Array.isArray(domains)).toBe(true);
      expect(domains.length).toBeGreaterThan(0);

      // Should include some known domains
      expect(domains).toContain('allrecipes.com');
    });
  });

  describe('getTestDataPath', () => {
    it('should return valid path for domain', () => {
      const path = getTestDataPath('allrecipes.com');

      expect(typeof path).toBe('string');
      expect(existsSync(path)).toBe(true);
    });
  });

  describe('getTestCases', () => {
    it('should return test cases for a domain', () => {
      const testCases = getTestCases('allrecipes.com');

      expect(Array.isArray(testCases)).toBe(true);

      if (testCases.length > 0) {
        const firstCase = testCases[0];
        expect(firstCase).toHaveProperty('html');
        expect(firstCase).toHaveProperty('json');
        expect(firstCase.html).toMatch(/\.testhtml$/);
        expect(firstCase.json).toMatch(/\.json$/);
      }
    });
  });

  describe('loadTestHtml', () => {
    it('should load HTML from test data', () => {
      const domains = getTestDomains();
      const testDomain = domains[0];
      const testCases = getTestCases(testDomain);

      if (testCases.length > 0) {
        const html = loadTestHtml(testDomain, testCases[0].html);

        expect(typeof html).toBe('string');
        expect(html.length).toBeGreaterThan(0);
        expect(html).toContain('<html');
      }
    });

    it('should throw error for non-existent file', () => {
      expect(() => {
        loadTestHtml('nonexistent.com', 'fake.testhtml');
      }).toThrow();
    });
  });

  describe('loadExpectedJson', () => {
    it('should load and parse JSON from test data', () => {
      const domains = getTestDomains();
      const testDomain = domains[0];
      const testCases = getTestCases(testDomain);

      if (testCases.length > 0) {
        const expectedJson = loadExpectedJson(testDomain, testCases[0].json);

        expect(typeof expectedJson).toBe('object');
        expect(expectedJson).toHaveProperty('host');
      }
    });

    it('should throw error for non-existent JSON file', () => {
      expect(() => {
        loadExpectedJson('nonexistent.com', 'fake.json');
      }).toThrow();
    });
  });
});
