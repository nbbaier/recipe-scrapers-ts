# recipe-scrapers (TypeScript) 🚀

- **Status:** Core Architecture Complete + First 10 Scrapers Implemented! (Phase 4)
- **Progress:** ~28% complete (3,338 / 11,850 LOC)
- **Target:** 100% API parity with Python version

TypeScript port of the popular [recipe-scrapers](https://github.com/hhursev/recipe-scrapers) Python library.

## 🎉 Major Milestones Achieved!

### ✅ Core Architecture (100% Complete)
The **entire core infrastructure** is implemented, thoroughly tested, and functional! All utilities, parsers, the abstract scraper, plugin system, factory pattern, and settings are complete with **268 tests passing (0 failures)**.

### ✅ First 10 Site Scrapers (DONE!)
Successfully implemented and tested the first batch of priority scrapers:
- allrecipes.com
- bbcgoodfood.com
- bonappetit.com
- delish.com
- epicurious.com
- foodnetwork.com (+ .co.uk)
- seriouseats.com
- simplyrecipes.com
- tasty.co
- thepioneerwoman.com

### ✅ Comparison Script (Functional!)
Automated Python vs TypeScript output comparison is now working and validates parity.

## Overview

This TypeScript port provides the same comprehensive recipe scraping functionality as the Python version, aiming to support all 518+ recipe websites with a consistent API.

**Development Approach:** Following the Hybrid Approach - developing here in the Python repository for easy reference and shared test data, then extracting to a separate repository once complete.

## Current Status

**✅ Completed**
- [x] Project setup and tooling (TypeScript, Bun, Vitest, Biome)
- [x] Type definitions (Recipe, IngredientGroup, Nutrients)
- [x] **All 10 exception classes** (including plugin-specific exceptions, **correct inheritance hierarchy**)
- [x] Test data helpers (access to shared Python test data)
- [x] Build configuration (CJS + ESM output)
- [x] **All utility functions** (duration, yields, normalization, fractions, URL, helpers, **grouping**)
- [x] **Schema.org JSON-LD parser** (642 lines, handles @graph, entity resolution, **array unwrapping**)
- [x] **OpenGraph parser** (73 lines, fallback metadata)
- [x] **AbstractScraper base class** (428 lines, 20+ methods, toJson())
- [x] **Complete plugin system** (8 plugins, ~846 lines, **camelCase method names fixed**)
- [x] **Settings system** (configurable behavior)
- [x] **Factory pattern** (scraper registry, wild mode support)
- [x] **Comprehensive test suite** (268 tests passing, 12 test files)
  - [x] 150 utility tests (94.71% coverage)
  - [x] 100+ SchemaOrg parser tests
  - [x] 15+ OpenGraph parser tests
  - [x] 25+ Factory pattern tests
  - [x] 22+ Settings system tests
  - [x] 11 AbstractScraper tests
- [x] **First 10 site-specific scrapers** (10/518 = 2%)
- [x] **Functional comparison script** (validates TypeScript vs Python outputs)
- [x] **Critical bug fixes** (HTMLTagStripper duplication, plugin fallback chain, method name mapping)

**🚧 In Progress**
- [ ] Implement next batch of scrapers

**❌ Not Started**
- [ ] Remaining site-specific scrapers (508/518)
- [ ] Plugin-specific unit tests (plugins work, tested indirectly)
- [ ] Complete documentation and examples
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

# Compare TypeScript vs Python for a specific site
bun run compare -- allrecipes.com

# Validate parity across all scrapers (when more are implemented)
bun run validate-parity
```

## Development Setup

### Prerequisites

- **Bun** >= 1.0.0 (https://bun.sh)
- Python 3.9+ (for parity validation)
- Python recipe-scrapers installed (`pip install -e ../` from repo root)

### Installation

```bash
# From the typescript directory
bun install

# Install Python version for comparison (choose one method)
cd ..

# Option 1: Using pip (traditional)
pip install -e .

# Option 2: Using uv (modern, faster)
uv pip install -e .

# Option 3: Custom Python installation
# Set PYTHON_COMMAND environment variable (see below)
```

### Python Installation Options

The comparison and validation scripts support multiple Python installations:

1. **uv** (recommended for modern workflows) - Automatically detected if available
2. **python3** - Standard on macOS/Linux
3. **python** - Standard on Windows
4. **Custom Python** - Set via `PYTHON_COMMAND` environment variable

**Detection Order:**
1. `PYTHON_COMMAND` environment variable (if set)
2. `uv run python` (if uv is installed)
3. `python3`
4. `python`

**Examples:**

```bash
# Use default auto-detection
bun run compare -- allrecipes.com

# Specify custom Python command
PYTHON_COMMAND="python3.11" bun run compare -- allrecipes.com

# Use uv explicitly (if not auto-detected)
PYTHON_COMMAND="uv run python" bun run validate-parity

# Use pyenv Python
PYTHON_COMMAND="pyenv exec python" bun run compare -- allrecipes.com
```

### Available Scripts

- `bun run build` - Build TypeScript to JavaScript
- `bun run dev` - Build in watch mode
- `bun test` - Run tests (268 passing)
- `bun run test:watch` - Run tests in watch mode
- `bun run test:coverage` - Run tests with coverage
- `bun run test:ui` - Run tests with UI
- `bun run lint` - Lint code with Biome
- `bun run lint:fix` - Lint and fix with Biome
- `bun run format` - Format code with Biome
- `bun run type-check` - Type check without emitting
- `bun run validate` - Run all checks (type, lint, test)
- `bun run validate-parity` - ⚠️ Compare all scrapers with Python (partial)
- `bun run compare -- <domain>` - ✅ Compare specific site output with Python

## Architecture

The TypeScript port mirrors the Python structure:

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
│   │   ├── abstract.ts         # ✅ Base scraper class (428 lines)
│   │   └── sites/              # 🚧 Site-specific scrapers (10/518)
│   │       ├── allrecipes.ts
│   │       ├── bbcgoodfood.ts
│   │       ├── bonappetit.ts
│   │       ├── delish.ts
│   │       ├── epicurious.ts
│   │       ├── foodnetwork.ts
│   │       ├── seriouseats.ts
│   │       ├── simplyrecipes.ts
│   │       ├── tasty.ts
│   │       └── thepioneerwoman.ts
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
│       ├── helpers.ts          # ✅ Helper utilities
│       └── grouping.ts         # ✅ Ingredient grouping utilities
├── tests/
│   ├── helpers/
│   │   └── test-data.ts        # ✅ Test data loading
│   └── unit/
│       ├── test-data.test.ts   # ✅ Helper tests
│       ├── factory.test.ts     # ✅ Factory tests
│       ├── settings/           # ✅ Settings tests
│       ├── parsers/            # ✅ Parser tests (Schema.org, OpenGraph)
│       └── utils/              # ✅ All utility tests (150 passing)
└── scripts/
    ├── compare-outputs.ts      # ✅ Functional - compares specific sites
    └── validate-parity.ts      # ⚠️ Partially functional
```

## Testing

Tests use the same test data as the Python version (located in `../tests/test_data/`), ensuring true 1:1 parity.

```bash
# Run all tests
bun test

# Run specific test file
bun test utils/time.test.ts

# Run with coverage
bun run test:coverage

# Run with UI
bun run test:ui
```

**Current Test Results:**
- ✅ 268 tests passing
- ✅ 0 failures
- ✅ 94.71% coverage on utilities

## Parity Validation

Automated validation against the Python version is now functional!

```bash
# Compare specific domain
bun run compare -- allrecipes.com
bun run compare -- bbcgoodfood.com

# Validate all implemented scrapers (coming soon)
bun run validate-parity
```

**Current Parity Status:**

🎉 **Near-perfect parity achieved!** All critical fields match between Python and TypeScript:
- ✅ author, title, description, category, cuisine, keywords
- ✅ canonical_url, host, image, language, site_name
- ✅ yields, ratings, ratings_count
- ✅ cook_time, prep_time, total_time
- ✅ ingredients, instructions, instructions_list (no duplication!)
- ✅ nutrients (same values, minor key ordering difference)
- ⚠️ ingredient_groups.purpose (Python includes `null`, TypeScript omits undefined - cosmetic)

## Fixed Issues ✅

### 1. Ingredient/Instruction Duplication (FIXED)
**Status:** ✅ Resolved

**Root Cause:** HTMLTagStripperPlugin used `$('*').text()` which selected ALL elements (html, body, etc.), causing text to appear multiple times when concatenated.

**Fix:** Changed to `$.root().text()` to get root text content only.

**Impact:** All ingredients and instructions now display correctly without duplication.

### 2. Missing Time Fields (FIXED)
**Status:** ✅ Resolved

**Root Cause:** Two bugs:
1. Plugin method names were snake_case (`cook_time`) but actual methods are camelCase (`cookTime`)
2. Exception hierarchy: `SchemaOrgException` extended `RecipeScrapersException` instead of `FillPluginException`, breaking the plugin fallback chain

**Fix:**
1. Updated all plugin `runOnMethods` to use camelCase names
2. Fixed exception hierarchy to match Python: `SchemaOrgException extends FillPluginException`

**Impact:** All time fields (cook_time, prep_time, total_time) now extract correctly. Plugin fallback chain (Schema.org → OpenGraph) works properly.

### 3. Missing site_name Field (FIXED)
**Status:** ✅ Resolved

**Root Cause:** Same exception hierarchy issue prevented OpenGraphFillPlugin from catching SchemaOrgException and providing fallback.

**Fix:** Exception hierarchy correction enabled proper plugin chaining.

**Impact:** site_name now falls back to OpenGraph metadata when Schema.org WebSite entity is not present.

## Contributing to TypeScript Port

We welcome contributions! Current priorities:

### High Priority

1. **More Site Scrapers** - Port additional scrapers from Python (508 remaining)
2. **Plugin Tests** - Write dedicated tests for each plugin
3. **Documentation** - Improve examples and API documentation
4. **Minor Cosmetic Fixes** - Optional: align JSON output format (purpose field, nutrient ordering)

### How to Contribute

1. Read [STATUS.md](STATUS.md) for detailed implementation status
2. Reference Python implementation: `cat ../recipe_scrapers/[file].py`
3. Check shared test data: `../tests/test_data/`
4. Write tests alongside implementation
5. Follow TypeScript strict mode (no `any` types)
6. Use comparison script to validate parity

### Example: Creating a Site Scraper

Most scrapers are minimal because they inherit from Schema.org via plugins:

```typescript
import { AbstractScraper } from '../abstract';

// Minimal scraper (relies entirely on Schema.org)
export class AllRecipesScraper extends AbstractScraper {
  host(): string {
    return 'allrecipes.com';
  }
  // All other methods inherited via SchemaOrgFillPlugin
}

// Scraper with custom fields
export class FoodNetworkScraper extends AbstractScraper {
  host(): string {
    return 'foodnetwork.com';
  }

  // Override specific methods when needed
  author(): string | undefined {
    return this.schema.data.copyrightNotice || this.schema.author();
  }
}

// Scraper with ingredient grouping
export class BBCGoodFoodScraper extends AbstractScraper {
  host(): string {
    return 'bbcgoodfood.com';
  }

  ingredientGroups(): IngredientGroup[] {
    return groupIngredients(
      this.ingredients(),
      this.$,
      '.recipe__ingredients h3',
      '.recipe__ingredients li'
    );
  }
}
```

### Code Style

- **TypeScript:** Strict mode enabled
- **Formatting:** Biome
- **Linting:** Biome
- **Tests:** Vitest (Jest-compatible API)
- **Coverage:** Target 90%+

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

### ✅ Phase 0-3: Foundation & Core (Complete!)
- [x] Project setup and tooling
- [x] Type definitions and exceptions
- [x] Test data helpers
- [x] All utility functions
- [x] Schema.org and OpenGraph parsers
- [x] AbstractScraper base class
- [x] Complete plugin system (8 plugins)
- [x] Factory pattern and settings
- [x] Comprehensive test suite (268 tests)

### 🚧 Phase 4: Scraper Implementation (In Progress - 2%)
- [x] First 10 priority scrapers
- [x] Functional comparison script
- [ ] Fix ingredient duplication bug
- [ ] Fix missing time fields bug
- [ ] Implement next 40 scrapers
- [ ] Remaining 468 scrapers

### Phase 5: Validation & Documentation (Not Started)
- [ ] 100% parity validation
- [ ] Complete documentation
- [ ] Performance testing
- [ ] Plugin unit tests

### Phase 6: Extraction (Not Started)
- [ ] Extract to separate repository
- [ ] Set up automated test data sync
- [ ] Publish to npm

**Progress:** ~28% complete (3,338 / 11,850 LOC)
**Estimated Timeline:** 14-16 weeks total (currently in week 6)

## Recent Updates

### 2025-11-16 (Evening Update)
- ✅ **FIXED: Ingredient/instruction duplication** (HTMLTagStripperPlugin bug)
- ✅ **FIXED: Missing cook_time/prep_time** (plugin method name mapping)
- ✅ **FIXED: Missing site_name** (exception hierarchy correction)
- ✅ **FIXED: Plugin fallback chain** (SchemaOrgException now extends FillPluginException)
- 🎉 **Near-perfect parity achieved** with Python version!

### 2025-11-16 (Morning)
- ✅ Implemented first 10 priority scrapers
- ✅ Fixed critical Schema.org JSON-LD array parsing bug
- ✅ Fixed plugin system NotImplementedError handling
- ✅ Implemented ingredient grouping utilities
- ✅ Made comparison script functional

### 2025-11-15
- ✅ Completed all 8 plugins (~846 lines)
- ✅ Completed factory pattern and settings system
- ✅ Added 100+ tests for parsers and factory
- ✅ Achieved 268 tests passing (0 failures)

## Documentation

- **[STATUS.md](STATUS.md)** ⭐ **START HERE** - Detailed current status and progress
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development guide and workflow
- [TYPESCRIPT_PORT_PLAN.md](TYPESCRIPT_PORT_PLAN.md) - Overall strategy and requirements
- [docs/archive/](docs/archive/) - Archived planning documents (for reference)
- [Python Documentation](https://docs.recipe-scrapers.com) - Reference for API parity

## Questions?

- **Python version issues:** [Python repo issues](https://github.com/hhursev/recipe-scrapers/issues)
- **TypeScript port questions:** File an issue mentioning "TypeScript port"

## License

MIT (same as Python version)

---

**Note:** This is a work in progress (~28% complete). The API is stabilizing but may change as we work towards full parity with the Python version.
