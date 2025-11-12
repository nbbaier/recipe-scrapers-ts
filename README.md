# recipe-scrapers (TypeScript) 🚧

> **Status:** Early Development (Phase 0/1) | **Progress:** ~5% | **Target:** 100% API parity

TypeScript port of the popular [recipe-scrapers](https://github.com/hhursev/recipe-scrapers) Python library.

## ⚠️ Important: Not Yet Functional

This port is in its **earliest stages**. The project scaffolding is complete, but **core scraping functionality has not been implemented yet**. Do not use this for production.

## Overview

This TypeScript port aims to provide the same comprehensive recipe scraping functionality as the Python version, supporting 518+ recipe websites with a consistent API.

**Development Approach:** Following the Hybrid Approach - developing here in the Python repository for easy reference and shared test data, then extracting to a separate repository once complete.

## Current Status

**✅ Completed (Infrastructure)**
- [x] Project setup and tooling (TypeScript, Jest, ESLint, Prettier)
- [x] Type definitions (Recipe, IngredientGroup, Nutrients)
- [x] Exception classes (5 custom exceptions)
- [x] Test data helpers (access to shared Python test data)
- [x] Build configuration (CJS + ESM output)

**🚧 In Progress / Next**
- [ ] Core utilities (duration parsing, normalization, etc.) - **NEXT UP**
- [ ] Schema.org parser (JSON-LD) - **NEXT UP**
- [ ] OpenGraph parser
- [ ] Abstract scraper base class
- [ ] Plugin system (7 plugins)
- [ ] Factory pattern

**❌ Not Started**
- [ ] Site-specific scrapers (0/518)
- [ ] Parity validation (scripts exist but not functional)
- [ ] Complete documentation

**📊 Detailed Status:** See [STATUS.md](STATUS.md) for comprehensive progress tracking

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
- `npm test` - Run tests (only test helpers work currently)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run lint:fix` - Lint and fix
- `npm run format` - Format code with Prettier
- `npm run type-check` - Type check without emitting
- `npm run validate` - Run all checks (type, lint, test)
- `npm run validate-parity` - ⚠️ Compare with Python (not functional yet)
- `npm run compare` - ⚠️ Compare specific site (not functional yet)

## Architecture

The TypeScript port will mirror the Python structure (✅ = done, ⚠️ = scaffolded, ❌ = not started):

```
typescript/
├── src/
│   ├── exceptions.ts           # ✅ Custom error classes
│   ├── types/
│   │   └── recipe.ts           # ✅ TypeScript type definitions
│   ├── index.ts                # ⚠️ Main entry (placeholder)
│   ├── scrapers/               # ❌ Not started
│   │   ├── abstract.ts         # ❌ Base scraper class
│   │   ├── schema-org.ts       # ❌ Schema.org parser
│   │   ├── opengraph.ts        # ❌ OpenGraph parser
│   │   └── sites/              # ❌ Site-specific scrapers
│   ├── plugins/                # ❌ Plugin system
│   ├── utils/                  # ❌ Utility functions
│   └── factory.ts              # ❌ Factory pattern
├── tests/
│   ├── helpers/
│   │   └── test-data.ts        # ✅ Test data loading
│   └── unit/
│       └── test-data.test.ts   # ✅ Helper tests
└── scripts/
    ├── compare-outputs.ts      # ⚠️ Scaffolded, not functional
    └── validate-parity.ts      # ⚠️ Scaffolded, not functional
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

## Parity Validation (Not Yet Functional)

Once the core implementation is complete, we will maintain 100% parity through automated validation:

```bash
# Validate all scrapers against Python version (COMING SOON)
npm run validate-parity

# Compare specific domain (COMING SOON)
npm run compare -- allrecipes.com
```

The scripts are scaffolded but not yet functional, as there's no scraper implementation to validate.

## Contributing to TypeScript Port

We welcome contributions! Current priorities:

### High Priority (Core Implementation)

1. **Core Utilities** (`src/utils/`) - Duration parsing, string normalization, yield parsing
2. **Schema.org Parser** (`src/scrapers/schema-org.ts`) - JSON-LD parsing (reference: `../recipe_scrapers/_schemaorg.py`)
3. **OpenGraph Parser** (`src/scrapers/opengraph.ts`) - Metadata extraction
4. **Abstract Scraper** (`src/scrapers/abstract.ts`) - Base class with 20+ methods

### How to Contribute

1. Read [STATUS.md](STATUS.md) for detailed implementation status
2. Reference Python implementation: `cat ../recipe_scrapers/[file].py`
3. Check shared test data: `../tests/test_data/`
4. Write tests alongside implementation
5. Follow TypeScript strict mode (no `any` types)

### Example (Future - Not Yet Possible)

Once AbstractScraper exists, site scrapers will look like:

```typescript
import { AbstractScraper } from '../abstract';

export class AllRecipesScraper extends AbstractScraper {
  host(): string {
    return 'allrecipes.com';
  }

  // Most methods inherited from schema.org via plugins
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

### Phase 0/1: Foundation (Current - ~5% Complete)
- [x] Project setup and tooling ✅
- [x] Type definitions ✅
- [x] Exception classes ✅
- [x] Test data helpers ✅
- [ ] Core utilities 🚧 **NEXT**
- [ ] Schema.org parser 🚧 **NEXT**

### Phase 2: Core Architecture (Not Started)
- [ ] OpenGraph parser
- [ ] Abstract scraper base class
- [ ] Plugin system (7 plugins)
- [ ] Factory pattern

### Phase 3: Scraper Implementation (Not Started)
- [ ] First 10 priority scrapers
- [ ] Functional parity validation
- [ ] Remaining 508 scrapers

### Phase 4: Validation & Documentation (Not Started)
- [ ] 100% parity validation
- [ ] Complete documentation
- [ ] Performance testing

### Phase 5: Extraction (Not Started)
- [ ] Extract to separate repository
- [ ] Set up automated test data sync
- [ ] Publish to npm

**Estimated Timeline:** 13-15 weeks total (currently in week 1)

## Documentation

- **[STATUS.md](STATUS.md)** ⭐ **START HERE** - Detailed current status and progress
- [TYPESCRIPT_PORT_PLAN.md](TYPESCRIPT_PORT_PLAN.md) - Overall strategy and requirements
- [docs/archive/](docs/archive/) - Archived planning documents (for reference)
- [Python Documentation](https://docs.recipe-scrapers.com) - Reference for API parity

## Questions?

- **Python version issues:** [Python repo issues](https://github.com/hhursev/recipe-scrapers/issues)
- **TypeScript port questions:** Comment on relevant commit or file an issue mentioning the TypeScript port

## License

MIT (same as Python version)

---

**Note:** This is a work in progress. The API and structure may change as we work towards parity with the Python version.
