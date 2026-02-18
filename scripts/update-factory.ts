#!/usr/bin/env bun
/**
 * Auto-update factory.ts with all site-specific scrapers
 *
 * Reads all scrapers from src/scrapers/sites/ and generates
 * the import and registration code for factory.ts
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SCRAPER_CLASS_NAME_REGEX } from "./common";

interface ScraperInfo {
	className: string;
	filename: string;
	hostname: string;
}

function extractHostname(filepath: string): string | null {
	const content = readFileSync(filepath, "utf-8");
	const hostMatch = content.match(
		/host\(\):\s*string\s*\{\s*return\s+"([^"]+)"/,
	);
	if (hostMatch) {
		return hostMatch[1];
	}
	return null;
}

function main() {
	const sitesDir = join(process.cwd(), "src", "scrapers", "sites");
	const factoryPath = join(process.cwd(), "src", "factory.ts");

	// Read all scraper files (except index.ts)
	const files = readdirSync(sitesDir)
		.filter((f) => f.endsWith(".ts") && f !== "index.ts")
		.sort();

	console.log(`Found ${files.length} scraper files`);

	// Extract scraper info
	const scrapers: ScraperInfo[] = [];

	for (const file of files) {
		const filepath = join(sitesDir, file);
		const filename = file.replace(".ts", "");

		// Extract actual class name from file
		const content = readFileSync(filepath, "utf-8");
		const classMatch = content.match(SCRAPER_CLASS_NAME_REGEX);
		if (!classMatch) {
			console.warn(`⚠️  Could not extract class name from ${file}`);
			continue;
		}
		const className = classMatch[1];

		// Extract hostname from file content
		const hostname = extractHostname(filepath);

		if (!hostname) {
			console.warn(`⚠️  Could not extract hostname from ${file}`);
			continue;
		}

		scrapers.push({ className, filename, hostname });
		console.log(`✓ ${className} → ${hostname}`);
	}

	// Read current factory.ts
	const factoryContent = readFileSync(factoryPath, "utf-8");

	// Find the section to replace
	const importStart = factoryContent.indexOf(
		"// Import site-specific scrapers",
	);
	const importEnd = factoryContent.indexOf(
		"// Register all site-specific scrapers",
	);

	if (importStart === -1 || importEnd === -1) {
		console.error("❌ Could not find markers in factory.ts");
		process.exit(1);
	}

	// Find the registration section end
	const registerEnd = factoryContent.indexOf("\n/**", importEnd);

	if (registerEnd === -1) {
		console.error("❌ Could not find registration section end");
		process.exit(1);
	}

	// Generate imports
	const imports = scrapers.map((s) => `\t${s.className},`).join("\n");
	const importSection = `// Import site-specific scrapers\nimport {\n${imports}\n} from "./scrapers/sites";\n\n`;

	// Generate registrations
	const registrations = scrapers
		.map((s) => {
			return `registerScraper("${s.hostname}", ${s.className});`;
		})
		.join("\n");

	const registerSection = `// Register all site-specific scrapers\n${registrations}\n`;

	// Build new content
	const before = factoryContent.slice(0, importStart);
	const after = factoryContent.slice(registerEnd);
	const newContent = `${before + importSection + registerSection}\n${after}`;

	// Write back
	writeFileSync(factoryPath, newContent, "utf-8");

	console.log(`\n✅ Updated factory.ts with ${scrapers.length} scrapers`);
	console.log(`   Imports: ${scrapers.length} classes`);
	console.log(`   Registrations: ${scrapers.length} domains`);
}

main();
