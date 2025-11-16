# recipe-scrapers (TypeScript) 🚀

- **Status:** Core Architecture Complete! (Phase 3)
- **Progress:** ~55% complete
- **Target:** 100% API parity

TypeScript port of the popular [recipe-scrapers](https://github.com/hhursev/recipe-scrapers) Python library.

## 🎉 Major Milestone: Core Architecture Complete!

The **entire core infrastructure** is now implemented and functional! All utilities, parsers, the abstract scraper, plugin system, factory pattern, and settings are complete and building successfully.

## Overview

This TypeScript port aims to provide the same comprehensive recipe scraping functionality as the Python version, supporting 518+ recipe websites with a consistent API.

**Development Approach:** Following the Hybrid Approach - developing here in the Python repository for easy reference and shared test data, then extracting to a separate repository once complete.

## Current Status

**✅ Completed (Core Architecture - 100%)**
- [x] Project setup and tooling (TypeScript, Bun, Vitest, Biome)
- [x] Type definitions (Recipe, IngredientGroup, Nutrients)
- [x] **All 10 exception classes** (including plugin-specific exceptions)
- [x] Test data helpers (access to shared Python test data)
- [x] Build configuration (CJS + ESM output)
- [x] **All utility functions** (duration, yields, normalization, fractions, URL, helpers)
- [x] **Schema.org JSON-LD parser** (642 lines, handles @graph, entity resolution)
- [x] **OpenGraph parser** (73 lines, fallback metadata)
- [x] **AbstractScraper base class** (310 lines, 20+ methods, toJson())
- [x] **Complete plugin system** (8 plugins, ~846 lines)
- [x] **Settings system** (configurable behavior)
- [x] **Factory pattern** (scraper registry, wild mode support)

**🚧 In Progress / Next**
- [ ] Comprehensive tests for new components (parsers, plugins, factory) - **NEXT UP**
- [ ] First 10 site-specific scrapers - **NEXT UP**
- [ ] Parity validation (scripts exist but not functional)

**❌ Not Started**
- [ ] Remaining site-specific scrapers (508/518)
- [ ] Complete documentation
- [ ] Microdata/RDFa support (deferred, JSON-LD covers 90%+)

**📊 Detailed Status:** See [STATUS.md](STATUS.md) for comprehensive progress tracking

## Quick Start (For Development)

```bash
cd typescript

# Install dependencies
bun install

# Run tests
bun test

# Build
bun run build

# Validate parity with Python version
bun run validate-parity
```

## Development Setup

### Prerequisites

- **Bun** >= 1.0.0 (https://bun.sh)
- Python 3.9+ (for parity validation)

### Installation

```bash
# From the typescript directory
bun install

# Install Python version for comparison
cd ..
pip install -e .
```

### Available Scripts

- `bun run build` - Build TypeScript to JavaScript
- `bun run dev` - Build in watch mode
- `bun test` - Run tests (utility tests fully passing)
- `bun run test:watch` - Run tests in watch mode
- `bun run test:coverage` - Run tests with coverage
- `bun run test:ui` - Run tests with UI
- `bun run lint` - Lint code with Biome
- `bun run lint:fix` - Lint and fix with Biome
- `bun run format` - Format code with Biome
- `bun run type-check` - Type check without emitting
- `bun run validate` - Run all checks (type, lint, test)
- `bun run validate-parity` - ⚠️ Compare with Python (not functional yet)
- `bun run compare` - ⚠️ Compare specific site (not functional yet)

## Architecture

The TypeScript port mirrors the Python structure (✅ = complete, ⚠️ = needs tests, ❌ = not started):

```
typescript/
├── src/
│   ├── exceptions.ts           # ✅ All 10 exception classes
│   ├── types/
│   │   └── recipe.ts           # ✅ Complete type definitions
│   ├── index.ts                # ✅ Main entry with exports
│   ├── factory.ts              # ✅ Factory pattern, scraper registry
│   ├── settings/
│   │   └── index.ts            # ✅ Settings system
│   ├── scrapers/
│   │   ├── abstract.ts         # ✅ Base scraper class (310 lines)
│   │   └── sites/              # ❌ Site-specific scrapers (0/518)
│   ├── parsers/
│   │   ├── schema-org.ts       # ✅ Schema.org JSON-LD parser (642 lines)
│   │   └── opengraph.ts        # ✅ OpenGraph parser (73 lines)
│   ├── plugins/                # ✅ Complete plugin system (8 plugins)
│   │   ├── interface.ts        # ✅ Base plugin interface
│   │   ├── exception-handling.ts
│   │   ├── best-image.ts
│   │   ├── static-value-exception-handling.ts
│   │   ├── html-tag-stripper.ts
│   │   ├── normalize-string.ts
│   │   ├── opengraph-image-fetch.ts
│   │   ├── opengraph-fill.ts
│   │   └── schemaorg-fill.ts
│   └── utils/                  # ✅ All utility functions
│       ├── fractions.ts        # ✅ Unicode fraction parsing
│       ├── time.ts             # ✅ Duration/time parsing
│       ├── strings.ts          # ✅ Normalization utilities
│       ├── yields.ts           # ✅ Recipe yield parsing
│       ├── url.ts              # ✅ URL utilities
│       └── helpers.ts          # ✅ Helper utilities
├── tests/
│   ├── helpers/
│   │   └── test-data.ts        # ✅ Test data loading
│   └── unit/
│       ├── test-data.test.ts   # ✅ Helper tests
│       └── utils/              # ✅ All utility tests (150 passing)
└── scripts/
    ├── compare-outputs.ts      # ⚠️ Scaffolded, not functional
    └── validate-parity.ts      # ⚠️ Scaffolded, not functional
```

## Testing

Tests use the same test data as the Python version (located in `../tests/test_data/`), ensuring true 1:1 parity.

```bash
# Run all tests
bun test

# Run specific test file
bun test scrapers/allrecipes.test.ts

# Run with coverage
bun run test:coverage

# Run with UI
bun run test:ui
```

## Parity Validation (Not Yet Functional)

Once the core implementation is complete, we will maintain 100% parity through automated validation:

```bash
# Validate all scrapers against Python version (COMING SOON)
bun run validate-parity

# Compare specific domain (COMING SOON)
bun run compare -- allrecipes.com
```

The scripts are scaffolded but not yet functional, as there's no scraper implementation to validate.

## Contributing to TypeScript Port

We welcome contributions! Current priorities:

### High Priority (Next Steps)

1. **Tests for Core Components** - Write tests for parsers, AbstractScraper, and plugins
2. **Site-Specific Scrapers** - Port the 518 site scrapers from Python
3. **Parity Validation** - Make the validation scripts functional
4. **Documentation** - Improve examples and API documentation

### How to Contribute

1. Read [STATUS.md](STATUS.md) for detailed implementation status
2. Reference Python implementation: `cat ../recipe_scrapers/[file].py`
3. Check shared test data: `../tests/test_data/`
4. Write tests alongside implementation
5. Follow TypeScript strict mode (no `any` types)

### Example: Creating a Site Scraper

Now that AbstractScraper exists, site scrapers are simple:

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
- **Formatting:** Biome
- **Linting:** Biome
- **Tests:** Vitest (Jest-compatible API)
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
