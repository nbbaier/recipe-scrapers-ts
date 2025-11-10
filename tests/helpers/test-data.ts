/**
 * Helper functions for accessing shared test data from Python repository
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Path to shared test data directory (from Python repo)
 */
const TEST_DATA_PATH = join(__dirname, '../../..', 'tests', 'test_data');

/**
 * Load test HTML file for a specific domain and test case
 *
 * @param domain - The domain name (e.g., 'allrecipes.com')
 * @param filename - The test HTML filename (e.g., 'recipe.testhtml')
 * @returns The HTML content as a string
 */
export function loadTestHtml(domain: string, filename: string): string {
  const path = join(TEST_DATA_PATH, domain, filename);

  if (!existsSync(path)) {
    throw new Error(`Test HTML not found: ${path}`);
  }

  return readFileSync(path, 'utf-8');
}

/**
 * Load expected JSON output for a specific domain and test case
 *
 * @param domain - The domain name (e.g., 'allrecipes.com')
 * @param filename - The test JSON filename (e.g., 'recipe.json')
 * @returns The parsed JSON object
 */
export function loadExpectedJson(domain: string, filename: string): any {
  const path = join(TEST_DATA_PATH, domain, filename);

  if (!existsSync(path)) {
    throw new Error(`Expected JSON not found: ${path}`);
  }

  const content = readFileSync(path, 'utf-8');
  return JSON.parse(content);
}

/**
 * Get the path to test data directory for a specific domain
 *
 * @param domain - The domain name (e.g., 'allrecipes.com')
 * @returns Absolute path to the domain's test data directory
 */
export function getTestDataPath(domain: string): string {
  return join(TEST_DATA_PATH, domain);
}

/**
 * Get list of all available test domains
 *
 * @returns Array of domain names that have test data
 */
export function getTestDomains(): string[] {
  if (!existsSync(TEST_DATA_PATH)) {
    throw new Error(`Test data directory not found: ${TEST_DATA_PATH}`);
  }

  return readdirSync(TEST_DATA_PATH, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

/**
 * Get list of test cases for a specific domain
 *
 * @param domain - The domain name
 * @returns Array of test case objects with html and json filenames
 */
export function getTestCases(domain: string): Array<{ html: string; json: string }> {
  const domainPath = getTestDataPath(domain);

  if (!existsSync(domainPath)) {
    throw new Error(`Test data for domain not found: ${domain}`);
  }

  const files = readdirSync(domainPath);
  const htmlFiles = files.filter((f) => f.endsWith('.testhtml'));

  return htmlFiles.map((htmlFile) => ({
    html: htmlFile,
    json: htmlFile.replace('.testhtml', '.json'),
  }));
}
