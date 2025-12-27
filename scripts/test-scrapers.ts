#!/usr/bin/env bun
/**
 * Test that all TypeScript scrapers can be instantiated and run
 * This doesn't validate parity with Python, just that scrapers work
 *
 * Usage:
 *   bun scripts/test-scrapers.ts
 *   bun scripts/test-scrapers.ts allrecipes.com
 */

// Import from built distribution to ensure plugins are initialized
const { scrapeHtml, getSupportedUrls } = require("../dist/index.cjs");

console.log("🧪 Testing TypeScript Scrapers\n");

// Get domains to test
const args = process.argv.slice(2);
const domains = args.length > 0 ? args : getSupportedUrls();

console.log(`Testing ${domains.length} domain(s)...\n`);

let passed = 0;
let failed = 0;
const errors: Array<{ domain: string; error: string }> = [];

for (const domain of domains) {
	try {
		// Create a minimal HTML document with Schema.org data
		const testHtml = `
			<!DOCTYPE html>
			<html>
			<head><title>Test Recipe</title></head>
			<body>
				<script type="application/ld+json">
				{
					"@context": "https://schema.org",
					"@type": "Recipe",
					"name": "Test Recipe",
					"description": "A test recipe",
					"recipeIngredient": ["1 cup flour", "2 eggs"],
					"recipeInstructions": "Mix and bake"
				}
				</script>
			</body>
			</html>
		`;

		// Try to create scraper
		const scraper = scrapeHtml(testHtml, `https://${domain}/test-recipe`, {
			supportedOnly: true,
		});

		// Try to get JSON output (just verify it doesn't throw)
		const json = scraper.toJson();

		// Basic validation - just check we got something back
		if (typeof json !== "object" || json === null) {
			throw new Error("toJson() did not return an object");
		}

		console.log(`✓ ${domain}`);
		passed++;
	} catch (error) {
		console.log(
			`✗ ${domain}: ${error instanceof Error ? error.message : String(error)}`,
		);
		errors.push({
			domain,
			error: error instanceof Error ? error.message : String(error),
		});
		failed++;
	}
}

console.log(`\n${"=".repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`Success rate: ${((passed / domains.length) * 100).toFixed(1)}%`);

if (errors.length > 0) {
	console.log(`\nFailed domains:`);
	for (const { domain, error } of errors) {
		console.log(`  - ${domain}: ${error}`);
	}
	process.exit(1);
}

console.log("\n✅ All scrapers working!");
