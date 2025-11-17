#!/usr/bin/env bun

/**
 * Parity Validation Script
 *
 * Validates that the TypeScript implementation produces identical output
 * to the Python version for all test cases.
 *
 * Usage:
 *   npm run validate-Parity
 *   bun run validate-parity                                      // validate all domains
 *   bun run validate-parity -- --domains allrecipes.com           // validate specific domain
 *   bun run validate-parity -- --domains allrecipes.com food.com // validate specific domains
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
	private pythonCommand: string;

	constructor(specificDomain?: string) {
		this.specificDomain = specificDomain;
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
		}

		try {
			// Check if Python version is available
			this.checkPythonAvailability();

			const domains = this.specificDomain
				? [this.specificDomain]
				: getTestDomains();

			for (const domain of domains) {
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
					`Run: ${this.pythonCommand.includes("uv") ? "uv pip install" : "pip install"} -e ../`,
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

sys.path.insert(0, '../')

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
		return (
			JSON.stringify(this.normalize(a)) === JSON.stringify(this.normalize(b))
		);
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

			if (JSON.stringify(pyValue) !== JSON.stringify(tsValue)) {
				differences[key] = {
					python: pyValue,
					typescript: tsValue,
				};
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
const domainIndex = args.indexOf("--domains");
const domains = domainIndex >= 0 ? args.slice(domainIndex + 1) : undefined;

if (domains && domains.length > 0) {
	for (const domain of domains) {
		new ParityValidator(domain).validate();
	}
} else if (domains && domains.length === 0) {
	console.log(chalk.red("--domains flag requires at least one domain"));
	process.exit(1);
} else {
	console.log(chalk.yellow("Validating all domains"));
	new ParityValidator(undefined).validate();
}
