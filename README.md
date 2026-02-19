# recipe-scrapers-ts

TypeScript port of the popular [recipe-scrapers](https://github.com/hhursev/recipe-scrapers) Python library. Extract structured recipe data from 500+ cooking websites.

## Status

Core architecture is complete and functional. Wild mode (Schema.org-based scraping) works for the majority of recipe sites. 52 site-specific scrapers are implemented with more being added.

## Quick Start

```bash
# Install dependencies
bun install

# Sync test data from upstream Python repo
bun run sync-test-data

# Run tests
bun test

# Build
bun run build
```

## Usage

```typescript
import { scrapeHtml } from "recipe-scrapers-ts";

// Scrape a supported site
const scraper = scrapeHtml(html, "https://allrecipes.com/recipe/123");
console.log(scraper.title()); // "Chocolate Cake"
console.log(scraper.ingredients()); // ["2 cups flour", "1 cup sugar", ...]
console.log(scraper.toJson()); // Full recipe as JSON

// Wild mode: scrape any site with Schema.org data
const scraper = scrapeHtml(html, "https://any-recipe-site.com/recipe", {
   supportedOnly: false,
});
```

## Architecture

```
src/
├── index.ts                # Main entry point, plugin initialization
├── factory.ts              # Scraper registry, wild mode
├── exceptions.ts           # 10 exception classes
├── settings/               # Configurable behavior
├── scrapers/
│   ├── abstract.ts         # Base scraper class
│   └── sites/              # 52 site-specific scrapers
├── parsers/
│   ├── schema-org.ts       # Schema.org JSON-LD parser
│   └── opengraph.ts        # OpenGraph fallback parser
├── plugins/                # 8 plugins (exception handling, data fill, normalization)
└── utils/                  # Duration parsing, fractions, string normalization, etc.
```

## Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- Python 3.9+ with `recipe-scrapers` installed (only for parity validation)

### Scripts

| Script                        | Description                                    |
| ----------------------------- | ---------------------------------------------- |
| `bun test`                    | Run tests                                      |
| `bun run build`               | Build to dist/                                 |
| `bun run sync-test-data`      | Sync test data from upstream Python repo       |
| `bun run type-check`          | TypeScript type checking                       |
| `bun run lint`                | Lint with Biome                                |
| `bun run risk-policy-gate`    | Run deterministic control-plane policy gate    |
| `bun run harness:risk-tier`   | Alias for risk policy gate                     |
| `bun run compare -- <domain>` | Compare output with Python for a specific site |
| `bun run validate-parity`     | Validate all scrapers against Python output    |

### Test Data

Test data (HTML snapshots + expected JSON) is synced from the [upstream Python repo](https://github.com/hhursev/recipe-scrapers). Run `bun run sync-test-data` after cloning to pull the latest test data.

### Adding a Scraper

Most scrapers are minimal since they inherit from Schema.org via plugins:

```typescript
import { AbstractScraper } from "../abstract";

export class ExampleScraper extends AbstractScraper {
   host(): string {
      return "example.com";
   }
   // All methods (title, ingredients, instructions, etc.) are
   // automatically filled from Schema.org data via plugins.
   // Override only when the site needs special handling.
}
```

Register it in `src/scrapers/sites/index.ts` and add test data in `test_data/example.com/`.

## Parity Validation

The TypeScript port aims for 1:1 output parity with the Python version. Known differences are tracked in [PARITY_ISSUES.md](PARITY_ISSUES.md).

## Control Plane Gate

This repo includes a machine-readable policy contract at `policy/risk-policy.contract.json` and a deterministic gate script at `scripts/risk-policy-gate.ts`.

Run it locally:

```bash
bun run risk-policy-gate
```

Full control-plane details are in [docs/control-plane.md](docs/control-plane.md).

## License

MIT (same as the Python version)
