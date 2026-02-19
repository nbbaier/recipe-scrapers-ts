#!/usr/bin/env bun

/**
 * Parity Validation Script
 *
 * Validates that the TypeScript implementation produces identical output
 * to the Python version for all test cases.
 *
 * Usage:
 *   bun run validate-parity                                        // validate all domains
 *   bun run validate-parity -- --implemented-only                  // validate only implemented scrapers
 *   bun run validate-parity -- --domains allrecipes.com            // validate specific domain
 *   bun run validate-parity -- --domains allrecipes.com food.com   // validate multiple specific domains
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import {
  getTestCases,
  getTestDomains,
  // loadExpectedJson,
  loadTestHtml,
} from "../tests/helpers/test-data";

type ScraperOutput = Record<string, unknown>;

type FieldDifference = {
  python: unknown;
  typescript: unknown;
};

type Differences = Record<string, FieldDifference>;

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
    differences: Differences;
  }>;
}

class ParityValidator {
  private report: ValidationReport;
  private specificDomain?: string;
  private implementedOnly: boolean;
  private pythonCommand: string;

  constructor(specificDomain?: string, implementedOnly = false) {
    this.specificDomain = specificDomain;
    this.implementedOnly = implementedOnly;
    this.pythonCommand = "python"; // Will be set in checkPythonAvailability
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
    console.log(chalk.blue("🔍 Validating TypeScript/Python Parity\n"));

    if (this.specificDomain) {
      console.log(
        chalk.cyan(`Validating specific domain: ${this.specificDomain}\n`),
      );
    } else if (this.implementedOnly) {
      console.log(chalk.cyan("Validating only implemented scrapers\n"));
    }

    try {
      // Check if Python version is available
      this.checkPythonAvailability();

      const domains = this.specificDomain
        ? [this.specificDomain]
        : getTestDomains();

      // Import isSupported from built library
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { isSupported } = require("../dist/index.cjs");

      for (const domain of domains) {
        if (this.implementedOnly && !isSupported(`https://${domain}/`)) {
          continue;
        }
        await this.validateDomain(domain);
      }

      this.calculateMetrics();
      this.printReport();
      this.saveReport();

      if (this.report.failed > 0) {
        process.exit(1);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(chalk.red(`\n❌ Fatal error: ${message}`));
      process.exit(1);
    }
  }

  private checkPythonAvailability(): void {
    // Allow users to specify Python command via environment variable
    const envPython = process.env.PYTHON_COMMAND;
    if (envPython) {
      try {
        execSync(`${envPython} --version`, { stdio: "pipe" });
        console.log(
          chalk.gray(`Using Python from PYTHON_COMMAND: ${envPython}`),
        );
        this.pythonCommand = envPython;
      } catch {
        console.warn(
          chalk.yellow(
            `Warning: PYTHON_COMMAND="${envPython}" failed, trying defaults...`,
          ),
        );
      }
    }

    // Try common Python commands in order of preference:
    // 1. uv run python (modern uv-based installations)
    // 2. python3 (common on macOS/Linux)
    // 3. python (Windows and some Linux)
    if (!this.pythonCommand) {
      const pythonCommands = ["uv run python", "python3", "python"];

      for (const cmd of pythonCommands) {
        try {
          execSync(`${cmd} --version`, { stdio: "pipe" });
          console.log(chalk.gray(`Detected Python command: ${cmd}`));
          this.pythonCommand = cmd;
          break;
        } catch {
          // Try next command
        }
      }

      if (!this.pythonCommand) {
        throw new Error(
          "Python not found. Please install Python 3 or set PYTHON_COMMAND environment variable.\n" +
            "Tried: uv run python, python3, python",
        );
      }
    }

    // Check if Python recipe_scrapers is installed
    try {
      execSync(`${this.pythonCommand} -c "import recipe_scrapers"`, {
        stdio: "pipe",
      });
    } catch {
      throw new Error(
        "Python recipe_scrapers not installed.\n" +
          `Run: ${this.pythonCommand.includes("uv") ? "uv pip install" : "pip install"} recipe-scrapers`,
      );
    }
  }

  private validateDomain(domain: string): void {
    try {
      const testCases = getTestCases(domain);

      for (const testCase of testCases) {
        this.report.totalTests++;

        try {
          const pythonOutput = this.runPythonScraper(domain, testCase.html);

          // Try to run TypeScript scraper
          let tsOutput: ScraperOutput;
          try {
            tsOutput = this.runTypeScriptScraper(domain, testCase.html);
          } catch (error: unknown) {
            // If scraper not implemented for this domain, skip
            if (
              error instanceof Error &&
              error.message.includes("not implemented")
            ) {
              this.report.skipped++;
              console.log(
                chalk.yellow(
                  `⊘ ${domain}/${testCase.html} (skipped - scraper not implemented)`,
                ),
              );
              continue;
            }
            throw error;
          }

          if (this.areEqual(pythonOutput, tsOutput)) {
            this.report.passed++;
            console.log(chalk.green(`✓ ${domain}/${testCase.html}`));
          } else {
            this.report.failed++;
            const differences = this.findDifferences(pythonOutput, tsOutput);
            this.report.failures.push({
              domain,
              testFile: testCase.html,
              differences,
            });
            console.log(chalk.red(`✗ ${domain}/${testCase.html}`));
            this.printDifferences(differences);
          }
        } catch (error: unknown) {
          this.report.failed++;
          const message =
            error instanceof Error ? error.message : "Unknown error";
          console.log(
            chalk.red(`✗ ${domain}/${testCase.html} - Error: ${message}`),
          );
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.log(chalk.yellow(`⚠ Skipping domain ${domain}: ${message}`));
    }
  }

  private runPythonScraper(domain: string, testFile: string): ScraperOutput {
    const html = loadTestHtml(domain, testFile);
    const { writeFileSync, unlinkSync } = require("node:fs");
    const { tmpdir } = require("node:os");
    const tmpFilePath = join(tmpdir(), `recipe-test-${Date.now()}.html`);

    try {
      // Write HTML to temp file
      writeFileSync(tmpFilePath, html);

      const script = `
import sys
import json
import warnings

# Suppress all warnings (including StaticValueWarning)
warnings.filterwarnings('ignore')

from recipe_scrapers import scrape_html

with open('${tmpFilePath}', 'r', encoding='utf-8') as f:
    html = f.read()

scraper = scrape_html(html, 'https://${domain}/')
print(json.dumps(scraper.to_json(), sort_keys=True, default=str))
      `;

      const output = execSync(`${this.pythonCommand} -c "${script}"`, {
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      });

      // Clean up temp file
      unlinkSync(tmpFilePath);

      return JSON.parse(output) as ScraperOutput;
    } catch (error: unknown) {
      // Clean up temp file on error
      try {
        unlinkSync(tmpFilePath);
      } catch {
        // Ignore cleanup errors
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Python scraper failed: ${message}`);
    }
  }

  private runTypeScriptScraper(
    domain: string,
    testFile: string,
  ): ScraperOutput {
    const html = loadTestHtml(domain, testFile);

    // Import the built scrapeHtml function
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { scrapeHtml } = require("../dist/index.cjs");

    try {
      // Create scraper instance - will throw WebsiteNotImplementedError if not supported
      const scraper = scrapeHtml(html, `https://${domain}/`, {
        supportedOnly: true,
      });

      // Get JSON output
      return scraper.toJson() as ScraperOutput;
    } catch (error: unknown) {
      // Re-throw with a clear message if scraper not implemented
      if (
        error instanceof Error &&
        error.name === "WebsiteNotImplementedError"
      ) {
        throw new Error(`Scraper not implemented for ${domain}`);
      }
      throw error;
    }
  }

  private areEqual(a: ScraperOutput, b: ScraperOutput): boolean {
    const differences = this.findDifferences(a, b);
    return Object.keys(differences).length === 0;
  }

  /**
   * Deep equality check that handles:
   * - Objects with different key ordering
   * - Arrays (order matters)
   * - Nested structures
   * - null vs undefined (considered different)
   */
  private deepEqual(a: unknown, b: unknown): boolean {
    // Strict equality check (handles primitives, null, undefined, same reference)
    if (a === b) return true;

    // Type mismatch
    if (typeof a !== typeof b) return false;

    // null check (null === null handled above, but null !== undefined)
    if (a === null || b === null) return false;

    // Array comparison (order matters)
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.deepEqual(item, b[index]));
    }

    // Object comparison (key order doesn't matter)
    if (typeof a === "object" && typeof b === "object") {
      const aKeys = Object.keys(a as Record<string, unknown>).sort();
      const bKeys = Object.keys(b as Record<string, unknown>).sort();

      // Different number of keys
      if (aKeys.length !== bKeys.length) return false;

      // Different key names
      if (!aKeys.every((key, i) => key === bKeys[i])) return false;

      // Compare values for each key
      return aKeys.every((key) =>
        this.deepEqual(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
        ),
      );
    }

    // All other cases (shouldn't reach here if types match)
    return false;
  }

  /**
   * Check if difference is cosmetic (doesn't affect functionality)
   */
  private isCosmeticDifference(
    key: string,
    pyValue: unknown,
    tsValue: unknown,
  ): string | null {
    // Handle ingredient_groups.purpose: null vs undefined
    if (key === "ingredient_groups") {
      if (Array.isArray(pyValue) && Array.isArray(tsValue)) {
        // Same length check
        if (pyValue.length !== tsValue.length) return null;

        // Check if only difference is purpose: null vs missing purpose
        // biome-ignore lint/suspicious/noExplicitAny: ingredient group structure is dynamic
        const pyWithoutPurpose = pyValue.map((group: any) => {
          if (typeof group !== "object" || group === null) return group;
          const copy = { ...group };
          delete copy.purpose;
          return copy;
        });
        // biome-ignore lint/suspicious/noExplicitAny: ingredient group structure is dynamic
        const tsWithoutPurpose = tsValue.map((group: any) => {
          if (typeof group !== "object" || group === null) return group;
          const copy = { ...group };
          delete copy.purpose;
          return copy;
        });

        if (this.deepEqual(pyWithoutPurpose, tsWithoutPurpose)) {
          // Check if Python has purpose:null and TypeScript has purpose:undefined
          const pyHasPurposeNull = pyValue.some(
            // biome-ignore lint/suspicious/noExplicitAny: ingredient group structure is dynamic
            (g: any) =>
              typeof g === "object" &&
              g !== null &&
              Object.hasOwn(g, "purpose") &&
              g.purpose === null,
          );
          const tsHasPurposeUndefined = tsValue.every(
            // biome-ignore lint/suspicious/noExplicitAny: ingredient group structure is dynamic
            (g: any) =>
              typeof g === "object" &&
              g !== null &&
              Object.hasOwn(g, "purpose") &&
              g.purpose === undefined,
          );

          if (pyHasPurposeNull && tsHasPurposeUndefined) {
            return 'Python serializes "purpose": null, TypeScript omits "purpose": undefined';
          }
        }
      }
    }

    // Handle nutrients: same values, different key order
    if (key === "nutrients") {
      if (
        typeof pyValue === "object" &&
        pyValue !== null &&
        typeof tsValue === "object" &&
        tsValue !== null
      ) {
        if (this.deepEqual(pyValue, tsValue)) {
          return "Same values, different key ordering (cosmetic)";
        }
      }
    }

    return null;
  }

  private normalize(obj: unknown): unknown {
    // Sort keys, normalize whitespace, handle nulls/undefined
    if (Array.isArray(obj)) {
      return obj.map((item) => this.normalize(item));
    }
    if (typeof obj === "object" && obj !== null) {
      const normalized: Record<string, unknown> = {};
      Object.keys(obj)
        .sort()
        .forEach((key) => {
          const value = (obj as Record<string, unknown>)[key];
          if (value !== null && value !== undefined) {
            normalized[key] = this.normalize(value);
          }
        });
      return normalized;
    }
    if (typeof obj === "string") {
      return obj.trim();
    }
    return obj;
  }

  private findDifferences(
    python: ScraperOutput,
    typescript: ScraperOutput,
  ): Differences {
    const differences: Differences = {};
    const allKeys = new Set([
      ...Object.keys(python || {}),
      ...Object.keys(typescript || {}),
    ]);

    for (const key of allKeys) {
      const pyValue = python?.[key];
      const tsValue = typescript?.[key];

      if (!this.deepEqual(pyValue, tsValue)) {
        // Check if it's a cosmetic difference
        const cosmeticReason = this.isCosmeticDifference(key, pyValue, tsValue);
        if (!cosmeticReason) {
          differences[key] = {
            python: pyValue,
            typescript: tsValue,
          };
        }
      }
    }

    return differences;
  }

  private printDifferences(differences: Differences): void {
    for (const [key, { python, typescript }] of Object.entries(differences)) {
      console.log(chalk.gray(`    ${key}:`));
      console.log(chalk.gray(`      Python:     ${JSON.stringify(python)}`));
      console.log(
        chalk.gray(`      TypeScript: ${JSON.stringify(typescript)}`),
      );
    }
  }

  private calculateMetrics(): void {
    if (this.report.totalTests > 0) {
      this.report.passRate =
        (this.report.passed / this.report.totalTests) * 100;
    }
  }

  private printReport(): void {
    console.log(`\n${chalk.blue("=".repeat(60))}`);
    console.log(chalk.blue("📊 Parity Validation Report"));
    console.log(chalk.blue("=".repeat(60)));
    console.log(`Total tests:   ${this.report.totalTests}`);
    console.log(
      chalk.green(
        `Passed:        ${this.report.passed} (${this.report.passRate.toFixed(2)}%)`,
      ),
    );
    console.log(chalk.red(`Failed:        ${this.report.failed}`));
    console.log(chalk.yellow(`Skipped:       ${this.report.skipped}`));

    if (this.report.skipped === this.report.totalTests) {
      console.log(
        chalk.yellow(
          "\n⚠️  All tests skipped - TypeScript scrapers not yet implemented.",
        ),
      );
      console.log(
        chalk.cyan(
          "This script will validate parity once scrapers are built.\n",
        ),
      );
    } else if (this.report.passRate === 100) {
      console.log(chalk.green.bold("\n🎉 100% PARITY ACHIEVED!"));
      console.log(chalk.green("TypeScript port is ready for extraction.\n"));
    } else if (this.report.failed > 0) {
      console.log(
        chalk.yellow(
          `\n⚠️  ${this.report.failed} tests need attention before extraction.\n`,
        ),
      );
    }

    console.log(`${chalk.blue("=".repeat(60))}\n`);
  }

  private saveReport(): void {
    const reportPath = join(__dirname, "../parity-report.json");
    writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(chalk.gray(`Report saved to: ${reportPath}\n`));
  }
}

// CLI
const args = process.argv.slice(2);
const implementedOnly = args.includes("--implemented-only");
const domainIndex = args.indexOf("--domains");

// Parse domains, filtering out flags if needed
let domains: string[] | undefined;
if (domainIndex >= 0) {
  domains = args.slice(domainIndex + 1).filter((arg) => !arg.startsWith("--"));
}

if (domains && domains.length > 0) {
  for (const domain of domains) {
    new ParityValidator(domain, implementedOnly).validate();
  }
} else if (domainIndex >= 0 && (!domains || domains.length === 0)) {
  console.log(chalk.red("--domains flag requires at least one domain"));
  process.exit(1);
} else {
  console.log(chalk.yellow("Validating all domains"));
  new ParityValidator(undefined, implementedOnly).validate();
}
