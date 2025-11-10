#!/usr/bin/env ts-node
/**
 * Compare Outputs Script
 *
 * Compares Python and TypeScript scraper outputs for a specific domain/test case.
 * Useful for debugging individual scrapers during development.
 *
 * Usage:
 *   npm run compare -- allrecipes.com
 *   ts-node scripts/compare-outputs.ts allrecipes.com
 *   ts-node scripts/compare-outputs.ts allrecipes.com recipe.testhtml
 */

import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import chalk from 'chalk';
import * as diff from 'diff';
import { getTestCases, loadTestHtml } from '../tests/helpers/test-data';

class OutputComparer {
  private domain: string;
  private testFile?: string;

  constructor(domain: string, testFile?: string) {
    this.domain = domain;
    this.testFile = testFile;
  }

  async compare(): Promise<void> {
    console.log(chalk.blue('🔍 Comparing Python vs TypeScript Outputs\n'));
    console.log(chalk.cyan(`Domain: ${this.domain}`));

    try {
      // Get test cases
      const testCases = getTestCases(this.domain);

      if (testCases.length === 0) {
        console.log(chalk.yellow(`\n⚠️  No test cases found for domain: ${this.domain}\n`));
        return;
      }

      // Filter to specific test file if provided
      const casesToCompare = this.testFile
        ? testCases.filter(tc => tc.html === this.testFile)
        : testCases;

      if (casesToCompare.length === 0) {
        console.log(chalk.yellow(`\n⚠️  Test file not found: ${this.testFile}\n`));
        return;
      }

      console.log(chalk.cyan(`Test cases: ${casesToCompare.length}\n`));

      for (const testCase of casesToCompare) {
        await this.compareTestCase(testCase.html);
      }

    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  }

  private async compareTestCase(testFile: string): Promise<void> {
    console.log(chalk.blue('─'.repeat(60)));
    console.log(chalk.bold(`Test File: ${testFile}`));
    console.log(chalk.blue('─'.repeat(60)));

    try {
      // Run Python scraper
      console.log(chalk.cyan('\n📝 Running Python scraper...'));
      const pythonOutput = this.runPythonScraper(testFile);
      console.log(chalk.green('✓ Python scraper completed'));

      // Run TypeScript scraper
      console.log(chalk.cyan('\n📝 Running TypeScript scraper...'));
      try {
        const tsOutput = this.runTypeScriptScraper(testFile);
        console.log(chalk.green('✓ TypeScript scraper completed'));

        // Compare outputs
        this.compareAndPrint(pythonOutput, tsOutput);

      } catch (error: any) {
        if (error.message.includes('not yet implemented')) {
          console.log(chalk.yellow('⚠️  TypeScript scrapers not yet implemented\n'));
          this.printPythonOutput(pythonOutput);
        } else {
          throw error;
        }
      }

    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error in test case: ${error.message}\n`));
    }
  }

  private runPythonScraper(testFile: string): any {
    const html = loadTestHtml(this.domain, testFile);
    const tmpFile = join(tmpdir(), `recipe-test-${Date.now()}.html`);

    try {
      // Write HTML to temp file
      writeFileSync(tmpFile, html);

      const script = `
import sys
import json
sys.path.insert(0, '../')

from recipe_scrapers import scrape_html

with open('${tmpFile}', 'r', encoding='utf-8') as f:
    html = f.read()

scraper = scrape_html(html, 'https://${this.domain}/')
print(json.dumps(scraper.to_json(), indent=2, sort_keys=True, default=str))
      `;

      const output = execSync(`python -c "${script}"`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });

      // Clean up temp file
      unlinkSync(tmpFile);

      return JSON.parse(output);
    } catch (error: any) {
      // Clean up temp file on error
      try {
        unlinkSync(tmpFile);
      } catch {
        // Ignore cleanup errors
      }
      throw new Error(`Python scraper failed: ${error.message}`);
    }
  }

  private runTypeScriptScraper(_testFile: string): any {
    // This will be implemented once we have scrapers
    // const html = loadTestHtml(this.domain, testFile);

    // Once scrapeHtml is implemented:
    // const { scrapeHtml } = require('../dist');
    // const scraper = scrapeHtml(html, `https://${this.domain}/`);
    // return scraper.toJson();

    throw new Error('TypeScript scrapers not yet implemented');
  }

  private compareAndPrint(pythonOutput: any, typescriptOutput: any): void {
    const pythonJson = JSON.stringify(pythonOutput, null, 2);
    const tsJson = JSON.stringify(typescriptOutput, null, 2);

    if (pythonJson === tsJson) {
      console.log(chalk.green.bold('\n✅ OUTPUTS IDENTICAL - 100% Parity!\n'));
      return;
    }

    console.log(chalk.red.bold('\n❌ OUTPUTS DIFFER\n'));

    // Show diff
    console.log(chalk.bold('Differences:'));
    const differences = diff.diffJson(pythonOutput, typescriptOutput);

    differences.forEach((part: diff.Change) => {
      const color = part.added ? chalk.green : part.removed ? chalk.red : chalk.gray;
      const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
      const lines = part.value.split('\n');

      lines.forEach((line: string) => {
        if (line) {
          console.log(color(prefix + line));
        }
      });
    });

    console.log('');

    // Field-by-field comparison
    this.compareFields(pythonOutput, typescriptOutput);
  }

  private compareFields(python: any, typescript: any): void {
    console.log(chalk.bold('\nField-by-Field Comparison:'));
    console.log(chalk.blue('─'.repeat(60)));

    const allKeys = new Set([
      ...Object.keys(python || {}),
      ...Object.keys(typescript || {}),
    ]);

    for (const key of Array.from(allKeys).sort()) {
      const pyValue = python?.[key];
      const tsValue = typescript?.[key];
      const pyStr = JSON.stringify(pyValue);
      const tsStr = JSON.stringify(tsValue);

      if (pyStr === tsStr) {
        console.log(chalk.green(`✓ ${key}`));
      } else {
        console.log(chalk.red(`✗ ${key}`));
        console.log(chalk.gray(`  Python:     ${pyStr}`));
        console.log(chalk.gray(`  TypeScript: ${tsStr}`));
      }
    }

    console.log('');
  }

  private printPythonOutput(pythonOutput: any): void {
    console.log(chalk.bold('\nPython Output (for reference):'));
    console.log(chalk.blue('─'.repeat(60)));
    console.log(JSON.stringify(pythonOutput, null, 2));
    console.log('');
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(chalk.yellow('Usage: ts-node scripts/compare-outputs.ts <domain> [testfile]'));
    console.log(chalk.yellow('\nExamples:'));
    console.log(chalk.cyan('  ts-node scripts/compare-outputs.ts allrecipes.com'));
    console.log(chalk.cyan('  ts-node scripts/compare-outputs.ts allrecipes.com recipe.testhtml'));
    console.log(chalk.cyan('  npm run compare -- allrecipes.com\n'));
    process.exit(1);
  }

  const domain = args[0];
  const testFile = args[1];

  new OutputComparer(domain, testFile).compare();
}
