# Approach 2: Separate Repository from Start

## Overview

Create the TypeScript port in a completely separate repository (`recipe-scrapers-ts`) from day one. This maintains clean separation between Python and TypeScript codebases while requiring test data synchronization.

**Best For:** Independent versioning, clear separation of concerns, standard ecosystem conventions, long-term sustainability.

---

## Repository Structure

### New Repository: `recipe-scrapers-ts`

```
recipe-scrapers-ts/
├── src/
│   ├── index.ts
│   ├── scrapers/
│   │   ├── abstract.ts
│   │   ├── schema-org.ts
│   │   ├── opengraph.ts
│   │   ├── factory.ts
│   │   └── sites/
│   │       ├── allrecipes.ts
│   │       ├── bbcgoodfood.ts
│   │       └── ... (518 scrapers)
│   ├── plugins/
│   │   ├── index.ts
│   │   ├── base.ts
│   │   ├── exception-handling.ts
│   │   ├── schemaorg-fill.ts
│   │   ├── opengraph-fill.ts
│   │   ├── html-stripper.ts
│   │   ├── normalize-string.ts
│   │   └── static-values.ts
│   ├── utils/
│   │   ├── duration.ts
│   │   ├── yields.ts
│   │   ├── normalize.ts
│   │   ├── tags.ts
│   │   └── grouping.ts
│   ├── types/
│   │   ├── recipe.ts
│   │   └── scraper.ts
│   └── exceptions.ts
├── tests/
│   ├── unit/
│   │   ├── utils/
│   │   ├── schema-org.test.ts
│   │   ├── opengraph.test.ts
│   │   └── plugins.test.ts
│   ├── scrapers/
│   │   ├── allrecipes.test.ts
│   │   └── ...
│   └── test_data/              # Synced from Python repo
│       ├── allrecipes.com/
│       │   ├── recipe.testhtml
│       │   └── recipe.json
│       └── ...
├── scripts/
│   ├── sync-test-data.sh       # Syncs from Python repo
│   ├── generate-scraper.ts     # Scaffold new scrapers
│   └── validate-parity.ts      # Compare with Python output
├── docs/
│   ├── getting-started.md
│   ├── api-reference.md
│   ├── migration-guide.md
│   ├── contributing.md
│   └── supported-websites.md
├── .github/
│   └── workflows/
│       ├── test.yml
│       ├── publish.yml
│       ├── sync-test-data.yml  # Auto-sync from Python repo
│       └── parity-check.yml    # Validate against Python
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── jest.config.js
├── tsconfig.json
├── tsconfig.build.json
├── package.json
├── LICENSE
└── README.md
```

---

## Detailed Implementation Steps

### Phase 0: Repository Setup (Week 0)

#### Step 0.1: Create New GitHub Repository

**Actions:**
```bash
# On GitHub
# Create new repository: recipe-scrapers-ts
# Description: "TypeScript port of recipe-scrapers - Extract recipe data from cooking websites"
# Public repository
# Initialize with README
# Add MIT license
# Add .gitignore (Node)
```

**Success Criteria:**
- [ ] Repository created and accessible
- [ ] License matches Python version (MIT)
- [ ] README has basic description

#### Step 0.2: Clone and Initialize

**Actions:**
```bash
git clone https://github.com/YOUR_USERNAME/recipe-scrapers-ts.git
cd recipe-scrapers-ts

# Initialize npm
npm init -y
```

**Success Criteria:**
- [ ] Repository cloned locally
- [ ] package.json created

#### Step 0.3: Set Up Test Data Sync

**Create .gitmodules:**
```bash
# Option A: Git submodule
git submodule add --sparse https://github.com/hhursev/recipe-scrapers.git python-ref
cd python-ref
git sparse-checkout init --cone
git sparse-checkout set tests/test_data
cd ..

# Create symlink
ln -s python-ref/tests/test_data tests/test_data
```

**Or Option B: Sync script (recommended):**

**Create scripts/sync-test-data.sh:**
```bash
#!/bin/bash
set -e

PYTHON_REPO="https://github.com/hhursev/recipe-scrapers.git"
TEMP_DIR=$(mktemp -d)
DEST_DIR="tests/test_data"

echo "Cloning Python repository (sparse checkout)..."
git clone --depth 1 --filter=blob:none --sparse "$PYTHON_REPO" "$TEMP_DIR"

cd "$TEMP_DIR"
git sparse-checkout init --cone
git sparse-checkout set tests/test_data

echo "Syncing test data..."
rm -rf "../$DEST_DIR"
cp -r tests/test_data "../$DEST_DIR"

cd ..
rm -rf "$TEMP_DIR"

echo "✓ Test data synced successfully"
echo "Total test cases: $(find $DEST_DIR -name '*.json' | wc -l)"
```

**Make executable:**
```bash
chmod +x scripts/sync-test-data.sh
./scripts/sync-test-data.sh
```

**Success Criteria:**
- [ ] Test data synced from Python repo
- [ ] Sync script works reliably
- [ ] Script can be run in CI

#### Step 0.4: Set Up Automated Sync

**Create .github/workflows/sync-test-data.yml:**
```yaml
name: Sync Test Data

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Sync test data
        run: ./scripts/sync-test-data.sh

      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          commit-message: 'chore: sync test data from Python repo'
          title: 'Sync test data from Python repository'
          body: |
            Automated sync of test data from the Python recipe-scrapers repository.

            This PR updates test HTML and expected JSON files to match the latest Python version.
          branch: auto-sync-test-data
          delete-branch: true
```

**Success Criteria:**
- [ ] Daily automated sync runs
- [ ] Creates PR when test data changes
- [ ] Manual trigger works

---

### Phase 1: Foundation (Weeks 1-2)

#### Step 1.1: Configure Project

**Update package.json:**
```json
{
  "name": "recipe-scrapers",
  "version": "0.1.0",
  "description": "TypeScript library for extracting recipe data from cooking websites",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean --sourcemap",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "lint": "eslint src tests --ext .ts",
    "lint:fix": "eslint src tests --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\" \"tests/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "docs": "typedoc",
    "validate": "npm run type-check && npm run lint && npm run test",
    "sync-test-data": "./scripts/sync-test-data.sh",
    "prepublishOnly": "npm run validate && npm run build"
  },
  "keywords": [
    "recipe",
    "scraper",
    "parser",
    "cooking",
    "schema.org",
    "structured-data",
    "typescript"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/recipe-scrapers-ts.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/recipe-scrapers-ts/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/recipe-scrapers-ts#readme",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Success Criteria:**
- [ ] package.json complete
- [ ] All scripts work

#### Step 1.2: Install Dependencies

```bash
# Core dependencies
npm install cheerio jsonld luxon

# Type definitions
npm install -D @types/node @types/cheerio

# Build tools
npm install -D typescript tsup

# Testing
npm install -D jest @types/jest ts-jest

# Code quality
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier
npm install -D husky lint-staged

# Documentation
npm install -D typedoc typedoc-plugin-markdown
```

**Success Criteria:**
- [ ] All dependencies installed
- [ ] No vulnerability warnings
- [ ] package-lock.json committed

#### Step 1.3: TypeScript Configuration

**Create tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "typeRoots": ["./node_modules/@types"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests", "**/*.test.ts", "**/*.spec.ts"]
}
```

**Success Criteria:**
- [ ] TypeScript compiles without errors
- [ ] Strict mode enabled
- [ ] Path aliases work

#### Step 1.4: Testing Configuration

**Create jest.config.js:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  verbose: true,
  testTimeout: 10000,
};
```

**Success Criteria:**
- [ ] Jest runs successfully
- [ ] Coverage reports generate
- [ ] Path aliases work in tests

#### Step 1.5: Linting & Formatting

**Create .eslintrc.js:**
```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  ignorePatterns: ['dist', 'node_modules', '*.config.js'],
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
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**Success Criteria:**
- [ ] ESLint runs without errors
- [ ] Prettier formats consistently
- [ ] Rules match project standards

---

### Phase 2: Core Implementation (Weeks 3-5)

#### Step 2.1: Implement Types

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
  total_time?: number;
  cook_time?: number;
  prep_time?: number;
  cuisine?: string;
  cooking_method?: string;
  ratings?: number;
  ratings_count?: number;
  equipment?: string[];
  nutrients?: Nutrients;
  dietary_restrictions?: string[];
  image?: string;
  keywords?: string[];
}

export interface IngredientGroup {
  purpose?: string;
  ingredients: string[];
}

export interface Nutrients {
  [key: string]: string;
}
```

**Create src/types/scraper.ts:**
```typescript
import { Recipe } from './recipe';

export interface IScraper {
  title(): string;
  author(): string | undefined;
  canonicalUrl(): string;
  siteName(): string;
  host(): string;
  language(): string | undefined;
  ingredients(): string[];
  instructions(): string;
  instructionsList(): string[];
  // ... all other methods

  toJson(): Partial<Recipe>;
}
```

**Success Criteria:**
- [ ] All recipe fields typed
- [ ] Scraper interface complete
- [ ] Types exported from index

#### Step 2.2: Implement Utilities

**Follow same implementation as Approach 1:**
- src/utils/duration.ts
- src/utils/normalize.ts
- src/utils/yields.ts
- src/utils/tags.ts
- src/utils/grouping.ts

**Success Criteria:**
- [ ] All utilities implemented
- [ ] Unit tests pass
- [ ] 100% coverage for utils

#### Step 2.3: Implement Core Scrapers

**Follow same implementation as Approach 1:**
- src/scrapers/schema-org.ts
- src/scrapers/opengraph.ts
- src/scrapers/abstract.ts

**Success Criteria:**
- [ ] Core scrapers implemented
- [ ] Unit tests pass
- [ ] Matches Python behavior

#### Step 2.4: Implement Plugin System

**Follow same implementation as Approach 1**

**Success Criteria:**
- [ ] All 7 plugins implemented
- [ ] Plugin chaining works
- [ ] Tests pass

---

### Phase 3: Parity Validation (Week 6)

#### Step 3.1: Create Parity Validation Script

**Create scripts/validate-parity.ts:**
```typescript
import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import * as diff from 'diff';

/**
 * Validates that TypeScript output matches Python output exactly
 */
async function validateParity() {
  const testDataDir = 'tests/test_data';
  const domains = readdirSync(testDataDir);

  let totalTests = 0;
  let passed = 0;
  let failed = 0;

  for (const domain of domains) {
    const domainPath = join(testDataDir, domain);
    const testFiles = readdirSync(domainPath).filter(f => f.endsWith('.testhtml'));

    for (const testFile of testFiles) {
      totalTests++;
      const htmlPath = join(domainPath, testFile);
      const jsonPath = join(domainPath, testFile.replace('.testhtml', '.json'));

      const expectedJson = JSON.parse(readFileSync(jsonPath, 'utf-8'));

      // Run TypeScript scraper
      try {
        const tsOutput = runTypeScriptScraper(htmlPath, domain);

        // Compare outputs
        if (deepEqual(tsOutput, expectedJson)) {
          passed++;
          console.log(`✓ ${domain}/${testFile}`);
        } else {
          failed++;
          console.error(`✗ ${domain}/${testFile}`);
          console.error('Differences:', diff.diffJson(expectedJson, tsOutput));
        }
      } catch (error) {
        failed++;
        console.error(`✗ ${domain}/${testFile} - Error:`, error.message);
      }
    }
  }

  console.log(`\n=== Parity Report ===`);
  console.log(`Total: ${totalTests}`);
  console.log(`Passed: ${passed} (${((passed/totalTests)*100).toFixed(1)}%)`);
  console.log(`Failed: ${failed}`);

  process.exit(failed > 0 ? 1 : 0);
}

validateParity();
```

**Success Criteria:**
- [ ] Script compares all test cases
- [ ] Reports differences clearly
- [ ] Can run in CI

#### Step 3.2: Set Up Parity Check CI

**Create .github/workflows/parity-check.yml:**
```yaml
name: Parity Check

on:
  push:
    branches: [main, develop]
  pull_request:
  schedule:
    - cron: '0 3 * * *' # Daily at 3 AM

jobs:
  parity:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          npm ci
          pip install recipe-scrapers

      - name: Run parity validation
        run: npm run validate-parity

      - name: Upload parity report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: parity-report
          path: parity-report.json
```

**Success Criteria:**
- [ ] CI runs parity checks
- [ ] Reports uploaded on failure
- [ ] Runs daily to catch regressions

---

### Phase 4: Scraper Implementation (Weeks 7-10)

#### Step 4.1: Implement 10 Priority Scrapers

**Same priority list as Approach 1:**
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

**Process:**
1. Create src/scrapers/sites/[name].ts
2. Port from Python (reference via GitHub)
3. Create test file
4. Validate with test data
5. Run parity check

**Success Criteria:**
- [ ] 10 scrapers implemented
- [ ] All tests pass
- [ ] Parity validation passes

#### Step 4.2: Batch Implement Remaining Scrapers

**Create script to automate:**
```bash
# scripts/port-scrapers.sh
#!/bin/bash

PYTHON_REPO="https://github.com/hhursev/recipe-scrapers.git"
TEMP_DIR=$(mktemp -d)

git clone --depth 1 "$PYTHON_REPO" "$TEMP_DIR"

cd "$TEMP_DIR/recipe_scrapers"

for scraper in *.py; do
  if [[ $scraper != _* && $scraper != __* ]]; then
    echo "Porting $scraper..."
    # Use GPT/Claude API to convert Python to TypeScript
    # or manual conversion
  fi
done
```

**Success Criteria:**
- [ ] All 518 scrapers ported
- [ ] Tests pass for each
- [ ] Parity checks pass

---

### Phase 5: Documentation (Week 11)

#### Step 5.1: API Documentation

**Create typedoc.json:**
```json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs/api",
  "plugin": ["typedoc-plugin-markdown"],
  "readme": "README.md",
  "includeVersion": true,
  "excludePrivate": true,
  "excludeProtected": true,
  "excludeInternal": true
}
```

**Generate docs:**
```bash
npm run docs
```

**Success Criteria:**
- [ ] API docs generated
- [ ] All public APIs documented
- [ ] Examples included

#### Step 5.2: User Documentation

**Create docs/getting-started.md:**
- Installation
- Quick start
- Basic usage
- Advanced features

**Create docs/migration-guide.md:**
- Differences from Python version
- API mapping
- Code examples

**Create docs/contributing.md:**
- Development setup
- Adding new scrapers
- Testing requirements
- PR process

**Success Criteria:**
- [ ] All docs complete
- [ ] Clear and easy to follow
- [ ] Examples tested

#### Step 5.3: README

**Update README.md:**
```markdown
# recipe-scrapers (TypeScript)

TypeScript library for extracting recipe data from cooking websites.

Port of the popular [Python recipe-scrapers library](https://github.com/hhursev/recipe-scrapers).

## Features

- 🌐 Supports 518+ recipe websites
- 📊 Schema.org parsing (JSON-LD, Microdata, RDFa)
- 🔌 Plugin architecture for customization
- 💪 Full TypeScript support
- ✅ Comprehensive test coverage
- 📦 Tree-shakeable ESM/CJS builds

## Installation

\`\`\`bash
npm install recipe-scrapers
\`\`\`

## Quick Start

\`\`\`typescript
import { scrapeHtml } from 'recipe-scrapers';

const html = '...'; // Recipe page HTML
const url = 'https://www.allrecipes.com/recipe/123/';

const scraper = scrapeHtml(html, url);

console.log(scraper.title());
console.log(scraper.ingredients());
console.log(scraper.instructions());
\`\`\`

## Supported Websites

[See full list of 518+ supported websites](docs/supported-websites.md)

## Documentation

- [Getting Started](docs/getting-started.md)
- [API Reference](docs/api-reference.md)
- [Migration from Python](docs/migration-guide.md)
- [Contributing](docs/contributing.md)

## Relationship to Python Version

This is a TypeScript port of [recipe-scrapers (Python)](https://github.com/hhursev/recipe-scrapers). We aim for 100% API parity and use the same test data to ensure consistency.

## License

MIT
```

**Success Criteria:**
- [ ] README clear and comprehensive
- [ ] Links to Python version
- [ ] Installation instructions correct

---

### Phase 6: Publishing (Week 12)

#### Step 6.1: Prepare Package

**Verify package.json:**
- Correct name (check npm availability)
- Version starting at 0.1.0
- All metadata complete
- Files array includes only dist/

**Test local install:**
```bash
npm pack
npm install -g recipe-scrapers-0.1.0.tgz
node -e "const {scrapeHtml} = require('recipe-scrapers'); console.log(typeof scrapeHtml)"
```

**Success Criteria:**
- [ ] Package installs correctly
- [ ] Exports work as expected
- [ ] No unnecessary files included

#### Step 6.2: Set Up npm Publishing

**Create .github/workflows/publish.yml:**
```yaml
name: Publish to npm

on:
  release:
    types: [published]

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
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create GitHub Release Assets
        run: |
          tar -czf recipe-scrapers-${{ github.event.release.tag_name }}.tgz dist
          gh release upload ${{ github.event.release.tag_name }} recipe-scrapers-${{ github.event.release.tag_name }}.tgz
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Success Criteria:**
- [ ] Automated publishing configured
- [ ] npm token secured
- [ ] Release process documented

#### Step 6.3: First Release

**Actions:**
```bash
# Verify everything works
npm run validate
npm run build

# Create release
git tag v0.1.0
git push origin v0.1.0

# Create GitHub release (triggers npm publish)
gh release create v0.1.0 --title "v0.1.0 - Initial Release" --notes "Initial TypeScript port of recipe-scrapers"
```

**Success Criteria:**
- [ ] Package published to npm
- [ ] GitHub release created
- [ ] Installable via `npm install recipe-scrapers`

---

## Success Metrics

### Quantitative Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Test Coverage** | >90% | `npm run test:coverage` |
| **Scrapers Ported** | 518/518 | Count TypeScript scrapers |
| **Parity Rate** | 100% | Parity validation script |
| **Test Pass Rate** | 100% | CI must be green |
| **npm Weekly Downloads** | >100 after 6 months | npm stats |
| **GitHub Stars** | >50 after 6 months | GitHub insights |
| **Bundle Size** | <500KB minified | Check dist/ |
| **Type Safety** | 0 `any` types | ESLint reports |
| **API Coverage** | 100% documented | TypeDoc coverage |
| **Build Time** | <30s | CI metrics |

### Qualitative Metrics

- [ ] **Independence:** Can evolve independently of Python version
- [ ] **Discoverability:** Easy to find on npm and GitHub
- [ ] **Developer Experience:** Simple to install and use
- [ ] **Maintainability:** Clear code structure
- [ ] **Community:** Active issues and discussions
- [ ] **Documentation Quality:** Comprehensive and clear
- [ ] **Cross-reference:** Python users can find TypeScript version

---

## Ongoing Maintenance

### Daily Tasks
- [ ] Monitor CI for failures
- [ ] Check parity validation results
- [ ] Respond to critical issues

### Weekly Tasks
- [ ] Review and merge PRs
- [ ] Triage new issues
- [ ] Update dependencies (security patches)
- [ ] Check for new Python scrapers to port

### Monthly Tasks
- [ ] Dependency updates (major versions)
- [ ] Performance benchmarks
- [ ] Update documentation
- [ ] Community engagement (blog posts, tweets)

### Quarterly Tasks
- [ ] Sync major features from Python
- [ ] Community survey
- [ ] Roadmap planning
- [ ] Review metrics and goals

---

## Test Data Synchronization Strategy

### Initial Sync
```bash
./scripts/sync-test-data.sh
git add tests/test_data
git commit -m "chore: initial test data sync"
```

### Ongoing Sync

**Automated (Daily):**
- GitHub Action runs at 2 AM UTC
- Syncs test data from Python repo
- Creates PR if changes detected
- Maintainer reviews and merges

**Manual (On Demand):**
```bash
npm run sync-test-data
git add tests/test_data
git commit -m "chore: sync test data"
```

### Handling Sync Conflicts

**If test data changes break tests:**
1. Automated PR created with failing tests
2. Investigate why tests fail
3. Either:
   - Fix TypeScript code to match new expected output
   - If Python version has bug, skip syncing that file
4. Document any intentional differences

---

## Parity Maintenance

### Tracking Python Changes

**Monitor Python repo:**
- Subscribe to releases
- Watch for new scrapers
- Track breaking changes

**Tools:**
- GitHub Watch on Python repo
- RSS feed for releases
- Monthly review of commit log

### Porting New Features

**When Python adds new scraper:**
1. Sync test data (automated)
2. Port scraper class to TypeScript
3. Run tests
4. Validate parity
5. Merge and release

**When Python adds new feature:**
1. Discuss in issue: should TypeScript have this?
2. If yes, create feature branch
3. Implement and test
4. Validate parity
5. Update docs
6. Merge and release minor version

---

## Communication with Python Project

### Cross-Referencing

**In Python README:**
- Submit PR to add link to TypeScript version
- Add to "Ports and Variants" section

**In TypeScript README:**
- Link prominently to Python version
- Credit original authors
- Explain relationship

### Issue Coordination

**When bug affects both:**
1. Report in Python repo first
2. Link TypeScript issue to Python issue
3. Port fix once Python merges
4. Reference Python PR in TypeScript PR

**When bug is TypeScript-specific:**
1. Fix in TypeScript repo
2. Check if Python has same issue
3. If yes, create Python PR

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Test data goes stale** | High | High | Automated daily sync |
| **Drift from Python version** | Medium | High | Parity validation in CI |
| **Duplicate effort on bugs** | Medium | Medium | Cross-reference issues |
| **Low adoption/discoverability** | Medium | Medium | SEO, docs, link from Python repo |
| **Maintenance burden** | Medium | High | Automate everything possible |
| **Breaking changes in Python** | Low | High | Version tracking, upgrade guides |
| **npm package name conflict** | Low | Medium | Have backup names ready |

---

## Decision Points

### When to Diverge from Python

**Consider TypeScript-specific features when:**
- TypeScript idioms differ (e.g., Promises vs callbacks)
- Type safety can be improved
- Performance optimizations available in Node.js
- Community requests TypeScript-specific features

**Process:**
1. Discuss in GitHub Discussion
2. Document reason for divergence
3. Update migration guide
4. Maintain parity where possible

### When to Deprecate Features

**If Python deprecates a feature:**
1. Mark as deprecated in TypeScript
2. Provide migration path
3. Remove in next major version
4. Update docs

### When to Stop Maintaining

**Triggers:**
- Python version abandoned
- No community interest
- Unable to maintain parity
- Better alternative emerges

**Process:**
1. Archive repository
2. Update README with deprecation notice
3. Point to alternatives
4. Stop publishing updates

---

## Comparison with Other Approaches

### vs Approach 1 (Python Repo)

**Advantages:**
- ✅ Clean separation
- ✅ Independent versioning
- ✅ Standard repo structure
- ✅ Easier to discover

**Disadvantages:**
- ❌ Test data duplication
- ❌ Harder to reference Python code
- ❌ More maintenance overhead

### vs Approach 3 (Monorepo)

**Advantages:**
- ✅ Simpler tooling
- ✅ Standard structure
- ✅ Independent community

**Disadvantages:**
- ❌ No shared test data
- ❌ More sync effort

### vs Approach 4 (Hybrid)

**Advantages:**
- ✅ Clean final state
- ✅ Independent from start

**Disadvantages:**
- ❌ No easy reference during development
- ❌ Test data sync from start

---

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 0: Setup** | 1 week | Repo created, test data synced, CI configured |
| **Phase 1: Foundation** | 2 weeks | Project configured, dependencies installed |
| **Phase 2: Core** | 3 weeks | Utilities, scrapers, plugins implemented |
| **Phase 3: Validation** | 1 week | Parity validation working |
| **Phase 4: Scrapers** | 4 weeks | All 518 scrapers ported |
| **Phase 5: Docs** | 1 week | Complete documentation |
| **Phase 6: Publishing** | 1 week | Published to npm |
| **Total** | **13 weeks** | Production-ready TypeScript package |

**Effort:** 1 full-time developer or 2 part-time developers

---

## Conclusion

The separate repository approach provides clean separation and independence while requiring robust test data synchronization. Best suited for projects that value standard conventions and independent evolution over tight integration with the Python version.

**Key Success Factor:** Automated test data sync and parity validation are critical for maintaining consistency with the Python version.
