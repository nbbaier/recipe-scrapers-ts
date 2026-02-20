#!/usr/bin/env bun

/**
 * Regenerate src/scrapers/sites/index.ts from implemented scraper modules.
 *
 * This keeps imports, exports, and SCRAPER_REGISTRY consistent with files in
 * src/scrapers/sites/*.ts (excluding index.ts).
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
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

function renderIndex(scrapers: ScraperMeta[]): string {
  const imports = scrapers
    .map(
      (scraper) =>
        `import { ${scraper.className} } from "./${scraper.moduleName}";`,
    )
    .join("\n");

  const exports = scrapers
    .map((scraper) => `  ${scraper.className},`)
    .join("\n");

  const registryEntries = scrapers
    .map((scraper) => `  "${scraper.host}": ${scraper.className},`)
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
${registryEntries}
};
`;
}

function main(): void {
  const scrapers = getImplementedScrapers();

  writeFileSync(INDEX_PATH, renderIndex(scrapers));

  console.log(
    `✅ Regenerated src/scrapers/sites/index.ts for ${scrapers.length} scraper modules.`,
  );
}

try {
  main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`sync-scraper-registry failed: ${message}`);
  process.exit(1);
}
