#!/usr/bin/env bun
/**
 * Automated Python to TypeScript scraper migration script
 *
 * Usage:
 *   bun scripts/migrate-scraper.ts <scraper-name>
 *   bun scripts/migrate-scraper.ts allrecipes
 *   bun scripts/migrate-scraper.ts --batch budgetbytes,pinchofyum,minimalistbaker
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Patterns to detect in Python code
const PATTERNS = {
  className: /class\s+(\w+)\((.*?)\):/,
  host: /@classmethod\s+def\s+host\(cls\):\s+return\s+"([^"]+)"/s,
  hostAlt: /@classmethod\s+def\s+host\(cls\):\s+return\s+'([^']+)'/s,
  method: /def\s+(\w+)\(self.*?\):/g,
  wprm: /WPRMMixin/,
  imports: /from\s+\._(\w+)\s+import\s+(.*)/g,
};

interface ParsedScraper {
  className: string;
  tsClassName: string;
  host: string;
  hasWprm: boolean;
  baseclasses: string[];
  methods: string[];
  fullContent: string;
  imports: string[];
}

function parsePythonScraper(filepath: string): ParsedScraper | null {
  if (!existsSync(filepath)) {
    console.error(`❌ File not found: ${filepath}`);
    return null;
  }

  const content = readFileSync(filepath, 'utf-8');

  // Extract class name
  const classMatch = content.match(PATTERNS.className);
  if (!classMatch) {
    console.error('❌ Could not find class definition');
    return null;
  }

  const className = classMatch[1];
  const baseclasses = classMatch[2].split(',').map(b => b.trim()).filter(Boolean);

  // Extract host
  let hostMatch = content.match(PATTERNS.host);
  if (!hostMatch) {
    hostMatch = content.match(PATTERNS.hostAlt);
  }

  if (!hostMatch) {
    console.error('❌ Could not find host() method');
    return null;
  }

  const host = hostMatch[1];

  // Check for WPRM mixin
  const hasWprm = PATTERNS.wprm.test(content);

  // Extract method names (excluding host and __init__)
  const methods: string[] = [];
  let methodMatch;
  const methodRegex = new RegExp(PATTERNS.method);

  while ((methodMatch = methodRegex.exec(content)) !== null) {
    const methodName = methodMatch[1];
    if (methodName !== 'host' && !methodName.startsWith('_')) {
      methods.push(methodName);
    }
  }

  // Extract imports
  const imports: string[] = [];
  let importMatch;
  const importRegex = new RegExp(PATTERNS.imports);

  while ((importMatch = importRegex.exec(content)) !== null) {
    imports.push(importMatch[0]);
  }

  return {
    className,
    tsClassName: `${className}Scraper`,
    host,
    hasWprm,
    baseclasses,
    methods,
    fullContent: content,
    imports,
  };
}

function generateMinimalScraper(parsed: ParsedScraper): string {
  const { tsClassName, host, className } = parsed;

  return `/**
 * ${className} scraper
 * https://${host}/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class ${tsClassName} extends AbstractScraper {
	host(): string {
		return "${host}";
	}
}
`;
}

function generateWprmScraper(parsed: ParsedScraper): string {
  const { tsClassName, host, className } = parsed;

  return `/**
 * ${className} scraper
 * https://${host}/
 *
 * Uses WordPress Recipe Maker (WPRM) plugin for equipment extraction
 */

import { AbstractScraper } from "../abstract";
import { getEquipment, normalizeString } from "../../utils";

export class ${tsClassName} extends AbstractScraper {
	host(): string {
		return "${host}";
	}

	/**
	 * Extract equipment from WPRM plugin markup
	 */
	equipment(): string[] {
		const equipmentItems = this.$(".wprm-recipe-equipment-name")
			.map((_, elem) => {
				const text = this.$(elem).text();
				return text ? normalizeString(text.replace(/\*$/, "")) : "";
			})
			.get()
			.filter(Boolean);

		return getEquipment(equipmentItems);
	}
}
`;
}

function generateScraperWithMethods(parsed: ParsedScraper): string {
  const { tsClassName, host, className, methods } = parsed;

  const methodStubs = methods.map(method => {
    return `\t/**
\t * TODO: Implement custom ${method}() logic
\t * Check Python implementation in recipe_scrapers/${className.toLowerCase()}.py
\t */
\t// ${method}(): ReturnType {
\t// \treturn undefined;
\t// }`;
  }).join('\n\n');

  return `/**
 * ${className} scraper
 * https://${host}/
 *
 * Custom implementation - has overridden methods
 * TODO: Review Python implementation and port custom logic
 */

import { AbstractScraper } from "../abstract";

export class ${tsClassName} extends AbstractScraper {
	host(): string {
		return "${host}";
	}

${methodStubs}
}
`;
}

function generateTypescriptScraper(parsed: ParsedScraper): string {
  // If it has custom methods, generate with stubs
  if (parsed.methods.length > 0) {
    console.log(`⚠️  Has ${parsed.methods.length} custom method(s): ${parsed.methods.join(', ')}`);
    console.log('   Generating with TODO stubs - manual review required');
    return generateScraperWithMethods(parsed);
  }

  // If it uses WPRM mixin
  if (parsed.hasWprm) {
    console.log('📦 Uses WPRMMixin - generating with equipment() method');
    return generateWprmScraper(parsed);
  }

  // Otherwise, minimal scraper
  console.log('✅ Minimal scraper - relies on Schema.org');
  return generateMinimalScraper(parsed);
}

function migrateScraper(scraperName: string): boolean {
  console.log(`\n🔄 Migrating ${scraperName}...`);

  // Determine paths
  const pythonPath = join(process.cwd(), '..', 'recipe_scrapers', `${scraperName}.py`);
  const tsPath = join(process.cwd(), 'src', 'scrapers', 'sites', `${scraperName}.ts`);

  // Check if already exists
  if (existsSync(tsPath)) {
    console.log(`⚠️  TypeScript scraper already exists: ${tsPath}`);
    console.log('   Skipping...');
    return false;
  }

  // Parse Python scraper
  const parsed = parsePythonScraper(pythonPath);
  if (!parsed) {
    return false;
  }

  console.log(`   Class: ${parsed.className}`);
  console.log(`   Host: ${parsed.host}`);

  // Generate TypeScript code
  const tsCode = generateTypescriptScraper(parsed);

  // Write file
  writeFileSync(tsPath, tsCode, 'utf-8');
  console.log(`✅ Created: ${tsPath}`);

  return true;
}

function updateSiteScrapersIndex(scraperNames: string[]): void {
  const indexPath = join(process.cwd(), 'src', 'scrapers', 'sites', 'index.ts');

  // Read existing scrapers
  const existingContent = existsSync(indexPath) ? readFileSync(indexPath, 'utf-8') : '';
  const existingExports = new Set<string>();

  // Parse existing exports
  const exportRegex = /export \{ (\w+) \} from ["']\.\/(\w+)["'];/g;
  let match;
  while ((match = exportRegex.exec(existingContent)) !== null) {
    existingExports.add(match[2]); // filename
  }

  // Add new scrapers
  for (const name of scraperNames) {
    existingExports.add(name);
  }

  // Generate new index file
  const sortedScrapers = Array.from(existingExports).sort();
  const exports = sortedScrapers.map(name => {
    // Convert filename to class name (e.g., allrecipes -> AllRecipesScraper)
    const className = name
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'Scraper';

    return `export { ${className} } from "./${name}";`;
  });

  const newContent = `/**
 * Site-specific scrapers
 * Auto-generated exports - do not edit manually
 */

${exports.join('\n')}
`;

  writeFileSync(indexPath, newContent, 'utf-8');
  console.log(`\n✅ Updated sites/index.ts with ${sortedScrapers.length} scraper(s)`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
🔄 Python to TypeScript Scraper Migration Tool

Usage:
  bun scripts/migrate-scraper.ts <scraper-name>           # Migrate single scraper
  bun scripts/migrate-scraper.ts --batch name1,name2,...  # Migrate multiple scrapers
  bun scripts/migrate-scraper.ts --help                   # Show this help

Examples:
  bun scripts/migrate-scraper.ts budgetbytes
  bun scripts/migrate-scraper.ts --batch budgetbytes,pinchofyum,skinnytaste

Notes:
  - Scraper names should match Python filenames (without .py extension)
  - Script will automatically detect:
    • Minimal scrapers (just host())
    • WPRM-based scrapers (will add equipment() method)
    • Complex scrapers (will generate TODO stubs)
  - TypeScript files are written to: src/scrapers/sites/
  - sites/index.ts is automatically updated with exports
`);
    process.exit(0);
  }

  let scrapers: string[] = [];

  if (args[0] === '--batch' || args[0] === '-b') {
    if (!args[1]) {
      console.error('❌ --batch requires comma-separated scraper names');
      process.exit(1);
    }
    scrapers = args[1].split(',').map(s => s.trim());
  } else {
    scrapers = args;
  }

  console.log(`📦 Migrating ${scrapers.length} scraper(s)...`);

  const successful: string[] = [];
  const failed: string[] = [];

  for (const scraper of scrapers) {
    if (migrateScraper(scraper)) {
      successful.push(scraper);
    } else {
      failed.push(scraper);
    }
  }

  // Update index file
  if (successful.length > 0) {
    updateSiteScrapersIndex(successful);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully migrated: ${successful.length}`);
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`   ${failed.join(', ')}`);
  }
  console.log('='.repeat(60));

  console.log('\n📝 Next steps:');
  console.log('1. Review generated scrapers (especially those with custom methods)');
  console.log('2. Register scrapers in src/factory.ts');
  console.log('3. Run: bun run build');
  console.log('4. Run: bun test');
}

main();
