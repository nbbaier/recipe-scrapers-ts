# Approach 1: Work in Python Repository

## Overview

Develop the TypeScript port directly within the existing Python repository under a `typescript/` directory. The TypeScript code lives alongside Python code permanently, creating a polyglot repository.

**Best For:** Teams comfortable with multi-language repositories, when you want permanent side-by-side comparison, or when targeting different ecosystems from one codebase.

---

## Directory Structure

```
recipe-scrapers/
├── recipe_scrapers/           # Python source code
│   ├── __init__.py
│   ├── _abstract.py
│   ├── _schemaorg.py
│   └── ...
├── typescript/                # TypeScript source code (NEW)
│   ├── src/
│   │   ├── index.ts
│   │   ├── scrapers/
│   │   │   ├── abstract.ts
│   │   │   ├── schema-org.ts
│   │   │   ├── opengraph.ts
│   │   │   └── sites/
│   │   │       ├── allrecipes.ts
│   │   │       ├── bbcgoodfood.ts
│   │   │       └── ...
│   │   ├── plugins/
│   │   │   ├── exception-handling.ts
│   │   │   ├── schemaorg-fill.ts
│   │   │   └── ...
│   │   ├── utils/
│   │   │   ├── duration.ts
│   │   │   ├── yields.ts
│   │   │   └── normalize.ts
│   │   └── exceptions.ts
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── utils.test.ts
│   │   │   └── schema-org.test.ts
│   │   └── scrapers/
│   │       ├── allrecipes.test.ts
│   │       └── ...
│   ├── dist/                  # Build output
│   ├── docs/                  # TypeScript-specific docs
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── jest.config.js
│   ├── .eslintrc.js
│   ├── .prettierrc
│   └── README.md
├── tests/                     # Shared test data
│   └── test_data/
│       ├── allrecipes.com/
│       ├── bbcgoodfood.com/
│       └── ...
├── .github/
│   └── workflows/
│       ├── python-tests.yml
│       ├── typescript-tests.yml (NEW)
│       └── npm-publish.yml (NEW)
├── .gitignore                 # Add typescript/node_modules, typescript/dist
├── pyproject.toml             # Python config
├── README.md                  # Update to mention TypeScript
└── LICENSE
```

---

## Detailed Implementation Steps

### Phase 0: Preparation (Week 0)

#### Step 0.1: Update Repository Documentation

**Actions:**
1. Update `README.md` to mention TypeScript port
2. Add section explaining the dual-language approach
3. Link to TypeScript-specific README

**Commands:**
```bash
# Add to README.md
cat >> README.md << 'EOF'

## TypeScript Version

This repository also includes a TypeScript port of recipe-scrapers. See [`typescript/README.md`](typescript/README.md) for details.

**Quick Start (TypeScript):**
```bash
npm install recipe-scrapers
```

```typescript
import { scrapeHtml } from 'recipe-scrapers';

const scraper = scrapeHtml(html, url);
console.log(scraper.title());
```
EOF
```

**Success Criteria:**
- [ ] README.md updated with TypeScript section
- [ ] Clear navigation between Python and TypeScript docs

#### Step 0.2: Update .gitignore

**Actions:**
```bash
cat >> .gitignore << 'EOF'

# TypeScript
typescript/node_modules/
typescript/dist/
typescript/coverage/
typescript/.turbo/
typescript/*.tsbuildinfo
typescript/.eslintcache
EOF
```

**Success Criteria:**
- [ ] TypeScript build artifacts ignored
- [ ] No accidental commits of node_modules

---

### Phase 1: Foundation Setup (Week 1)

#### Step 1.1: Initialize TypeScript Project

**Actions:**
```bash
# Create directory structure
mkdir -p typescript/src/{scrapers/sites,plugins,utils,types}
mkdir -p typescript/tests/{unit,scrapers}
mkdir -p typescript/docs

cd typescript

# Initialize package.json
npm init -y
```

**Edit package.json:**
```json
{
  "name": "recipe-scrapers",
  "version": "0.1.0",
  "description": "TypeScript port of recipe-scrapers - Extract recipe data from cooking websites",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "module": "dist/index.mjs",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src tests --ext .ts",
    "lint:fix": "eslint src tests --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\" \"tests/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "docs": "typedoc src/index.ts",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "recipe",
    "scraper",
    "parser",
    "cooking",
    "schema.org",
    "structured-data"
  ],
  "author": "",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/hhursev/recipe-scrapers.git",
    "directory": "typescript"
  }
}
```

**Success Criteria:**
- [ ] package.json created with correct metadata
- [ ] npm scripts defined for all common tasks

#### Step 1.2: Install Dependencies

**Actions:**
```bash
# Core dependencies
npm install cheerio jsonld luxon

# Development dependencies
npm install -D typescript @types/node \
  tsup \
  jest @types/jest ts-jest \
  eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  prettier \
  typedoc \
  @types/cheerio
```

**Success Criteria:**
- [ ] All dependencies installed without errors
- [ ] package-lock.json created

#### Step 1.3: Configure TypeScript

**Create tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "typeRoots": ["./node_modules/@types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Create tsconfig.build.json:**
```json
{
  "extends": "./tsconfig.json",
  "exclude": ["tests", "**/*.test.ts", "**/*.spec.ts"]
}
```

**Success Criteria:**
- [ ] TypeScript compiles without errors
- [ ] Strict mode enabled

#### Step 1.4: Configure Testing (Jest)

**Create jest.config.js:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
};
```

**Success Criteria:**
- [ ] Jest configuration valid
- [ ] Can run `npm test` (even with no tests)

#### Step 1.5: Configure Linting and Formatting

**Create .eslintrc.js:**
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

**Create .prettierrc:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

**Success Criteria:**
- [ ] ESLint runs without errors
- [ ] Prettier formats code consistently

#### Step 1.6: Set Up Git Hooks (Husky)

**Actions:**
```bash
npm install -D husky lint-staged

# Initialize husky
npx husky init

# Create pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

cd typescript
npx lint-staged
EOF

chmod +x .husky/pre-commit
```

**Create .lintstagedrc.json:**
```json
{
  "*.ts": [
    "eslint --fix",
    "prettier --write"
  ]
}
```

**Success Criteria:**
- [ ] Git hooks run on commit
- [ ] Code auto-formatted and linted

---

### Phase 2: Core Utilities (Week 2)

#### Step 2.1: Implement Type Definitions

**Create src/types/recipe.ts:**
```typescript
export interface Recipe {
  title: string;
  author?: string;
  canonical_url: string;
  site_name: string;
  host: string;
  language?: string;
  ingredients: string[];
  ingredient_groups?: IngredientGroup[];
  instructions: string;
  instructions_list: string[];
  category?: string;
  yields?: string;
  description?: string;
  total_time?: number; // minutes
  cook_time?: number;
  prep_time?: number;
  cuisine?: string;
  cooking_method?: string;
  ratings?: number;
  ratings_count?: number;
  equipment?: string[];
  nutrients?: Record<string, string>;
  dietary_restrictions?: string[];
  image?: string;
  keywords?: string[];
}

export interface IngredientGroup {
  purpose?: string;
  ingredients: string[];
}
```

**Success Criteria:**
- [ ] All recipe fields typed
- [ ] Optional vs required fields correct

#### Step 2.2: Implement Exceptions

**Create src/exceptions.ts:**
```typescript
export class RecipeScrapersException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecipeScrapersException';
  }
}

export class SchemaOrgException extends RecipeScrapersException {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaOrgException';
  }
}

export class ElementNotFoundInHtml extends RecipeScrapersException {
  constructor(message: string) {
    super(message);
    this.name = 'ElementNotFoundInHtml';
  }
}

export class WebsiteNotImplementedError extends RecipeScrapersException {
  constructor(message: string) {
    super(message);
    this.name = 'WebsiteNotImplementedError';
  }
}

export class NoSchemaFoundInWildMode extends RecipeScrapersException {
  constructor(message: string) {
    super(message);
    this.name = 'NoSchemaFoundInWildMode';
  }
}
```

**Test (tests/unit/exceptions.test.ts):**
```typescript
import { SchemaOrgException, ElementNotFoundInHtml } from '../../src/exceptions';

describe('Exceptions', () => {
  it('should create SchemaOrgException', () => {
    const error = new SchemaOrgException('Test error');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('SchemaOrgException');
    expect(error.message).toBe('Test error');
  });
});
```

**Success Criteria:**
- [ ] All 5 exception classes implemented
- [ ] Tests pass
- [ ] Exceptions extend Error correctly

#### Step 2.3: Implement Duration Parsing

**Create src/utils/duration.ts:**
```typescript
import { Duration } from 'luxon';

export function getMinutes(duration: string): number | null {
  try {
    const parsed = Duration.fromISO(duration);
    if (!parsed.isValid) {
      return null;
    }
    return Math.round(parsed.as('minutes'));
  } catch {
    return null;
  }
}
```

**Test (tests/unit/duration.test.ts):**
```typescript
import { getMinutes } from '../../src/utils/duration';

describe('getMinutes', () => {
  it('should parse PT1H30M', () => {
    expect(getMinutes('PT1H30M')).toBe(90);
  });

  it('should parse PT45M', () => {
    expect(getMinutes('PT45M')).toBe(45);
  });

  it('should parse PT2H', () => {
    expect(getMinutes('PT2H')).toBe(120);
  });

  it('should return null for invalid duration', () => {
    expect(getMinutes('invalid')).toBeNull();
  });
});
```

**Success Criteria:**
- [ ] Parses ISO 8601 durations correctly
- [ ] Returns null for invalid input
- [ ] All tests pass

#### Step 2.4: Implement Other Utilities

**Create src/utils/normalize.ts:**
```typescript
export function normalizeString(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}
```

**Create src/utils/yields.ts:**
```typescript
export function getYields(yieldText: string): string {
  // Extract number patterns like "4", "4-6", "Serves 4"
  const match = yieldText.match(/(\d+(?:\s*-\s*\d+)?)/);
  return match ? match[1] : yieldText;
}
```

**Create src/utils/tags.ts:**
```typescript
export function csvToTags(csv: string): string[] {
  return csv
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export function formatDietName(diet: string): string {
  // Convert "http://schema.org/VegetarianDiet" to "Vegetarian"
  const match = diet.match(/\/([A-Za-z]+)Diet$/);
  return match ? match[1] : diet;
}
```

**Success Criteria:**
- [ ] All utility functions implemented
- [ ] Unit tests for each function
- [ ] 100% test coverage for utils

---

### Phase 3: Core Architecture (Weeks 3-4)

#### Step 3.1: Implement SchemaOrg Parser

**Create src/scrapers/schema-org.ts:**
```typescript
import * as jsonld from 'jsonld';
import { CheerioAPI } from 'cheerio';
import { SchemaOrgException } from '../exceptions';
import { getMinutes, normalizeString, getYields } from '../utils';

export class SchemaOrg {
  private data: Record<string, any>;
  private people: Map<string, any>;
  private ratingsData: Map<string, any>;
  private websiteName?: string;

  constructor(html: string, $: CheerioAPI) {
    this.data = {};
    this.people = new Map();
    this.ratingsData = new Map();

    // Extract JSON-LD
    const scripts = $('script[type="application/ld+json"]');
    scripts.each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '');
        this.processSchemaData(data);
      } catch (e) {
        // Ignore invalid JSON
      }
    });
  }

  private processSchemaData(data: any): void {
    // Process @graph if present
    if (data['@graph']) {
      for (const item of data['@graph']) {
        this.extractEntities(item);
      }
    } else {
      this.extractEntities(data);
    }
  }

  private extractEntities(item: any): void {
    const type = this.getType(item);

    if (this.isType(type, 'Recipe')) {
      this.data = { ...this.data, ...item };
    } else if (this.isType(type, 'WebSite')) {
      this.websiteName = item.name;
    } else if (this.isType(type, 'Person')) {
      const key = item['@id'] || item.url;
      if (key) this.people.set(key, item);
    } else if (this.isType(type, 'AggregateRating')) {
      const key = item['@id'];
      if (key) this.ratingsData.set(key, item);
    }
  }

  private getType(item: any): string | string[] {
    return item['@type'] || '';
  }

  private isType(type: string | string[], targetType: string): boolean {
    const types = Array.isArray(type) ? type : [type];
    return types.some((t) => t.toLowerCase().includes(targetType.toLowerCase()));
  }

  title(): string {
    return normalizeString(this.data.name || '');
  }

  author(): string | undefined {
    let author = this.data.author || this.data.Author;

    if (Array.isArray(author) && author.length > 0) {
      author = author[0];
    }

    if (typeof author === 'object') {
      const key = author['@id'] || author.url;
      if (key && this.people.has(key)) {
        author = this.people.get(key);
      }
      author = author.name;
    }

    return author ? author.trim() : undefined;
  }

  totalTime(): number | undefined {
    const totalTime = this.readDurationField('totalTime');
    if (totalTime) return totalTime;

    const prepTime = this.readDurationField('prepTime') || 0;
    const cookTime = this.readDurationField('cookTime') || 0;

    if (prepTime || cookTime) {
      return prepTime + cookTime;
    }

    return undefined;
  }

  private readDurationField(key: string): number | null {
    const value = this.data[key];
    if (!value) return null;

    if (typeof value === 'string') {
      return getMinutes(value);
    }

    if (typeof value === 'object' && value.maxValue) {
      return getMinutes(value.maxValue);
    }

    return null;
  }

  ingredients(): string[] {
    const ingredients = this.data.recipeIngredient || this.data.ingredients || [];

    // Flatten if nested arrays
    const flattened = Array.isArray(ingredients[0])
      ? ingredients.flat()
      : ingredients;

    return flattened.map((ing: string) => normalizeString(ing));
  }

  // ... implement remaining methods
}
```

**Success Criteria:**
- [ ] Parses JSON-LD from HTML
- [ ] Extracts all recipe fields
- [ ] Handles nested structures (@graph)
- [ ] Resolves references (Person by @id)
- [ ] Unit tests pass

#### Step 3.2: Implement OpenGraph Parser

**Create src/scrapers/opengraph.ts:**
```typescript
import { CheerioAPI } from 'cheerio';

export class OpenGraph {
  private $: CheerioAPI;

  constructor($: CheerioAPI) {
    this.$ = $;
  }

  private getMeta(property: string): string | undefined {
    const content = this.$(`meta[property="${property}"]`).attr('content');
    return content || undefined;
  }

  title(): string | undefined {
    return this.getMeta('og:title');
  }

  image(): string | undefined {
    return this.getMeta('og:image');
  }

  description(): string | undefined {
    return this.getMeta('og:description');
  }

  siteName(): string | undefined {
    return this.getMeta('og:site_name');
  }
}
```

**Success Criteria:**
- [ ] Extracts og:* meta tags
- [ ] Returns undefined for missing tags
- [ ] Unit tests pass

#### Step 3.3: Implement Plugin System

**Create src/plugins/base.ts:**
```typescript
export interface Plugin {
  shouldRun(host: string, methodName: string): boolean;
  run<T>(method: () => T): () => T;
}
```

**Create src/plugins/schemaorg-fill.ts:**
```typescript
import { Plugin } from './base';
import { AbstractScraper } from '../scrapers/abstract';

export class SchemaOrgFillPlugin implements Plugin {
  private methodsToFill = [
    'title',
    'author',
    'ingredients',
    'instructions',
    'totalTime',
    'yields',
    'image',
  ];

  shouldRun(host: string, methodName: string): boolean {
    return this.methodsToFill.includes(methodName);
  }

  run<T>(method: () => T): () => T {
    const self = this as any;
    return function(this: AbstractScraper): T {
      try {
        return method.call(this);
      } catch {
        // Try schema.org
        const schemaMethod = (this.schema as any)[methodName];
        if (schemaMethod) {
          return schemaMethod.call(this.schema);
        }
        throw new Error(`Method ${methodName} not found in schema`);
      }
    };
  }
}
```

**Success Criteria:**
- [ ] Plugin interface defined
- [ ] SchemaOrgFillPlugin works
- [ ] Can chain multiple plugins
- [ ] Unit tests pass

#### Step 3.4: Implement AbstractScraper

**Create src/scrapers/abstract.ts:**
```typescript
import * as cheerio from 'cheerio';
import { CheerioAPI } from 'cheerio';
import { SchemaOrg } from './schema-org';
import { OpenGraph } from './opengraph';
import { Recipe } from '../types/recipe';

export abstract class AbstractScraper {
  protected html: string;
  protected url: string;
  protected $: CheerioAPI;
  protected schema: SchemaOrg;
  protected opengraph: OpenGraph;

  constructor(html: string, url: string) {
    this.html = html;
    this.url = url;
    this.$ = cheerio.load(html);
    this.schema = new SchemaOrg(html, this.$);
    this.opengraph = new OpenGraph(this.$);
  }

  abstract host(): string;

  title(): string {
    throw new Error('Not implemented');
  }

  author(): string | undefined {
    throw new Error('Not implemented');
  }

  canonicalUrl(): string {
    const canonical = this.$('link[rel="canonical"]').attr('href');
    return canonical || this.url;
  }

  siteName(): string {
    throw new Error('Not implemented');
  }

  // ... all other methods

  toJson(): Partial<Recipe> {
    const json: Partial<Recipe> = {};

    const methods = [
      'title',
      'author',
      'canonicalUrl',
      'siteName',
      'host',
      'ingredients',
      'instructions',
      // ... all methods
    ];

    for (const method of methods) {
      try {
        json[method as keyof Recipe] = (this as any)[method]();
      } catch {
        // Skip if not implemented
      }
    }

    return json;
  }
}
```

**Success Criteria:**
- [ ] Base class structure complete
- [ ] Plugin attachment works
- [ ] toJson() serializes correctly
- [ ] Can extend for site-specific scrapers

---

### Phase 4: Site Scrapers (Weeks 5-8)

#### Step 4.1: Implement First Scraper (AllRecipes)

**Create src/scrapers/sites/allrecipes.ts:**
```typescript
import { AbstractScraper } from '../abstract';

export class AllRecipesScraper extends AbstractScraper {
  host(): string {
    return 'allrecipes.com';
  }

  // All methods inherited from schema.org via plugins
}
```

**Create tests/scrapers/allrecipes.test.ts:**
```typescript
import { readFileSync } from 'fs';
import { AllRecipesScraper } from '../../src/scrapers/sites/allrecipes';

describe('AllRecipesScraper', () => {
  const html = readFileSync('../tests/test_data/allrecipes.com/recipe.testhtml', 'utf-8');
  const expected = JSON.parse(
    readFileSync('../tests/test_data/allrecipes.com/recipe.json', 'utf-8')
  );

  let scraper: AllRecipesScraper;

  beforeEach(() => {
    scraper = new AllRecipesScraper(html, 'https://www.allrecipes.com/recipe/123/');
  });

  it('should extract title', () => {
    expect(scraper.title()).toBe(expected.title);
  });

  it('should extract ingredients', () => {
    expect(scraper.ingredients()).toEqual(expected.ingredients);
  });

  // ... test all mandatory fields
});
```

**Success Criteria:**
- [ ] AllRecipes scraper implemented
- [ ] All tests pass
- [ ] Output matches Python version exactly

#### Step 4.2: Implement 10 High-Priority Scrapers

**Priority List:**
1. AllRecipes
2. Food Network
3. Serious Eats
4. NYT Cooking
5. BBC Good Food
6. Bon Appetit
7. Epicurious
8. Delish
9. Tasty
10. Simply Recipes

**Process for Each:**
1. Create TypeScript class in `src/scrapers/sites/[name].ts`
2. Copy method overrides from Python version
3. Create test file
4. Validate against test data
5. Ensure 100% test passing

**Success Criteria:**
- [ ] 10 scrapers implemented
- [ ] All tests pass
- [ ] Coverage >90%

#### Step 4.3: Automate Remaining Scrapers

**Create script to generate scrapers:**
```typescript
// scripts/generate-scrapers.ts
import { readdirSync } from 'fs';
import { join } from 'path';

const pythonScrapersDir = '../recipe_scrapers';
const tsScrapersDir = './src/scrapers/sites';

// Read all Python scrapers
const pythonScrapers = readdirSync(pythonScrapersDir)
  .filter((f) => f.endsWith('.py'))
  .filter((f) => !f.startsWith('_'));

// For each, create TypeScript equivalent
for (const scraper of pythonScrapers) {
  // Parse Python file
  // Generate TypeScript class
  // Create test file
}
```

**Success Criteria:**
- [ ] Script generates valid TypeScript
- [ ] All 518 scrapers ported
- [ ] All tests pass

---

### Phase 5: Testing & Quality (Week 9)

#### Step 5.1: Achieve Coverage Goals

**Actions:**
```bash
npm run test:coverage
```

**Review coverage report, add tests for:**
- Edge cases in utilities
- Error handling paths
- Plugin combinations
- Unusual schema.org structures

**Success Criteria:**
- [ ] Code coverage >90%
- [ ] All scrapers tested
- [ ] No critical paths untested

#### Step 5.2: Set Up CI/CD

**Create .github/workflows/typescript-tests.yml:**
```yaml
name: TypeScript Tests

on:
  push:
    branches: [main, develop]
    paths:
      - 'typescript/**'
      - '.github/workflows/typescript-tests.yml'
  pull_request:
    paths:
      - 'typescript/**'

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node-version: [18, 20, 22]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          cache-dependency-path: typescript/package-lock.json

      - name: Install dependencies
        working-directory: ./typescript
        run: npm ci

      - name: Lint
        working-directory: ./typescript
        run: npm run lint

      - name: Type check
        working-directory: ./typescript
        run: npm run type-check

      - name: Run tests
        working-directory: ./typescript
        run: npm run test:coverage

      - name: Upload coverage
        if: matrix.os == 'ubuntu-latest' && matrix.node-version == '20'
        uses: codecov/codecov-action@v3
        with:
          files: ./typescript/coverage/lcov.info
          flags: typescript
```

**Success Criteria:**
- [ ] CI runs on all platforms
- [ ] Tests pass on Node 18, 20, 22
- [ ] Coverage uploaded to Codecov

#### Step 5.3: Performance Testing

**Create performance benchmarks:**
```typescript
// tests/performance/benchmark.ts
import { performance } from 'perf_hooks';
import { AllRecipesScraper } from '../src/scrapers/sites/allrecipes';

const html = readFileSync('...', 'utf-8');

const start = performance.now();
for (let i = 0; i < 1000; i++) {
  const scraper = new AllRecipesScraper(html, 'https://...');
  scraper.title();
  scraper.ingredients();
}
const end = performance.now();

console.log(`Avg time: ${(end - start) / 1000}ms per scrape`);
```

**Success Criteria:**
- [ ] Scraping performance measured
- [ ] No major regressions vs Python
- [ ] Benchmark results documented

---

### Phase 6: Documentation (Week 10)

#### Step 6.1: API Documentation

**Generate TypeDoc:**
```bash
npm run docs
```

**Add JSDoc comments to all public APIs:**
```typescript
/**
 * Scrapes recipe data from HTML using schema.org and site-specific extractors.
 *
 * @param html - The HTML content to parse
 * @param url - The URL of the recipe page
 * @returns A scraper instance for the detected website
 *
 * @example
 * ```typescript
 * const scraper = scrapeHtml(html, 'https://allrecipes.com/recipe/123/');
 * console.log(scraper.title());
 * ```
 */
export function scrapeHtml(html: string, url: string): AbstractScraper {
  // ...
}
```

**Success Criteria:**
- [ ] All public APIs documented
- [ ] Examples provided
- [ ] TypeDoc generates clean docs

#### Step 6.2: User Guide

**Create typescript/README.md:**
Include:
- Installation instructions
- Quick start guide
- API reference
- Supported websites list
- Migration guide from Python
- Contributing guidelines

**Success Criteria:**
- [ ] README complete
- [ ] Examples work
- [ ] Clear for new users

---

### Phase 7: Publishing (Week 11)

#### Step 7.1: Prepare for npm Publish

**Actions:**
1. Verify package.json metadata
2. Test installation locally:
   ```bash
   npm pack
   cd /tmp/test-install
   npm install /path/to/recipe-scrapers-0.1.0.tgz
   ```
3. Create npm account / verify access

**Success Criteria:**
- [ ] Package installs correctly
- [ ] All files included in dist
- [ ] No unnecessary files published

#### Step 7.2: Set Up Automated Publishing

**Create .github/workflows/npm-publish.yml:**
```yaml
name: Publish to npm

on:
  release:
    types: [created]
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to publish'
        required: true

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        working-directory: ./typescript
        run: npm ci

      - name: Build
        working-directory: ./typescript
        run: npm run build

      - name: Publish
        working-directory: ./typescript
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Success Criteria:**
- [ ] Automated publishing works
- [ ] Version bumping process defined
- [ ] Release notes template created

#### Step 7.3: First Release

**Actions:**
```bash
cd typescript
npm version 0.1.0
git tag typescript/v0.1.0
git push origin typescript/v0.1.0
```

**Success Criteria:**
- [ ] Package published to npm
- [ ] Installable via `npm install recipe-scrapers`
- [ ] GitHub release created

---

## Success Metrics

### Quantitative Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Test Coverage** | >90% | `npm run test:coverage` |
| **Scrapers Ported** | 518/518 (100%) | Count in `src/scrapers/sites/` |
| **Test Pass Rate** | 100% | CI green on all platforms |
| **Type Safety** | 0 `any` types | `npm run type-check` |
| **Build Time** | <30s | `time npm run build` |
| **Scrape Performance** | <50ms avg | Performance benchmarks |
| **Bundle Size** | <500KB (minified) | Check dist/ |
| **Documentation** | 100% public APIs | TypeDoc coverage |
| **npm Downloads** | >100/month | npm stats after 3 months |

### Qualitative Metrics

- [ ] **API Parity:** All Python methods available in TypeScript
- [ ] **Test Data Parity:** All tests use same data as Python
- [ ] **Output Parity:** TypeScript output matches Python exactly
- [ ] **Developer Experience:** Easy to add new scrapers
- [ ] **User Experience:** Simple API, good docs
- [ ] **Maintainability:** Code is readable and well-structured
- [ ] **Community:** Issues responded to within 48h

---

## Ongoing Maintenance

### Weekly Tasks
- [ ] Monitor CI for failures
- [ ] Review and merge PRs
- [ ] Respond to issues
- [ ] Check for new Python scrapers to port

### Monthly Tasks
- [ ] Dependency updates (npm update)
- [ ] Review test data for staleness
- [ ] Update documentation
- [ ] Performance regression testing

### Quarterly Tasks
- [ ] Major version updates
- [ ] Benchmark against Python version
- [ ] Community survey
- [ ] Roadmap review

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Python repo changes break TypeScript | High | Medium | Automated sync checks in CI |
| Test data goes stale | Medium | High | Regular updates from Python repo |
| Performance issues | Low | Medium | Benchmark tests in CI |
| Dependency vulnerabilities | Medium | Medium | Dependabot alerts, regular updates |
| Low adoption | Medium | Low | Good docs, examples, marketing |
| Maintenance burden too high | Medium | High | Automate scraper generation |

---

## Decision Points

### When to Consider Moving to Separate Repo

Triggers:
- Python repo becomes too large/complex
- TypeScript community wants independence
- Different release cadences needed
- Contributor confusion about which code to modify

Process:
1. Discuss with maintainers
2. Create new repo
3. Migrate code and history
4. Set up test data sync
5. Archive TypeScript code in Python repo
6. Update all documentation

### When to Drop Support for Older Node Versions

Policy:
- Support current LTS and previous LTS
- Drop support when Node version reaches EOL
- Announce deprecation 3 months in advance

---

## Conclusion

This approach keeps TypeScript and Python code side-by-side, maximizing ease of reference during development while accepting the complexity of a polyglot repository. Best suited for teams that value tight integration and don't mind the overhead of managing multiple languages in one repo.

**Timeline:** 11 weeks to production-ready TypeScript port
**Effort:** 1 full-time developer (or 2 part-time)
**Maintenance:** Ongoing, moderate effort to keep in sync
