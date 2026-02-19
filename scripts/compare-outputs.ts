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

import { execSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import chalk from "chalk";
import * as diff from "diff";
import { getTestCases, loadTestHtml } from "../tests/helpers/test-data";

type ScraperOutput = Record<string, unknown>;

class OutputComparer {
  private domain: string;
  private testFile?: string;
  private pythonCommand: string;

  constructor(domain: string, testFile?: string) {
    this.domain = domain;
    this.testFile = testFile;
    this.pythonCommand = this.detectPythonCommand();
    this.checkRecipeScrapersInstalled();
  }

  private detectPythonCommand(): string {
    // Allow users to specify Python command via environment variable
    const envPython = process.env.PYTHON_COMMAND;
    if (envPython) {
      try {
        execSync(`${envPython} --version`, { stdio: "pipe" });
        console.log(
          chalk.gray(`Using Python from PYTHON_COMMAND: ${envPython}`),
        );
        return envPython;
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
    const pythonCommands = ["uv run python", "python3", "python"];

    for (const cmd of pythonCommands) {
      try {
        execSync(`${cmd} --version`, { stdio: "pipe" });
        console.log(chalk.gray(`Detected Python command: ${cmd}`));
        return cmd;
      } catch {
        // Try next command
      }
    }

    throw new Error(
      "Python not found. Please install Python 3 or set PYTHON_COMMAND environment variable.\n" +
        "Tried: uv run python, python3, python",
    );
  }

  private checkRecipeScrapersInstalled(): void {
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

  async compare(): Promise<void> {
    console.log(chalk.blue("🔍 Comparing Python vs TypeScript Outputs\n"));
    console.log(chalk.cyan(`Domain: ${this.domain}`));

    try {
      // Get test cases
      const testCases = getTestCases(this.domain);

      if (testCases.length === 0) {
        console.log(
          chalk.yellow(`\n⚠️  No test cases found for domain: ${this.domain}\n`),
        );
        return;
      }

      // Filter to specific test file if provided
      const casesToCompare = this.testFile
        ? testCases.filter((tc) => tc.html === this.testFile)
        : testCases;

      if (casesToCompare.length === 0) {
        console.log(
          chalk.yellow(`\n⚠️  Test file not found: ${this.testFile}\n`),
        );
        return;
      }

      console.log(chalk.cyan(`Test cases: ${casesToCompare.length}\n`));

      for (const testCase of casesToCompare) {
        await this.compareTestCase(testCase.html);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      } else {
        console.error(chalk.red(`\n❌ Unknown error\n`));
      }
      process.exit(1);
    }
  }

  private compareTestCase(testFile: string): void {
    console.log(chalk.blue("─".repeat(60)));
    console.log(chalk.bold(`Test File: ${testFile}`));
    console.log(chalk.blue("─".repeat(60)));

    try {
      // Run Python scraper
      console.log(chalk.cyan("\n📝 Running Python scraper..."));
      const pythonOutput = this.runPythonScraper(testFile);
      console.log(chalk.green("✓ Python scraper completed"));

      // Run TypeScript scraper
      console.log(chalk.cyan("\n📝 Running TypeScript scraper..."));
      try {
        const tsOutput = this.runTypeScriptScraper(testFile);
        console.log(chalk.green("✓ TypeScript scraper completed"));

        // Compare outputs
        this.compareAndPrint(pythonOutput, tsOutput);
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message.includes("not yet implemented")
        ) {
          console.log(
            chalk.yellow("⚠️  TypeScript scrapers not yet implemented\n"),
          );
          this.printPythonOutput(pythonOutput);
        } else {
          throw error;
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(chalk.red(`\n❌ Error in test case: ${message}\n`));
    }
  }

  private runPythonScraper(testFile: string): ScraperOutput {
    const html = loadTestHtml(this.domain, testFile);
    const tmpFile = join(tmpdir(), `recipe-test-${Date.now()}.html`);

    try {
      // Write HTML to temp file
      writeFileSync(tmpFile, html);

      const script = `
import sys
import json
from recipe_scrapers import scrape_html

with open('${tmpFile}', 'r', encoding='utf-8') as f:
    html = f.read()

scraper = scrape_html(html, 'https://${this.domain}/')
print(json.dumps(scraper.to_json(), indent=2, sort_keys=True, default=str))
      `;

      const output = execSync(`${this.pythonCommand} -c "${script}"`, {
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      });

      // Clean up temp file
      unlinkSync(tmpFile);

      return JSON.parse(output) as ScraperOutput;
    } catch (error: unknown) {
      // Clean up temp file on error
      try {
        unlinkSync(tmpFile);
      } catch {
        // Ignore cleanup errors
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Python scraper failed: ${message}`);
    }
  }

  private runTypeScriptScraper(testFile: string): ScraperOutput {
    const html = loadTestHtml(this.domain, testFile);

    // Import the built scrapeHtml function
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { scrapeHtml } = require("../dist/index.cjs");

    // Create scraper instance
    const scraper = scrapeHtml(html, `https://${this.domain}/`, {
      supportedOnly: true,
    });

    // Get JSON output
    return scraper.toJson() as ScraperOutput;
  }

  private compareAndPrint(
    pythonOutput: ScraperOutput,
    typescriptOutput: ScraperOutput,
  ): void {
    const pythonJson = JSON.stringify(pythonOutput, null, 2);
    const tsJson = JSON.stringify(typescriptOutput, null, 2);

    if (pythonJson === tsJson) {
      console.log(chalk.green.bold("\n✅ OUTPUTS IDENTICAL - 100% Parity!\n"));
      return;
    }

    console.log(chalk.red.bold("\n❌ OUTPUTS DIFFER\n"));

    // Show diff
    console.log(chalk.bold("Differences:"));
    const differences = diff.diffJson(pythonOutput, typescriptOutput);

    differences.forEach((part: diff.Change) => {
      const color = part.added
        ? chalk.green
        : part.removed
          ? chalk.red
          : chalk.gray;
      const prefix = part.added ? "+ " : part.removed ? "- " : "  ";
      const lines = part.value.split("\n");

      lines.forEach((line: string) => {
        if (line) {
          console.log(color(prefix + line));
        }
      });
    });

    console.log("");

    // Field-by-field comparison
    this.compareFields(pythonOutput, typescriptOutput);
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

  private compareFields(
    python: ScraperOutput,
    typescript: ScraperOutput,
  ): void {
    console.log(chalk.bold("\nField-by-Field Comparison:"));
    console.log(chalk.blue("─".repeat(60)));

    const allKeys = new Set([
      ...Object.keys(python || {}),
      ...Object.keys(typescript || {}),
    ]);
    let cosmeticDiffs = 0;
    let realDiffs = 0;

    for (const key of Array.from(allKeys).sort()) {
      const pyValue = python?.[key];
      const tsValue = typescript?.[key];

      if (this.deepEqual(pyValue, tsValue)) {
        console.log(chalk.green(`✓ ${key}`));
      } else {
        // Check if it's a cosmetic difference
        const cosmeticReason = this.isCosmeticDifference(key, pyValue, tsValue);

        if (cosmeticReason) {
          console.log(chalk.yellow(`⚠ ${key} (cosmetic difference)`));
          console.log(chalk.gray(`  Reason: ${cosmeticReason}`));
          cosmeticDiffs++;
        } else {
          console.log(chalk.red(`✗ ${key}`));
          console.log(chalk.gray(`  Python:     ${JSON.stringify(pyValue)}`));
          console.log(chalk.gray(`  TypeScript: ${JSON.stringify(tsValue)}`));
          realDiffs++;
        }
      }
    }

    console.log("");

    // Summary
    if (realDiffs === 0 && cosmeticDiffs === 0) {
      console.log(chalk.green.bold("🎉 Perfect match!\n"));
    } else if (realDiffs === 0 && cosmeticDiffs > 0) {
      console.log(
        chalk.yellow.bold(
          `⚠️  ${cosmeticDiffs} cosmetic difference(s) - functionally identical\n`,
        ),
      );
    } else {
      console.log(chalk.red.bold(`❌ ${realDiffs} real difference(s) found\n`));
      if (cosmeticDiffs > 0) {
        console.log(
          chalk.yellow(`   (plus ${cosmeticDiffs} cosmetic difference(s))\n`),
        );
      }
    }
  }

  private printPythonOutput(pythonOutput: ScraperOutput): void {
    console.log(chalk.bold("\nPython Output (for reference):"));
    console.log(chalk.blue("─".repeat(60)));
    console.log(JSON.stringify(pythonOutput, null, 2));
    console.log("");
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(
      chalk.yellow(
        "Usage: ts-node scripts/compare-outputs.ts <domain> [testfile]",
      ),
    );
    console.log(chalk.yellow("\nExamples:"));
    console.log(
      chalk.cyan("  ts-node scripts/compare-outputs.ts allrecipes.com"),
    );
    console.log(
      chalk.cyan(
        "  ts-node scripts/compare-outputs.ts allrecipes.com recipe.testhtml",
      ),
    );
    console.log(chalk.cyan("  npm run compare -- allrecipes.com\n"));
    process.exit(1);
  }

  const domain = args[0];
  const testFile = args[1];

  new OutputComparer(domain, testFile).compare();
}
