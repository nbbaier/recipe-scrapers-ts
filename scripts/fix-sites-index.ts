#!/usr/bin/env bun
/**
 * Fix sites/index.ts by reading actual class names from scraper files
 */

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { SCRAPER_CLASS_NAME_REGEX } from "./common";

const sitesDir = join(process.cwd(), "src", "scrapers", "sites");
const indexPath = join(sitesDir, "index.ts");

// Read all .ts files except index.ts
const files = readdirSync(sitesDir)
	.filter((f) => f.endsWith(".ts") && f !== "index.ts")
	.sort();

const exports: Array<{ filename: string; className: string }> = [];

for (const file of files) {
	const filepath = join(sitesDir, file);
	const content = readFileSync(filepath, "utf-8");

	// Extract class name
	const classMatch = content.match(SCRAPER_CLASS_NAME_REGEX);
	if (!classMatch) {
		console.warn(`⚠️  Could not find class in ${file}`);
		continue;
	}

	const className = classMatch[1];
	const filename = file.replace(".ts", "");

	exports.push({ filename, className });
	console.log(`✓ ${filename} → ${className}`);
}

// Generate new index content
const exportLines = exports.map(({ filename, className }) => {
	return `export { ${className} } from "./${filename}";`;
});

const newContent = `/**
 * Site-specific scrapers
 * Auto-generated exports - do not edit manually
 */

${exportLines.join("\n")}
`;

writeFileSync(indexPath, newContent, "utf-8");
console.log(`\n✅ Updated sites/index.ts with ${exports.length} exports`);
