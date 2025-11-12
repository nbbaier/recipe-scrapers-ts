# TypeScript Port Development Guide

This guide provides detailed instructions for contributing to the TypeScript port of recipe-scrapers.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **pnpm**
- **Python** 3.9+ (for reference and parity validation)
- **Git**

## Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/hhursev/recipe-scrapers.git
cd recipe-scrapers

# Install TypeScript dependencies
cd typescript
npm install

# Install Python version (for reference)
cd ..
pip install -e .
```

### 2. Verify Setup

```bash
cd typescript

# Type check
npm run type-check

# Run tests
npm test

# Build
npm run build
```

All three commands should complete successfully.

## Development Workflow

### 1. Understanding the Python Implementation

Before implementing any TypeScript feature, **always** check the Python version first:

```bash
# From typescript/ directory
cat ../recipe_scrapers/_abstract.py     # Abstract scraper
cat ../recipe_scrapers/_schemaorg.py    # Schema.org parser
cat ../recipe_scrapers/_utils.py        # Utilities
cat ../recipe_scrapers/_opengraph.py    # OpenGraph parser
ls ../recipe_scrapers/plugins/          # Plugins
```

### 2. Check Test Data

The Python version has comprehensive test data we can use:

```bash
# List available test domains
ls ../tests/test_data/

# Check a specific domain's test files
ls ../tests/test_data/allrecipes.com/

# View a test HTML file
cat ../tests/test_data/allrecipes.com/some-recipe.testhtml

# View expected JSON output
cat ../tests/test_data/allrecipes.com/some-recipe.json
```

### 3. Implement with Tests

Follow test-driven development:

1. **Write tests first** based on Python behavior
2. **Implement** the functionality
3. **Verify** against Python version if possible

Example test structure:

```typescript
// tests/unit/utils/duration.test.ts
import { parseDuration } from '../../../src/utils/duration';

describe('parseDuration', () => {
  it('should parse ISO 8601 duration to minutes', () => {
    expect(parseDuration('PT1H30M')).toBe(90);
    expect(parseDuration('PT30M')).toBe(30);
    expect(parseDuration('PT2H')).toBe(120);
  });

  it('should handle invalid input', () => {
    expect(parseDuration('')).toBeUndefined();
    expect(parseDuration('invalid')).toBeUndefined();
  });
});
```

### 4. Code Style

We use strict TypeScript with automated formatting:

```bash
# Check types
npm run type-check

# Lint
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Run all checks
npm run validate
```

**Rules:**
- ✅ Strict mode enabled (no `any` types)
- ✅ All parameters and returns must be typed
- ✅ Use `undefined` not `null` (except for parity with Python)
- ✅ Prefer immutability (`const`, readonly)
- ✅ Use ES2020+ features
- ❌ No `any` types
- ❌ No `@ts-ignore` comments (without good reason)

### 5. Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test utils/duration.test.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

**Target coverage:** 90%+ for all new code

## Implementation Priorities

### Phase 1: Core Utilities (CURRENT)

**Location:** `src/utils/`

**Priority order:**

1. **Duration parsing** (`src/utils/duration.ts`)
   - Parse ISO 8601 duration strings (PT1H30M)
   - Convert to minutes
   - Reference: `../recipe_scrapers/_utils.py` (normalize_string, get_minutes)
   - Library: `luxon` (already installed)

2. **String normalization** (`src/utils/normalize.ts`)
   - Normalize whitespace
   - Remove HTML tags
   - Clean recipe text
   - Reference: `../recipe_scrapers/_utils.py`

3. **Yield parsing** (`src/utils/yields.ts`)
   - Extract yield numbers (e.g., "4-6 servings" → "4-6")
   - Reference: `../recipe_scrapers/_utils.py` (get_yields)

4. **Other utilities** (`src/utils/index.ts`)
   - CSV to tags conversion
   - Diet name formatting
   - URL manipulation

### Phase 2: Schema.org Parser (NEXT)

**Location:** `src/scrapers/schema-org.ts`

**Approach:** Start with JSON-LD only (covers 90%+ of sites)

**Key tasks:**
1. Extract `<script type="application/ld+json">` tags
2. Parse JSON-LD with `jsonld` library
3. Find Recipe entities
4. Handle `@graph` structures
5. Extract all recipe fields
6. Handle Person, AggregateRating entities
7. Resolve `@id` references

**Reference:** `../recipe_scrapers/_schemaorg.py`

### Phase 3: OpenGraph Parser

**Location:** `src/scrapers/opengraph.ts`

**Tasks:**
1. Extract og:title, og:image, og:description, etc.
2. Provide fallback for when Schema.org fails

**Reference:** `../recipe_scrapers/_opengraph.py`

### Phase 4: Abstract Scraper

**Location:** `src/scrapers/abstract.ts`

**Tasks:**
1. Define base class with 20+ methods
2. Integrate Schema.org and OpenGraph parsers
3. Implement to_json() method
4. Plugin attachment system

**Reference:** `../recipe_scrapers/_abstract.py`

### Phase 5: Plugin System

**Location:** `src/plugins/`

**Plugins to implement:**
1. ExceptionHandlingPlugin
2. SchemaOrgFillPlugin
3. OpenGraphFillPlugin
4. HTMLTagStripperPlugin
5. NormalizeStringPlugin
6. OpenGraphImageFetchPlugin
7. StaticValueExceptionHandlingPlugin

**Reference:** `../recipe_scrapers/plugins/`

## Using Shared Test Data

We have helpers to access Python test data:

```typescript
import {
  loadTestHtml,
  loadExpectedJson,
  getTestDomains,
  getTestCases,
} from '../tests/helpers/test-data';

// Load HTML for a test
const html = loadTestHtml('allrecipes.com', 'chocolate-chip-cookies.testhtml');

// Load expected output
const expected = loadExpectedJson('allrecipes.com', 'chocolate-chip-cookies.json');

// Get all test domains
const domains = getTestDomains(); // ['allrecipes.com', 'bbcgoodfood.com', ...]

// Get test cases for a domain
const testCases = getTestCases('allrecipes.com');
// Returns: [{ html: 'recipe1.testhtml', json: 'recipe1.json' }, ...]
```

## Parity Validation (Future)

Once we have scrapers implemented, we can validate parity:

```bash
# Compare all scrapers with Python
npm run validate-parity

# Compare specific domain
npm run compare -- allrecipes.com
```

These scripts will:
1. Run Python scraper on test HTML
2. Run TypeScript scraper on same HTML
3. Compare JSON outputs
4. Report any differences

## Debugging Tips

### 1. Compare with Python Output

```bash
# Run Python scraper
cd ..
python -c "
from recipe_scrapers import scrape_html
html = open('tests/test_data/allrecipes.com/recipe.testhtml').read()
scraper = scrape_html(html, 'https://www.allrecipes.com/')
import json
print(json.dumps(scraper.to_json(), indent=2))
"
```

### 2. Inspect Test Data

```bash
# View test HTML
cat ../tests/test_data/allrecipes.com/recipe.testhtml | less

# Search for Schema.org data
grep -A 50 'application/ld+json' ../tests/test_data/allrecipes.com/recipe.testhtml

# View expected output
cat ../tests/test_data/allrecipes.com/recipe.json | jq .
```

### 3. TypeScript Debugging

```typescript
// Enable source maps
// tsconfig.json already has "sourceMap": true

// Use debugger in VSCode
// Add breakpoint in code
// Run: "Debug: Debug npm Script" and select "test"
```

## Common Patterns

### 1. Handling Optional Values

```typescript
// Python: returns None
// TypeScript: return undefined

function getAuthor(): string | undefined {
  // ...
  return author ?? undefined;
}
```

### 2. String Normalization

```typescript
function normalize(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n');
}
```

### 3. Parsing with Cheerio

```typescript
import * as cheerio from 'cheerio';

const $ = cheerio.load(html);
const title = $('h1.recipe-title').text().trim();
const ingredients = $('li.ingredient')
  .map((_, el) => $(el).text().trim())
  .get();
```

### 4. Type Guards

```typescript
function isRecipe(obj: any): obj is Recipe {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.title === 'string' &&
    Array.isArray(obj.ingredients)
  );
}
```

## FAQs

### Q: Do we need to implement Microdata and RDFa parsing immediately?

**A:** No. Start with JSON-LD only. It covers 90%+ of sites and is much simpler to parse. We can add Microdata/RDFa later.

### Q: Should the API be async or sync?

**A:** For now, **synchronous** to match Python. We're parsing HTML that's already loaded, not fetching from URLs. We can add async APIs later if needed.

### Q: What about the 518 site scrapers?

**A:** Don't start on those yet. We need the core architecture first (AbstractScraper, plugins, parsers). Most site scrapers are trivial once the infrastructure exists.

### Q: How closely should we match the Python API?

**A:** As closely as possible. Same method names, same return types (accounting for language differences), same behavior. Goal is 100% parity.

### Q: Can I use external libraries?

**A:** Yes, but prefer:
- Standard library features
- Well-maintained, popular libraries
- Libraries already in package.json

Check with maintainers before adding new dependencies.

## Getting Help

- **Status:** Check [STATUS.md](STATUS.md) for current progress
- **Python reference:** Look at `../recipe_scrapers/` directory
- **Test data:** Browse `../tests/test_data/`
- **Issues:** File issues in the main repository mentioning "TypeScript port"

## Quick Reference: npm Scripts

```bash
npm run build          # Build TypeScript → JavaScript
npm run dev            # Build in watch mode
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run lint           # Check code style
npm run lint:fix       # Auto-fix code style issues
npm run format         # Format code with Prettier
npm run type-check     # TypeScript type checking
npm run validate       # Run all checks (type, lint, test)
npm run clean          # Remove build artifacts
```

## Next Steps

1. Read [STATUS.md](STATUS.md) for current implementation status
2. Pick a task from the "Next Up" section
3. Reference the Python implementation
4. Write tests first
5. Implement the feature
6. Validate against Python (when possible)
7. Submit PR

Happy coding! 🚀
