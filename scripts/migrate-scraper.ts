#!/usr/bin/env bun
/**
 * Migrate a Python scraper from upstream recipe-scrapers into this TypeScript repo.
 *
 * Default behavior:
 * - Pulls scraper source from GitHub (main)
 * - Detects alias domains from recipe_scrapers/__init__.py
 * - Generates src/scrapers/sites/<scraper>.ts
 * - Updates src/scrapers/sites/index.ts imports/exports/SCRAPER_REGISTRY
 * - Syncs test_data/<domain> from upstream when available
 * - Runs build + targeted parity validation (skips parity if Python env is unavailable)
 */

import { execSync } from "node:child_process";
import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";

const UPSTREAM_REPO = "hhursev/recipe-scrapers";
const DEFAULT_REF = "main";

const GITHUB_HEADERS = {
	Accept: "application/vnd.github+json",
	"User-Agent": "recipe-scrapers-ts-migrate-script",
};

type HostTemplate =
	| { kind: "literal"; value: string }
	| {
			kind: "interpolated";
			variable: string;
			prefix: string;
			suffix: string;
			defaults: Record<string, string>;
	  }
	| { kind: "variable"; variable: string; defaults: Record<string, string> };

interface ParsedScraper {
	className: string;
	tsClassName: string;
	pythonFilename: string;
	primaryHost: string;
	hostTemplate: HostTemplate;
	hasWprm: boolean;
	methods: string[];
}

interface CliOptions {
	scraperName: string;
	ref: string;
	primaryOnly: boolean;
}

interface TsScraperMeta {
	filename: string;
	className: string;
	host: string;
}

interface FixtureSyncResult {
	domain: string;
	status: "downloaded" | "copied-local" | "scaffolded" | "existing" | "failed";
	detail: string;
}

interface ParityResult {
	status: "passed" | "failed" | "skipped";
	detail: string;
}

function printHelp(): void {
	console.log(`
🔄 Python to TypeScript Scraper Migration Tool

Usage:
  bun scripts/migrate-scraper.ts <scraper-name> [options]

Options:
  --ref <git-ref>       Upstream Git ref (default: ${DEFAULT_REF})
  --primary-only        Register only the primary host (skip aliases)
  -h, --help            Show this help

Examples:
  bun scripts/migrate-scraper.ts allrecipes
  bun scripts/migrate-scraper.ts foodnetwork --ref main
  bun scripts/migrate-scraper.ts foodnetwork --primary-only
`);
}

function parseArgs(argv: string[]): CliOptions {
	if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
		printHelp();
		process.exit(0);
	}

	let ref = DEFAULT_REF;
	let primaryOnly = false;
	let scraperName: string | undefined;

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];

		if (arg === "--ref") {
			const value = argv[i + 1];
			if (!value || value.startsWith("-")) {
				throw new Error("--ref requires a value");
			}
			ref = value;
			i++;
			continue;
		}

		if (arg === "--primary-only") {
			primaryOnly = true;
			continue;
		}

		if (arg.startsWith("-")) {
			throw new Error(`Unknown option: ${arg}`);
		}

		if (scraperName) {
			throw new Error(
				`Unexpected positional argument: ${arg}. Only one scraper name is allowed.`,
			);
		}

		scraperName = arg;
	}

	if (!scraperName) {
		throw new Error("Scraper name is required");
	}

	return { scraperName, ref, primaryOnly };
}

function getLocalUpstreamRoots(): string[] {
	const roots = [
		process.env.RECIPE_SCRAPERS_PATH,
		join(process.cwd(), "..", "recipe-scrapers"),
	].filter((p): p is string => Boolean(p));

	return roots.filter((root) => existsSync(root));
}

async function loadUpstreamText(
	relativePath: string,
	ref: string,
): Promise<string> {
	const rawUrl = `https://raw.githubusercontent.com/${UPSTREAM_REPO}/${ref}/${relativePath}`;
	try {
		const response = await fetch(rawUrl, { headers: GITHUB_HEADERS });
		if (response.ok) {
			return await response.text();
		}
	} catch {
		// Fall through to local fallback.
	}

	for (const root of getLocalUpstreamRoots()) {
		const localPath = join(root, relativePath);
		if (existsSync(localPath)) {
			return readFileSync(localPath, "utf-8");
		}
	}

	throw new Error(
		`Could not load upstream file: ${relativePath} (tried GitHub ref '${ref}' and local fallback paths).`,
	);
}

function parseDefaults(signature: string): Record<string, string> {
	const defaults: Record<string, string> = {};
	const re = /(\w+)\s*=\s*["']([^"']+)["']/g;
	let match = re.exec(signature);
	while (match) {
		defaults[match[1]] = match[2];
		match = re.exec(signature);
	}
	return defaults;
}

function parseHostTemplate(content: string): HostTemplate {
	const hostMethodMatch = content.match(
		/@classmethod\s+def\s+host\(([^)]*)\):\s*\n([\s\S]*?)(?=\n\s*def\s|\nclass\s|\n\s*$)/,
	);

	if (!hostMethodMatch) {
		throw new Error("Could not parse @classmethod host(...) method");
	}

	const signature = hostMethodMatch[1];
	const body = hostMethodMatch[2];
	const defaults = parseDefaults(signature);

	const returnMatch = body.match(/return\s+([^\n#]+)/);
	if (!returnMatch) {
		throw new Error("Could not parse return expression in host() method");
	}

	const expr = returnMatch[1].trim();

	const literalMatch = expr.match(/^["']([^"']+)["']$/);
	if (literalMatch) {
		return { kind: "literal", value: literalMatch[1] };
	}

	const interpolatedMatch = expr.match(
		/^f["']([^"'{]*)\{(\w+)\}([^"'}]*)["']$/,
	);
	if (interpolatedMatch) {
		return {
			kind: "interpolated",
			prefix: interpolatedMatch[1],
			variable: interpolatedMatch[2],
			suffix: interpolatedMatch[3],
			defaults,
		};
	}

	const variableMatch = expr.match(/^(\w+)$/);
	if (variableMatch) {
		return { kind: "variable", variable: variableMatch[1], defaults };
	}

	throw new Error(`Unsupported host() return expression: ${expr}`);
}

function resolveHost(
	template: HostTemplate,
	overrides: Record<string, string>,
): string | null {
	if (template.kind === "literal") {
		return template.value;
	}

	const defaultValue = template.defaults[template.variable];
	const value = overrides[template.variable] ?? defaultValue;
	if (!value) {
		return null;
	}

	if (template.kind === "variable") {
		return value;
	}

	return `${template.prefix}${value}${template.suffix}`;
}

function parsePythonScraper(
	scraperName: string,
	content: string,
): ParsedScraper {
	const classMatch = content.match(/class\s+(\w+)\((.*?)\):/);
	if (!classMatch) {
		throw new Error("Could not parse class definition");
	}

	const className = classMatch[1];
	const tsClassName = `${className}Scraper`;
	const hostTemplate = parseHostTemplate(content);
	const primaryHost = resolveHost(hostTemplate, {});
	if (!primaryHost) {
		throw new Error("Could not resolve primary host from host() method");
	}

	const methods: string[] = [];
	const methodRegex = /def\s+(\w+)\(self.*?\):/g;
	let methodMatch = methodRegex.exec(content);
	while (methodMatch) {
		const methodName = methodMatch[1];
		if (methodName !== "host" && !methodName.startsWith("_")) {
			methods.push(methodName);
		}
		methodMatch = methodRegex.exec(content);
	}

	return {
		className,
		tsClassName,
		pythonFilename: scraperName,
		primaryHost,
		hostTemplate,
		hasWprm: /WPRMMixin/.test(content),
		methods,
	};
}

function parseKwargs(argsText: string): Record<string, string> {
	const kwargs: Record<string, string> = {};
	const re = /(\w+)\s*=\s*["']([^"']+)["']/g;
	let match = re.exec(argsText);
	while (match) {
		kwargs[match[1]] = match[2];
		match = re.exec(argsText);
	}
	return kwargs;
}

function resolveScrapersDictKey(
	keyExpr: string,
	className: string,
	hostTemplate: HostTemplate,
): string | null {
	const literalMatch = keyExpr.match(/^["']([^"']+)["']$/);
	if (literalMatch) {
		return literalMatch[1];
	}

	const hostCallPattern = new RegExp(`^${className}\\.host\\((.*)\\)$`);
	const hostCallMatch = keyExpr.match(hostCallPattern);
	if (!hostCallMatch) {
		return null;
	}

	const argsText = hostCallMatch[1].trim();
	if (!argsText) {
		return resolveHost(hostTemplate, {});
	}

	const kwargs = parseKwargs(argsText);
	return resolveHost(hostTemplate, kwargs);
}

function extractDomainsForClass(
	initContent: string,
	className: string,
	hostTemplate: HostTemplate,
): string[] {
	const lines = initContent.split("\n");
	const domains: string[] = [];
	const seen = new Set<string>();

	let inScrapersMap = false;
	for (const line of lines) {
		if (!inScrapersMap) {
			if (line.includes("SCRAPERS = {")) {
				inScrapersMap = true;
			}
			continue;
		}

		const trimmed = line.trim();
		if (trimmed === "}") {
			break;
		}

		const entryMatch = trimmed.match(/^(.*?):\s*([A-Za-z_]\w*),\s*$/);
		if (!entryMatch) {
			continue;
		}

		const keyExpr = entryMatch[1].trim();
		const entryClassName = entryMatch[2];
		if (entryClassName !== className) {
			continue;
		}

		const resolved = resolveScrapersDictKey(keyExpr, className, hostTemplate);
		if (!resolved) {
			continue;
		}

		if (!seen.has(resolved)) {
			seen.add(resolved);
			domains.push(resolved);
		}
	}

	return domains;
}

function generateMinimalScraper(
	parsed: ParsedScraper,
	domains: string[],
): string {
	const aliasNote =
		domains.length > 1
			? ` * Supports aliases: ${domains.slice(1).join(", ")}\n *\n`
			: "";

	return `/**
 * ${parsed.className} scraper
 * https://${parsed.primaryHost}/
 *
${aliasNote} * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class ${parsed.tsClassName} extends AbstractScraper {
	host(): string {
		return "${parsed.primaryHost}";
	}
}
`;
}

function generateWprmScraper(parsed: ParsedScraper, domains: string[]): string {
	const aliasNote =
		domains.length > 1
			? ` * Supports aliases: ${domains.slice(1).join(", ")}\n *\n`
			: "";

	return `/**
 * ${parsed.className} scraper
 * https://${parsed.primaryHost}/
 *
${aliasNote} * Uses WordPress Recipe Maker (WPRM) plugin for equipment extraction
 */

import { AbstractScraper } from "../abstract";
import { getEquipment, normalizeString } from "../../utils";

export class ${parsed.tsClassName} extends AbstractScraper {
	host(): string {
		return "${parsed.primaryHost}";
	}

	equipment(): string[] {
		const equipmentItems = this.$(".wprm-recipe-equipment-name")
			.map((_, elem) => {
				const text = this.$(elem).text();
				return text ? normalizeString(text.replace(/\\*$/, "")) : "";
			})
			.get()
			.filter(Boolean);

		return getEquipment(equipmentItems);
	}
}
`;
}

function generateScraperWithMethodStubs(
	parsed: ParsedScraper,
	domains: string[],
): string {
	const aliasNote =
		domains.length > 1
			? ` * Supports aliases: ${domains.slice(1).join(", ")}\n *\n`
			: "";

	const methodStubs = parsed.methods
		.map((method) => {
			return `\t/**
\t * TODO: Implement custom ${method}() logic
\t * Check Python implementation in recipe_scrapers/${parsed.pythonFilename}.py
\t */
\t// ${method}(): ReturnType {
\t// \treturn undefined;
\t// }`;
		})
		.join("\n\n");

	return `/**
 * ${parsed.className} scraper
 * https://${parsed.primaryHost}/
 *
${aliasNote} * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class ${parsed.tsClassName} extends AbstractScraper {
	host(): string {
		return "${parsed.primaryHost}";
	}

${methodStubs}
}
`;
}

function generateTypescriptScraper(
	parsed: ParsedScraper,
	domains: string[],
): string {
	if (parsed.methods.length > 0) {
		console.log(
			`⚠️  Detected custom methods in Python: ${parsed.methods.join(", ")}`,
		);
		return generateScraperWithMethodStubs(parsed, domains);
	}

	if (parsed.hasWprm) {
		console.log("📦 Detected WPRMMixin; generating equipment() helper");
		return generateWprmScraper(parsed, domains);
	}

	return generateMinimalScraper(parsed, domains);
}

function parseExistingRegistry(indexContent: string): Map<string, string> {
	const registry = new Map<string, string>();
	const entryRegex = /["']([^"']+)["']\s*:\s*(\w+)\s*,/g;
	let match = entryRegex.exec(indexContent);
	while (match) {
		registry.set(match[1], match[2]);
		match = entryRegex.exec(indexContent);
	}
	return registry;
}

function parseTsScraperMeta(filePath: string): TsScraperMeta {
	const content = readFileSync(filePath, "utf-8");
	const classMatch = content.match(/export\s+class\s+(\w+)/);
	if (!classMatch) {
		throw new Error(`Could not parse class name from ${filePath}`);
	}

	const hostMatch = content.match(
		/host\(\)\s*(?::\s*string)?\s*\{[\s\S]*?return\s+["']([^"']+)["']/,
	);
	if (!hostMatch) {
		throw new Error(`Could not parse host() return value from ${filePath}`);
	}

	return {
		filename: filePath.split("/").pop()?.replace(".ts", "") || "",
		className: classMatch[1],
		host: hostMatch[1],
	};
}

function buildSitesIndexContent(
	scrapers: TsScraperMeta[],
	registryEntries: Map<string, string>,
): string {
	const sortedScrapers = [...scrapers].sort((a, b) =>
		a.className.localeCompare(b.className),
	);

	const imports = sortedScrapers
		.map(
			(scraper) =>
				`import { ${scraper.className} } from "./${scraper.filename}";`,
		)
		.join("\n");

	const exports = sortedScrapers
		.map((scraper) => `\t${scraper.className},`)
		.join("\n");

	const registryLines = [...registryEntries.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([domain, className]) => `\t"${domain}": ${className},`)
		.join("\n");

	return `/**
 * Site-specific scrapers
 *
 * This file exports all scraper classes and provides a SCRAPER_REGISTRY
 * that maps hostnames to their corresponding scraper classes.
 */

import type { ScraperConstructor } from "../../types/scraper";

${imports}

export {
${exports}
};

export const SCRAPER_REGISTRY: Record<string, ScraperConstructor> = {
${registryLines}
};
`;
}

function updateSiteIndex(
	targetDomains: string[],
	targetClassName: string,
): string[] {
	const sitesDir = join(process.cwd(), "src", "scrapers", "sites");
	const indexPath = join(sitesDir, "index.ts");
	const existingIndex = existsSync(indexPath)
		? readFileSync(indexPath, "utf-8")
		: "";

	const existingRegistry = parseExistingRegistry(existingIndex);
	const scraperFiles = readdirSync(sitesDir)
		.filter((file) => file.endsWith(".ts") && file !== "index.ts")
		.sort();

	const scraperMeta = scraperFiles.map((file) =>
		parseTsScraperMeta(join(sitesDir, file)),
	);
	const knownClasses = new Set(scraperMeta.map((scraper) => scraper.className));

	const registry = new Map<string, string>();
	for (const scraper of scraperMeta) {
		registry.set(scraper.host, scraper.className);
	}

	for (const [domain, className] of existingRegistry) {
		if (!knownClasses.has(className)) {
			continue;
		}
		const existingClass = registry.get(domain);
		if (existingClass && existingClass !== className) {
			throw new Error(
				`Registry conflict for '${domain}': ${existingClass} vs ${className}`,
			);
		}
		registry.set(domain, className);
	}

	const addedDomains: string[] = [];
	for (const domain of targetDomains) {
		const existingClass = registry.get(domain);
		if (existingClass && existingClass !== targetClassName) {
			throw new Error(
				`Alias conflict for '${domain}': already mapped to ${existingClass}`,
			);
		}
		if (!registry.has(domain)) {
			addedDomains.push(domain);
		}
		registry.set(domain, targetClassName);
	}

	const newContent = buildSitesIndexContent(scraperMeta, registry);
	writeFileSync(indexPath, newContent, "utf-8");

	return addedDomains.sort();
}

function ensureDomainScaffold(
	domainDir: string,
	domain: string,
	reason: string,
): void {
	mkdirSync(domainDir, { recursive: true });
	writeFileSync(
		join(domainDir, "README.md"),
		`No upstream fixtures found for ${domain}.\nReason: ${reason}\n\nTODO: Add .testhtml/.json fixtures for this domain.\n`,
		"utf-8",
	);
}

function syncDomainFromLocalUpstream(domain: string): FixtureSyncResult | null {
	for (const root of getLocalUpstreamRoots()) {
		const source = join(root, "tests", "test_data", domain);
		if (!existsSync(source)) {
			continue;
		}

		const destination = join(process.cwd(), "test_data", domain);
		mkdirSync(destination, { recursive: true });
		cpSync(source, destination, { recursive: true });
		return {
			domain,
			status: "copied-local",
			detail: `Copied from local upstream repo at ${source}`,
		};
	}

	return null;
}

async function syncDomainFixtures(
	domain: string,
	ref: string,
): Promise<FixtureSyncResult> {
	const destination = join(process.cwd(), "test_data", domain);
	if (existsSync(destination) && readdirSync(destination).length > 0) {
		return {
			domain,
			status: "existing",
			detail: "Local test_data already exists; left unchanged",
		};
	}

	const localResult = syncDomainFromLocalUpstream(domain);
	if (localResult) {
		return localResult;
	}

	const apiUrl = `https://api.github.com/repos/${UPSTREAM_REPO}/contents/tests/test_data/${domain}?ref=${encodeURIComponent(ref)}`;
	try {
		const response = await fetch(apiUrl, { headers: GITHUB_HEADERS });
		if (response.status === 404) {
			ensureDomainScaffold(destination, domain, "Upstream directory not found");
			return {
				domain,
				status: "scaffolded",
				detail: "No upstream fixtures directory found",
			};
		}

		if (!response.ok) {
			ensureDomainScaffold(
				destination,
				domain,
				`GitHub API returned ${response.status}`,
			);
			return {
				domain,
				status: "scaffolded",
				detail: `GitHub API returned ${response.status}`,
			};
		}

		const payload = (await response.json()) as Array<{
			type: string;
			name: string;
			download_url: string | null;
		}>;

		const files = payload.filter(
			(item) => item.type === "file" && typeof item.download_url === "string",
		);
		if (files.length === 0) {
			ensureDomainScaffold(
				destination,
				domain,
				"Upstream fixture directory empty",
			);
			return {
				domain,
				status: "scaffolded",
				detail: "Upstream fixture directory was empty",
			};
		}

		mkdirSync(destination, { recursive: true });
		for (const file of files) {
			const fileResponse = await fetch(file.download_url as string, {
				headers: GITHUB_HEADERS,
			});
			if (!fileResponse.ok) {
				throw new Error(
					`Failed downloading ${file.name} (${fileResponse.status})`,
				);
			}
			writeFileSync(
				join(destination, file.name),
				await fileResponse.text(),
				"utf-8",
			);
		}

		return {
			domain,
			status: "downloaded",
			detail: `Downloaded ${files.length} file(s) from upstream`,
		};
	} catch (error) {
		const fallback = syncDomainFromLocalUpstream(domain);
		if (fallback) {
			return fallback;
		}

		ensureDomainScaffold(destination, domain, "GitHub fetch failed");
		return {
			domain,
			status: "failed",
			detail: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

function runParityValidation(domains: string[]): ParityResult {
	try {
		execSync("bun run build:quiet", {
			encoding: "utf-8",
			maxBuffer: 20 * 1024 * 1024,
			stdio: "pipe",
		});
	} catch (error) {
		return {
			status: "failed",
			detail:
				error instanceof Error
					? `Build failed before parity validation: ${error.message}`
					: "Build failed before parity validation",
		};
	}

	const cmd = `bun scripts/validate-parity.ts -- --implemented-only --domains ${domains.join(" ")}`;
	try {
		execSync(cmd, {
			encoding: "utf-8",
			maxBuffer: 20 * 1024 * 1024,
			stdio: "pipe",
		});
		return {
			status: "passed",
			detail: `Validated domains: ${domains.join(", ")}`,
		};
	} catch (error) {
		const err = error as {
			stdout?: string;
			stderr?: string;
			message?: string;
		};
		const output = `${err.stdout || ""}\n${err.stderr || ""}\n${err.message || ""}`;

		if (
			output.includes("Python not found") ||
			output.includes("recipe_scrapers not installed") ||
			output.includes("Python recipe_scrapers not installed")
		) {
			return {
				status: "skipped",
				detail:
					"Python parity environment not available (install recipe-scrapers in Python to enable parity)",
			};
		}

		return {
			status: "failed",
			detail:
				"Parity validation failed; run bun run validate-parity for details",
		};
	}
}

async function main(): Promise<void> {
	const options = parseArgs(process.argv.slice(2));
	const { scraperName, ref, primaryOnly } = options;

	console.log(`🔄 Migrating '${scraperName}' from ${UPSTREAM_REPO}@${ref}`);

	const pythonScraperPath = `recipe_scrapers/${scraperName}.py`;
	const pythonInitPath = "recipe_scrapers/__init__.py";

	const [pythonScraperContent, pythonInitContent] = await Promise.all([
		loadUpstreamText(pythonScraperPath, ref),
		loadUpstreamText(pythonInitPath, ref),
	]);

	const parsed = parsePythonScraper(scraperName, pythonScraperContent);
	const discoveredDomains = extractDomainsForClass(
		pythonInitContent,
		parsed.className,
		parsed.hostTemplate,
	);

	const domains = primaryOnly
		? [parsed.primaryHost]
		: Array.from(new Set([parsed.primaryHost, ...discoveredDomains]));

	console.log(`   Python class: ${parsed.className}`);
	console.log(`   Primary host: ${parsed.primaryHost}`);
	if (!primaryOnly && domains.length > 1) {
		console.log(`   Aliases: ${domains.slice(1).join(", ")}`);
	}

	const tsPath = join(
		process.cwd(),
		"src",
		"scrapers",
		"sites",
		`${scraperName}.ts`,
	);
	if (existsSync(tsPath)) {
		throw new Error(`TypeScript scraper already exists: ${tsPath}`);
	}

	const tsCode = generateTypescriptScraper(parsed, domains);
	writeFileSync(tsPath, tsCode, "utf-8");
	console.log(`✅ Created ${tsPath}`);

	const addedDomains = updateSiteIndex(domains, parsed.tsClassName);
	console.log(
		`✅ Updated src/scrapers/sites/index.ts (${domains.length} domain mapping(s), ${addedDomains.length} newly added)`,
	);

	const fixtureResults: FixtureSyncResult[] = [];
	for (const domain of domains) {
		// eslint-disable-next-line no-await-in-loop
		const result = await syncDomainFixtures(domain, ref);
		fixtureResults.push(result);
		console.log(`   test_data/${domain}: ${result.status} (${result.detail})`);
	}

	const parity = runParityValidation(domains);
	console.log(`\nParity: ${parity.status} - ${parity.detail}`);

	console.log(`\n${"=".repeat(68)}`);
	console.log("Migration summary");
	console.log(`${"=".repeat(68)}`);
	console.log(`Scraper: ${scraperName}`);
	console.log(`Class: ${parsed.tsClassName}`);
	console.log(`Domains: ${domains.join(", ")}`);
	console.log(`TS file: src/scrapers/sites/${scraperName}.ts`);
	console.log(`Registry: src/scrapers/sites/index.ts`);
	console.log(
		`Fixtures: ${fixtureResults
			.map((result) => `${result.domain}=${result.status}`)
			.join(", ")}`,
	);
	console.log(`Parity: ${parity.status}`);

	console.log("\nNext actions:");
	console.log("1. Review generated scraper and TODO stubs (if any).");
	console.log("2. Run bun test.");
	console.log(
		"3. If parity was skipped, install Python recipe-scrapers and rerun validate-parity for these domains.",
	);
}

void main().catch((error) => {
	console.error(
		`\n❌ Migration failed: ${error instanceof Error ? error.message : String(error)}`,
	);
	process.exit(1);
});
