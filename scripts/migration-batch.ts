#!/usr/bin/env bun

/**
 * Migration batch selector.
 *
 * Selects a deterministic batch of unimplemented scrapers from test data.
 *
 * Usage:
 *   bun scripts/migration-batch.ts
 *   bun scripts/migration-batch.ts --limit 5 --output artifacts/migration-batch.json
 *   bun scripts/migration-batch.ts --json
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { SCRAPER_REGISTRY } from "../src/scrapers/sites";
import { getTestDomains } from "../tests/helpers/test-data";

interface CliArgs {
  limit?: number;
  output?: string;
  json: boolean;
}

function printHelp(): void {
  console.log(`migration-batch

Options:
  --limit <number>   Number of domains to select (default: 5)
  --output <path>    Output JSON file (default: artifacts/migration-batch.json)
  --json             Print JSON output to stdout
  --help             Show help
`);
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    json: false,
  };

  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    const nextValue = argv[index + 1];

    switch (token) {
      case "--limit":
        if (!nextValue) {
          throw new Error("--limit requires a value");
        }
        args.limit = Number.parseInt(nextValue, 10);
        if (Number.isNaN(args.limit) || args.limit <= 0) {
          throw new Error("--limit must be a positive number");
        }
        index++;
        break;
      case "--output":
        if (!nextValue) {
          throw new Error("--output requires a value");
        }
        args.output = nextValue;
        index++;
        break;
      case "--json":
        args.json = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        return;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function resolveLimit(args: CliArgs): number {
  if (args.limit) {
    return args.limit;
  }
  const envLimit = process.env.MIGRATION_BATCH_SIZE;
  if (envLimit) {
    const parsed = Number.parseInt(envLimit, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 5;
}

function resolveOutput(args: CliArgs): string {
  return (
    args.output ??
    process.env.MIGRATION_BATCH_OUTPUT ??
    "artifacts/migration-batch.json"
  );
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const limit = resolveLimit(args);
  const outputPath = resolve(process.cwd(), resolveOutput(args));

  const allDomains = getTestDomains().sort();
  const implemented = new Set(Object.keys(SCRAPER_REGISTRY));
  const pending = allDomains
    .filter((domain) => !implemented.has(domain))
    .sort();
  const selected = pending.slice(0, limit);

  const result = {
    generatedAt: new Date().toISOString(),
    limit,
    totalDomains: allDomains.length,
    implementedCount: implemented.size,
    pendingCount: pending.length,
    selectedDomains: selected,
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log("Migration Batch");
  console.log(`- Output: ${outputPath}`);
  console.log(`- Total domains: ${result.totalDomains}`);
  console.log(`- Implemented: ${result.implementedCount}`);
  console.log(`- Pending: ${result.pendingCount}`);
  console.log(
    `- Selected (${selected.length}): ${selected.join(", ") || "(none)"}`,
  );
}

try {
  main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`migration-batch failed: ${message}`);
  process.exit(1);
}
