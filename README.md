# recipe-scrapers (TypeScript) 🚧

> **Status:** Under active development | **Target:** 100% API parity with Python version

TypeScript port of the popular [recipe-scrapers](https://github.com/hhursev/recipe-scrapers) Python library.

## Overview

This TypeScript port aims to provide the same comprehensive recipe scraping functionality as the Python version, supporting 518+ recipe websites with a consistent API.

**Development Approach:** Following the [Hybrid Approach](../APPROACH_4_HYBRID.md) - developing here in the Python repository for easy reference and shared test data, then extracting to a separate repository once complete.

## Current Status

- [ ] Core architecture (parsers, plugins, abstract scraper)
- [ ] Utility functions (duration parsing, normalization, etc.)
- [ ] Schema.org parser (JSON-LD, Microdata, RDFa)
- [ ] OpenGraph parser
- [ ] Plugin system
- [ ] Site-specific scrapers (0/518)
- [ ] Test infrastructure
- [ ] Parity validation
- [ ] Documentation

**Parity Status:** 0% (just starting!)

## Quick Start (For Development)

```bash
cd typescript

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Validate parity with Python version
npm run validate-parity
```

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or pnpm
- Python 3.9+ (for parity validation)

### Installation

```bash
# From the typescript directory
npm install

# Install Python version for comparison
cd ..
pip install -e .
```

### Available Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Build in watch mode
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run lint:fix` - Lint and fix
- `npm run format` - Format code with Prettier
- `npm run type-check` - Type check without emitting
- `npm run validate` - Run all checks (type, lint, test)

## Architecture

The TypeScript port mirrors the Python structure:

```
typescript/
├── src/
│   ├── scrapers/
│   │   ├── abstract.ts         # Base scraper class
│   │   ├── schema-org.ts       # Schema.org parser
│   │   ├── opengraph.ts        # OpenGraph parser
│   │   └── sites/              # Site-specific scrapers
│   ├── plugins/                # Plugin system
│   ├── utils/                  # Utility functions
│   ├── types/                  # TypeScript type definitions
│   └── exceptions.ts           # Custom error classes
├── tests/
│   ├── unit/                   # Unit tests
│   ├── scrapers/               # Scraper integration tests
│   └── helpers/                # Test utilities
└── scripts/
    ├── compare-outputs.ts      # Compare Python vs TypeScript
    └── validate-parity.ts      # Full parity validation
```

## Testing

Tests use the same test data as the Python version (located in `../tests/test_data/`), ensuring true 1:1 parity.

```bash
# Run all tests
npm test

# Run specific test file
npm test -- scrapers/allrecipes.test.ts

# Run with coverage
npm run test:coverage
```

## Parity Validation

We maintain 100% parity with the Python version through automated validation:

```bash
# Validate all scrapers against Python version
npm run validate-parity

# Compare specific domain
npm run compare -- allrecipes.com
```

The validation script:
1. Runs both Python and TypeScript scrapers on the same HTML
2. Compares JSON outputs
3. Reports any differences

## Contributing to TypeScript Port

We welcome contributions! Here's how to help:

### Adding a Scraper

1. Check the Python version: `cat ../recipe_scrapers/[site].py`
2. Create TypeScript equivalent: `src/scrapers/sites/[site].ts`
3. Extend `AbstractScraper` and implement required methods
4. Create test file: `tests/scrapers/[site].test.ts`
5. Run tests and validate parity

Example:

```typescript
import { AbstractScraper } from '../abstract';

export class AllRecipesScraper extends AbstractScraper {
  host(): string {
    return 'allrecipes.com';
  }

  // Most methods inherited from schema.org via plugins
  // Override only if site needs special handling
}
```

### Code Style

- **TypeScript:** Strict mode enabled
- **Formatting:** Prettier (runs on commit)
- **Linting:** ESLint with TypeScript rules
- **Tests:** Jest
- **Coverage:** Minimum 90%

## Relationship to Python Version

This TypeScript port is being developed **within** the Python repository to:

✅ Easily reference Python implementations
✅ Share test data (no duplication)
✅ Validate parity side-by-side
✅ Ensure true 1:1 functionality

Once complete and validated, it will be:

1. Extracted to its own repository (`recipe-scrapers-ts`)
2. Published to npm
3. Maintained independently with automated test data sync

## Roadmap

### Phase 1: Foundation (Current)
- [ ] Project setup and tooling
- [ ] Core utilities
- [ ] Type definitions
- [ ] Exception classes

### Phase 2: Core Architecture
- [ ] Schema.org parser
- [ ] OpenGraph parser
- [ ] Plugin system
- [ ] Abstract scraper base class

### Phase 3: Scraper Implementation
- [ ] First 10 priority scrapers
- [ ] Parity validation system
- [ ] Remaining 508 scrapers

### Phase 4: Validation & Documentation
- [ ] 100% parity validation
- [ ] Complete documentation
- [ ] Performance testing

### Phase 5: Extraction
- [ ] Extract to separate repository
- [ ] Set up automated test data sync
- [ ] Publish to npm

**Estimated Timeline:** 13 weeks (11 weeks dev + 2 weeks extraction)

## Documentation

- [Overall Port Plan](../TYPESCRIPT_PORT_PLAN.md) - Strategy and requirements
- [Approach 4: Hybrid](../APPROACH_4_HYBRID.md) - Detailed implementation plan
- [Python Documentation](https://docs.recipe-scrapers.com) - Reference for API

## Questions?

- **Python version issues:** [Python repo issues](https://github.com/hhursev/recipe-scrapers/issues)
- **TypeScript port questions:** Comment on relevant commit or file an issue mentioning the TypeScript port

## License

MIT (same as Python version)

---

**Note:** This is a work in progress. The API and structure may change as we work towards parity with the Python version.
