#!/usr/bin/env ts-node
/**
 * Parity Validation Script
 *
 * Validates that the TypeScript implementation produces identical output
 * to the Python version for all test cases.
 *
 * Usage:
 *   npm run validate-parity
 *   ts-node scripts/validate-parity.ts
 *   ts-node scripts/validate-parity.ts --domain allrecipes.com
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { getTestDomains, getTestCases, loadTestHtml, loadExpectedJson } from '../tests/helpers/test-data';

interface ValidationResult {
  domain: string;
  testFile: string;
  passed: boolean;
  errors?: string[];
}

interface ValidationReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  failures: Array<{
    domain: string;
    testFile: string;
    differences: any;
  }>;
}

class ParityValidator {
  private report: ValidationReport;
  private results: ValidationResult[] = [];
  private specificDomain?: string;

  constructor(specificDomain?: string) {
    this.specificDomain = specificDomain;
    this.report = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      passRate: 0,
      failures: [],
    };
  }

  async validate(): Promise<void> {
    console.log(chalk.blue('🔍 Validating TypeScript/Python Parity\n'));

    if (this.specificDomain) {
      console.log(chalk.cyan(`Validating specific domain: ${this.specificDomain}\n`));
    }

    try {
      // Check if Python version is available
      this.checkPythonAvailability();

      const domains = this.specificDomain ? [this.specificDomain] : getTestDomains();

      for (const domain of domains) {
        await this.validateDomain(domain);
      }

      this.calculateMetrics();
      this.printReport();
      this.saveReport();

      if (this.report.failed > 0) {
        process.exit(1);
      }
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Fatal error: ${error.message}`));
      process.exit(1);
    }
  }

  private checkPythonAvailability(): void {
    try {
      execSync('python --version', { stdio: 'pipe' });
    } catch {
      throw new Error('Python is not available. Install Python to run parity validation.');
    }

    // Check if Python recipe_scrapers is installed
    try {
      execSync('python -c "import recipe_scrapers"', { stdio: 'pipe' });
    } catch {
      throw new Error('Python recipe_scrapers not installed. Run: pip install -e ../');
    }
  }

  private async validateDomain(domain: string): Promise<void> {
    try {
      const testCases = getTestCases(domain);

      for (const testCase of testCases) {
        this.report.totalTests++;

        try {
          // For now, skip actual scraper validation since we haven't implemented scrapers yet
          // This will be uncommented once we have scrapers implemented

          // const pythonOutput = this.runPythonScraper(domain, testCase.html);
          // const tsOutput = this.runTypeScriptScraper(domain, testCase.html);

          // if (this.areEqual(pythonOutput, tsOutput)) {
          //   this.report.passed++;
          //   console.log(chalk.green(`✓ ${domain}/${testCase.html}`));
          // } else {
          //   this.report.failed++;
          //   const differences = this.findDifferences(pythonOutput, tsOutput);
          //   this.report.failures.push({ domain, testFile: testCase.html, differences });
          //   console.log(chalk.red(`✗ ${domain}/${testCase.html}`));
          //   this.printDifferences(differences);
          // }

          // Temporary: Skip until scrapers are implemented
          this.report.skipped++;
          console.log(chalk.yellow(`⊘ ${domain}/${testCase.html} (skipped - scrapers not yet implemented)`));

        } catch (error: any) {
          this.report.failed++;
          console.log(chalk.red(`✗ ${domain}/${testCase.html} - Error: ${error.message}`));
        }
      }
    } catch (error: any) {
      console.log(chalk.yellow(`⚠ Skipping domain ${domain}: ${error.message}`));
    }
  }

  private runPythonScraper(domain: string, testFile: string): any {
    const html = loadTestHtml(domain, testFile);
    const { writeFileSync, unlinkSync } = require('fs');
    const { tmpdir } = require('os');
    const tmpFilePath = join(tmpdir(), `recipe-test-${Date.now()}.html`);

    try {
      // Write HTML to temp file
      writeFileSync(tmpFilePath, html);

      const script = `
import sys
import json
sys.path.insert(0, '../')

from recipe_scrapers import scrape_html

with open('${tmpFilePath}', 'r', encoding='utf-8') as f:
    html = f.read()

scraper = scrape_html(html, 'https://${domain}/')
print(json.dumps(scraper.to_json(), sort_keys=True, default=str))
      `;

      const output = execSync(`python -c "${script}"`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });

      // Clean up temp file
      unlinkSync(tmpFilePath);

      return JSON.parse(output);
    } catch (error: any) {
      // Clean up temp file on error
      try {
        unlinkSync(tmpFilePath);
      } catch {
        // Ignore cleanup errors
      }
      throw new Error(`Python scraper failed: ${error.message}`);
    }
  }

  private runTypeScriptScraper(domain: string, testFile: string): any {
    // This will be implemented once we have scrapers
    // For now, return empty object
    const html = loadTestHtml(domain, testFile);

    // Once scrapeHtml is implemented:
    // const { scrapeHtml } = require('../dist');
    // const scraper = scrapeHtml(html, `https://${domain}/`);
    // return scraper.toJson();

    throw new Error('TypeScript scrapers not yet implemented');
  }

  private areEqual(a: any, b: any): boolean {
    return JSON.stringify(this.normalize(a)) === JSON.stringify(this.normalize(b));
  }

  private normalize(obj: any): any {
    // Sort keys, normalize whitespace, handle nulls/undefined
    if (Array.isArray(obj)) {
      return obj.map(item => this.normalize(item));
    }
    if (typeof obj === 'object' && obj !== null) {
      const normalized: any = {};
      Object.keys(obj).sort().forEach(key => {
        const value = obj[key];
        if (value !== null && value !== undefined) {
          normalized[key] = this.normalize(value);
        }
      });
      return normalized;
    }
    if (typeof obj === 'string') {
      return obj.trim();
    }
    return obj;
  }

  private findDifferences(python: any, typescript: any): any {
    const differences: any = {};
    const allKeys = new Set([
      ...Object.keys(python || {}),
      ...Object.keys(typescript || {}),
    ]);

    for (const key of allKeys) {
      const pyValue = python?.[key];
      const tsValue = typescript?.[key];

      if (JSON.stringify(pyValue) !== JSON.stringify(tsValue)) {
        differences[key] = {
          python: pyValue,
          typescript: tsValue,
        };
      }
    }

    return differences;
  }

  private printDifferences(differences: any): void {
    for (const [key, { python, typescript }] of Object.entries<any>(differences)) {
      console.log(chalk.gray(`    ${key}:`));
      console.log(chalk.gray(`      Python:     ${JSON.stringify(python)}`));
      console.log(chalk.gray(`      TypeScript: ${JSON.stringify(typescript)}`));
    }
  }

  private calculateMetrics(): void {
    if (this.report.totalTests > 0) {
      this.report.passRate = (this.report.passed / this.report.totalTests) * 100;
    }
  }

  private printReport(): void {
    console.log('\n' + chalk.blue('='.repeat(60)));
    console.log(chalk.blue('📊 Parity Validation Report'));
    console.log(chalk.blue('='.repeat(60)));
    console.log(`Total tests:   ${this.report.totalTests}`);
    console.log(chalk.green(`Passed:        ${this.report.passed} (${this.report.passRate.toFixed(2)}%)`));
    console.log(chalk.red(`Failed:        ${this.report.failed}`));
    console.log(chalk.yellow(`Skipped:       ${this.report.skipped}`));

    if (this.report.skipped === this.report.totalTests) {
      console.log(chalk.yellow('\n⚠️  All tests skipped - TypeScript scrapers not yet implemented.'));
      console.log(chalk.cyan('This script will validate parity once scrapers are built.\n'));
    } else if (this.report.passRate === 100) {
      console.log(chalk.green.bold('\n🎉 100% PARITY ACHIEVED!'));
      console.log(chalk.green('TypeScript port is ready for extraction.\n'));
    } else if (this.report.failed > 0) {
      console.log(chalk.yellow(`\n⚠️  ${this.report.failed} tests need attention before extraction.\n`));
    }

    console.log(chalk.blue('='.repeat(60)) + '\n');
  }

  private saveReport(): void {
    const reportPath = join(__dirname, '../parity-report.json');
    writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(chalk.gray(`Report saved to: ${reportPath}\n`));
  }
}

// CLI
const args = process.argv.slice(2);
const domainIndex = args.indexOf('--domain');
const specificDomain = domainIndex >= 0 ? args[domainIndex + 1] : undefined;

new ParityValidator(specificDomain).validate();
