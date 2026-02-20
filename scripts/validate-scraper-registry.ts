#!/usr/bin/env bun

/**
 * Verify src/scrapers/sites/index.ts stays in sync with implemented site scrapers.
 *
 * Checks that every scraper module in src/scrapers/sites:
 * - is imported in index.ts
 * - is re-exported from index.ts
 * - has its host() domain registered in SCRAPER_REGISTRY
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface ScraperMeta {
  moduleName: string;
  className: string;
  host: string;
}

const SITES_DIR = join(import.meta.dirname, "../src/scrapers/sites");
const INDEX_PATH = join(SITES_DIR, "index.ts");

function getImplementedScrapers(): ScraperMeta[] {
  const files = readdirSync(SITES_DIR)
    .filter((file) => file.endsWith(".ts") && file !== "index.ts")
    .sort();

  return files.map((file) => {
    const content = readFileSync(join(SITES_DIR, file), "utf-8");

    const classMatch = content.match(/export\s+class\s+(\w+)/);
    const hostMatch = content.match(
      /host\(\)\s*:\s*string\s*\{[^}]*return\s+["']([^"']+)["']/s,
    );

    if (!classMatch) {
      throw new Error(`Could not parse class name from ${file}`);
    }

    if (!hostMatch) {
      throw new Error(`Could not parse host() return value from ${file}`);
    }

    return {
      moduleName: file.replace(/\.ts$/, ""),
      className: classMatch[1],
      host: hostMatch[1],
    };
  });
}

function getIndexImports(indexContent: string): Map<string, string> {
  const imports = new Map<string, string>();
  const importRegex = /import\s+\{\s*(\w+)\s*\}\s+from\s+["']\.\/(.+?)["'];/g;

  let match = importRegex.exec(indexContent);
  while (match) {
    imports.set(match[2], match[1]);
    match = importRegex.exec(indexContent);
  }

  return imports;
}

function getIndexExports(indexContent: string): Set<string> {
  const exportMatch = indexContent.match(/export\s*\{([\s\S]*?)\};/);

  if (!exportMatch) {
    throw new Error(
      "Could not parse export block from src/scrapers/sites/index.ts",
    );
  }

  return new Set(
    exportMatch[1]
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function getIndexRegistry(indexContent: string): Map<string, string> {
  const registryBlockMatch = indexContent.match(
    /export\s+const\s+SCRAPER_REGISTRY:[\s\S]*?=\s*\{([\s\S]*?)\n\};/,
  );

  if (!registryBlockMatch) {
    throw new Error(
      "Could not parse SCRAPER_REGISTRY block from src/scrapers/sites/index.ts",
    );
  }

  const registry = new Map<string, string>();
  const pairRegex = /"([^"]+)"\s*:\s*(\w+)/g;

  let match = pairRegex.exec(registryBlockMatch[1]);
  while (match) {
    registry.set(match[1], match[2]);
    match = pairRegex.exec(registryBlockMatch[1]);
  }

  return registry;
}

function main(): void {
  const scrapers = getImplementedScrapers();
  const indexContent = readFileSync(INDEX_PATH, "utf-8");

  const imports = getIndexImports(indexContent);
  const exports = getIndexExports(indexContent);
  const registry = getIndexRegistry(indexContent);

  const missingImports: string[] = [];
  const missingExports: string[] = [];
  const missingRegistryEntries: string[] = [];

  for (const scraper of scrapers) {
    const importedClass = imports.get(scraper.moduleName);
    if (importedClass !== scraper.className) {
      missingImports.push(
        `${scraper.moduleName}.ts -> expected import { ${scraper.className} } from "./${scraper.moduleName}"`,
      );
    }

    if (!exports.has(scraper.className)) {
      missingExports.push(scraper.className);
    }

    const registeredClass = registry.get(scraper.host);
    if (registeredClass !== scraper.className) {
      missingRegistryEntries.push(
        `${scraper.host} -> expected ${scraper.className}`,
      );
    }
  }

  const issues =
    missingImports.length +
    missingExports.length +
    missingRegistryEntries.length;

  if (issues === 0) {
    console.log(
      `✅ Registry is in sync (${scrapers.length} implemented scrapers validated).`,
    );
    return;
  }

  console.error("❌ Scraper registry validation failed.");
  console.error(
    'Run "bun run sync-registry" to regenerate src/scrapers/sites/index.ts.',
  );

  if (missingImports.length > 0) {
    console.error("\nMissing or incorrect imports:");
    for (const issue of missingImports) {
      console.error(`- ${issue}`);
    }
  }

  if (missingExports.length > 0) {
    console.error("\nMissing exports:");
    for (const issue of missingExports) {
      console.error(`- ${issue}`);
    }
  }

  if (missingRegistryEntries.length > 0) {
    console.error("\nMissing or incorrect registry entries:");
    for (const issue of missingRegistryEntries) {
      console.error(`- ${issue}`);
    }
  }

  process.exit(1);
}

try {
  main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`validate-scraper-registry failed: ${message}`);
  process.exit(1);
}
