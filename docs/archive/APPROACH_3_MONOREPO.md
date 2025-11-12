# Approach 3: Monorepo with Turborepo

## Overview

Transform the existing repository into a monorepo that houses both Python and TypeScript versions using modern monorepo tooling (Turborepo). This provides shared test data, coordinated releases, and optimized builds while maintaining clear package boundaries.

**Best For:** Teams wanting tight integration, shared infrastructure, coordinated releases, and optimal developer experience with modern tooling.

---

## Repository Structure

```
recipe-scrapers/ (monorepo root)
├── packages/
│   ├── python/
│   │   ├── recipe_scrapers/
│   │   │   ├── __init__.py
│   │   │   ├── _abstract.py
│   │   │   └── ... (all Python code)
│   │   ├── tests/
│   │   │   └── ... (Python-specific tests)
│   │   ├── docs/
│   │   ├── pyproject.toml
│   │   ├── setup.py
│   │   └── README.md
│   └── typescript/
│       ├── src/
│       │   ├── index.ts
│       │   ├── scrapers/
│       │   ├── plugins/
│       │   ├── utils/
│       │   └── types/
│       ├── tests/
│       │   ├── unit/
│       │   └── scrapers/
│       ├── dist/
│       ├── docs/
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
├── shared/
│   └── test-data/              # Shared test data
│       ├── allrecipes.com/
│       │   ├── recipe.testhtml
│       │   └── recipe.json
│       └── ...
├── tools/
│   ├── scripts/
│   │   ├── generate-scraper.ts
│   │   ├── validate-parity.ts
│   │   └── sync-scrapers.sh
│   └── configs/
│       ├── eslint-config/
│       ├── tsconfig/
│       └── jest-config/
├── .github/
│   └── workflows/
│       ├── python-ci.yml
│       ├── typescript-ci.yml
│       ├── parity-check.yml
│       ├── publish-python.yml
│       ├── publish-npm.yml
│       └── release.yml
├── docs/
│   ├── getting-started.md
│   ├── python-guide.md
│   ├── typescript-guide.md
│   ├── contributing.md
│   └── architecture.md
├── package.json                # Workspace root
├── turbo.json                  # Turborepo configuration
├── pnpm-workspace.yaml         # PNPM workspace config
├── .gitignore
├── .nvmrc
├── LICENSE
└── README.md
```

---

## Detailed Implementation Steps

### Phase 0: Monorepo Setup (Week 0)

#### Step 0.1: Backup Existing Repository

**Actions:**
```bash
# Create backup branch
git checkout -b pre-monorepo-backup
git push origin pre-monorepo-backup

# Return to main development branch
git checkout main
```

**Success Criteria:**
- [ ] Backup branch created
- [ ] All current work preserved

#### Step 0.2: Install Monorepo Tools

**Actions:**
```bash
# Install pnpm globally (recommended for monorepos)
npm install -g pnpm

# Verify installation
pnpm --version
```

**Success Criteria:**
- [ ] pnpm installed
- [ ] Version >=8.0.0

#### Step 0.3: Initialize Workspace

**Create pnpm-workspace.yaml:**
```yaml
packages:
  - 'packages/*'
  - 'tools/*'
```

**Create root package.json:**
```json
{
  "name": "recipe-scrapers-monorepo",
  "version": "1.0.0",
  "private": true,
  "description": "Monorepo for recipe-scrapers (Python & TypeScript)",
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "turbo run format",
    "dev": "turbo run dev --parallel",
    "clean": "turbo run clean && rm -rf node_modules",
    "validate": "turbo run validate",
    "parity-check": "node tools/scripts/validate-parity.js"
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "typescript": "^5.0.0",
    "prettier": "^3.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.10.0"
}
```

**Create turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"],
      "env": ["NODE_ENV"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": false
    },
    "lint": {
      "outputs": []
    },
    "format": {
      "outputs": [],
      "cache": false
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    },
    "validate": {
      "dependsOn": ["lint", "test", "build"]
    }
  }
}
```

**Success Criteria:**
- [ ] Workspace configuration valid
- [ ] Turborepo installed
- [ ] Root scripts work

#### Step 0.4: Restructure Existing Code

**Actions:**
```bash
# Create new structure
mkdir -p packages/python packages/typescript shared/test-data tools/{scripts,configs}

# Move Python code
git mv recipe_scrapers packages/python/
git mv pyproject.toml packages/python/
git mv setup.py packages/python/

# Move and reorganize test data
git mv tests/test_data shared/test-data/

# Create Python tests directory and move Python-specific tests
mkdir -p packages/python/tests
# Move any Python-specific test files (not test_data)

# Commit restructuring
git add .
git commit -m "refactor: restructure as monorepo"
```

**Success Criteria:**
- [ ] Python code moved to packages/python
- [ ] Test data moved to shared/
- [ ] Git history preserved

#### Step 0.5: Update Python Package Configuration

**Update packages/python/pyproject.toml:**
```toml
[build-system]
requires = ["setuptools"]
build-backend = "setuptools.build_meta"

[project]
name = "recipe_scrapers"
# ... existing configuration ...

[tool.setuptools.packages.find]
include = ["recipe_scrapers", "recipe_scrapers.*"]
exclude = ["tests", "tests.*"]

# Update test data path references
[tool.pytest.ini_options]
testpaths = ["tests", "../../shared/test-data"]
```

**Create packages/python/package.json:**
```json
{
  "name": "@recipe-scrapers/python",
  "version": "15.9.0",
  "private": true,
  "scripts": {
    "test": "python -m pytest",
    "test:parallel": "python -m unittest_parallel",
    "lint": "flake8 recipe_scrapers tests",
    "format": "black recipe_scrapers tests",
    "type-check": "mypy recipe_scrapers",
    "validate": "pnpm run lint && pnpm run type-check && pnpm run test",
    "clean": "rm -rf build dist *.egg-info"
  }
}
```

**Success Criteria:**
- [ ] Python package works in new location
- [ ] Can run Python tests
- [ ] Test data accessible from new location

---

### Phase 1: TypeScript Package Setup (Week 1)

#### Step 1.1: Initialize TypeScript Package

**Actions:**
```bash
cd packages/typescript
pnpm init
```

**Create packages/typescript/package.json:**
```json
{
  "name": "@recipe-scrapers/typescript",
  "version": "0.1.0",
  "description": "TypeScript port of recipe-scrapers",
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
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean --sourcemap",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src tests --ext .ts",
    "lint:fix": "eslint src tests --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\" \"tests/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "validate": "pnpm run type-check && pnpm run lint && pnpm run test",
    "clean": "rm -rf dist coverage .turbo"
  },
  "dependencies": {
    "cheerio": "^1.0.0-rc.12",
    "jsonld": "^8.3.2",
    "luxon": "^3.4.4"
  },
  "devDependencies": {
    "@types/cheerio": "^0.22.35",
    "@types/jest": "^29.5.11",
    "@types/luxon": "^3.3.7",
    "@types/node": "^20.10.6",
    "eslint": "^8.56.0",
    "jest": "^29.7.0",
    "prettier": "^3.1.1",
    "ts-jest": "^29.1.1",
    "tsup": "^8.0.1",
    "typescript": "^5.3.3"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

**Success Criteria:**
- [ ] Package.json created
- [ ] Dependencies defined
- [ ] Scripts configured

#### Step 1.2: Create Shared Configurations

**Create tools/configs/tsconfig/base.json:**
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
    "resolveJsonModule": true
  }
}
```

**Create packages/typescript/tsconfig.json:**
```json
{
  "extends": "../../tools/configs/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Create tools/configs/eslint-config/index.js:**
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
  },
};
```

**Create packages/typescript/.eslintrc.js:**
```javascript
module.exports = {
  extends: ['../../tools/configs/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
  },
};
```

**Success Criteria:**
- [ ] Shared configs created
- [ ] TypeScript package extends shared config
- [ ] Configs work correctly

#### Step 1.3: Configure Jest for Shared Test Data

**Create packages/typescript/jest.config.js:**
```javascript
const path = require('path');

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
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
    // Make shared test data path available to tests
    TEST_DATA_PATH: path.resolve(__dirname, '../../shared/test-data'),
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test-data/(.*)$': '<rootDir>/../../shared/test-data/$1',
  },
  verbose: true,
};
```

**Create test helper:**

**packages/typescript/tests/helpers/test-data.ts:**
```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

const TEST_DATA_PATH = join(__dirname, '../../../shared/test-data');

export function loadTestHtml(domain: string, filename: string): string {
  const path = join(TEST_DATA_PATH, domain, filename);
  return readFileSync(path, 'utf-8');
}

export function loadExpectedJson(domain: string, filename: string): any {
  const path = join(TEST_DATA_PATH, domain, filename);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function getTestDataPath(domain: string): string {
  return join(TEST_DATA_PATH, domain);
}
```

**Success Criteria:**
- [ ] Jest can access shared test data
- [ ] Path aliases work
- [ ] Test helpers work

---

### Phase 2: Core Implementation (Weeks 2-4)

**Follow same implementation as Approach 1 and 2:**
- Implement types
- Implement utilities
- Implement SchemaOrg parser
- Implement OpenGraph parser
- Implement plugin system
- Implement AbstractScraper

**Key Difference: Reference Python Code Easily**

Because both packages are in same repo, can easily reference:
```bash
# While implementing TypeScript, check Python version
cat ../python/recipe_scrapers/_abstract.py
```

**Success Criteria:**
- [ ] All core components implemented
- [ ] Unit tests pass
- [ ] Can reference Python easily

---

### Phase 3: Parity Validation System (Week 5)

#### Step 3.1: Create Parity Validation Tool

**Create tools/scripts/validate-parity.ts:**
```typescript
#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import * as chalk from 'chalk';

interface ParityResult {
  domain: string;
  testFile: string;
  passed: boolean;
  errors?: string[];
}

class ParityValidator {
  private testDataPath = join(__dirname, '../../shared/test-data');
  private pythonPath = join(__dirname, '../../packages/python');
  private typescriptPath = join(__dirname, '../../packages/typescript');
  private results: ParityResult[] = [];

  async validate(): Promise<void> {
    console.log(chalk.blue('🔍 Running Parity Validation\n'));

    const domains = readdirSync(this.testDataPath);

    for (const domain of domains) {
      await this.validateDomain(domain);
    }

    this.printReport();
  }

  private async validateDomain(domain: string): Promise<void> {
    const domainPath = join(this.testDataPath, domain);
    const testFiles = readdirSync(domainPath).filter(f => f.endsWith('.testhtml'));

    for (const testFile of testFiles) {
      await this.validateTestFile(domain, testFile);
    }
  }

  private async validateTestFile(domain: string, testFile: string): Promise<void> {
    const htmlPath = join(this.testDataPath, domain, testFile);
    const jsonFile = testFile.replace('.testhtml', '.json');
    const jsonPath = join(this.testDataPath, domain, jsonFile);

    try {
      // Run Python scraper
      const pythonOutput = this.runPythonScraper(htmlPath, domain);

      // Run TypeScript scraper
      const tsOutput = this.runTypescriptScraper(htmlPath, domain);

      // Compare
      const comparison = this.compareOutputs(pythonOutput, tsOutput);

      this.results.push({
        domain,
        testFile,
        passed: comparison.passed,
        errors: comparison.errors,
      });

      if (comparison.passed) {
        console.log(chalk.green(`✓ ${domain}/${testFile}`));
      } else {
        console.log(chalk.red(`✗ ${domain}/${testFile}`));
        comparison.errors?.forEach(err => console.log(chalk.gray(`  ${err}`)));
      }
    } catch (error) {
      this.results.push({
        domain,
        testFile,
        passed: false,
        errors: [error.message],
      });
      console.log(chalk.red(`✗ ${domain}/${testFile} - ${error.message}`));
    }
  }

  private runPythonScraper(htmlPath: string, domain: string): any {
    const script = `
import json
from recipe_scrapers import scrape_html

with open('${htmlPath}', 'r') as f:
    html = f.read()

scraper = scrape_html(html, 'https://${domain}/')
print(json.dumps(scraper.to_json()))
    `;

    const output = execSync(`cd ${this.pythonPath} && python -c "${script}"`, {
      encoding: 'utf-8',
    });

    return JSON.parse(output);
  }

  private runTypescriptScraper(htmlPath: string, domain: string): any {
    // Use the built TypeScript package
    const { scrapeHtml } = require('../../packages/typescript/dist');
    const html = readFileSync(htmlPath, 'utf-8');
    const scraper = scrapeHtml(html, `https://${domain}/`);
    return scraper.toJson();
  }

  private compareOutputs(python: any, typescript: any): { passed: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Compare all fields
    const allKeys = new Set([...Object.keys(python), ...Object.keys(typescript)]);

    for (const key of allKeys) {
      if (JSON.stringify(python[key]) !== JSON.stringify(typescript[key])) {
        errors.push(`${key}: Python=${JSON.stringify(python[key])} vs TS=${JSON.stringify(typescript[key])}`);
      }
    }

    return {
      passed: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private printReport(): void {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    const passRate = ((passed / total) * 100).toFixed(1);

    console.log('\n' + chalk.blue('='.repeat(50)));
    console.log(chalk.blue('📊 Parity Validation Report'));
    console.log(chalk.blue('='.repeat(50)));
    console.log(`Total tests: ${total}`);
    console.log(chalk.green(`Passed: ${passed} (${passRate}%)`));
    console.log(chalk.red(`Failed: ${failed}`));
    console.log(chalk.blue('='.repeat(50)) + '\n');

    if (failed > 0) {
      process.exit(1);
    }
  }
}

// Run validation
new ParityValidator().validate();
```

**Add to root package.json:**
```json
{
  "scripts": {
    "parity-check": "ts-node tools/scripts/validate-parity.ts"
  },
  "devDependencies": {
    "ts-node": "^10.9.2",
    "chalk": "^4.1.2"
  }
}
```

**Success Criteria:**
- [ ] Script runs both Python and TypeScript
- [ ] Compares outputs
- [ ] Reports differences clearly

#### Step 3.2: Add Parity Check to CI

**Create .github/workflows/parity-check.yml:**
```yaml
name: Parity Check

on:
  push:
    branches: [main, develop]
  pull_request:
  schedule:
    - cron: '0 3 * * *'

jobs:
  parity:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: |
          pnpm install
          cd packages/python && pip install -e .

      - name: Build TypeScript
        run: pnpm --filter @recipe-scrapers/typescript build

      - name: Run parity check
        run: pnpm parity-check

      - name: Upload report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: parity-report
          path: parity-report.json
```

**Success Criteria:**
- [ ] CI runs parity checks
- [ ] Both Python and TypeScript tested
- [ ] Reports uploaded on failure

---

### Phase 4: Scraper Implementation (Weeks 6-9)

#### Step 4.1: Create Scraper Generator

**Create tools/scripts/generate-scraper.ts:**
```typescript
#!/usr/bin/env ts-node
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ScraperConfig {
  domain: string;
  className: string;
}

function generateScraper(config: ScraperConfig): void {
  const { domain, className } = config;

  // Check if Python scraper exists
  const pythonPath = join(__dirname, `../../packages/python/recipe_scrapers/${domain.replace('.', '')}.py`);
  if (!existsSync(pythonPath)) {
    console.error(`Python scraper not found at ${pythonPath}`);
    process.exit(1);
  }

  // Read Python scraper to see what methods are overridden
  const pythonCode = readFileSync(pythonPath, 'utf-8');
  const overriddenMethods = extractOverriddenMethods(pythonCode);

  // Generate TypeScript scraper
  const tsCode = `import { AbstractScraper } from '../abstract';

export class ${className}Scraper extends AbstractScraper {
  host(): string {
    return '${domain}';
  }

${overriddenMethods.map(method => `  ${method}(): any {
    // TODO: Port from Python
    throw new Error('Not implemented');
  }`).join('\n\n')}
}
`;

  // Write TypeScript file
  const tsPath = join(__dirname, `../../packages/typescript/src/scrapers/sites/${domain.replace('.', '')}.ts`);
  writeFileSync(tsPath, tsCode);

  // Generate test file
  const testCode = `import { ${className}Scraper } from '../../src/scrapers/sites/${domain.replace('.', '')}';
import { loadTestHtml, loadExpectedJson } from '../helpers/test-data';

describe('${className}Scraper', () => {
  // TODO: Add tests
});
`;

  const testPath = join(__dirname, `../../packages/typescript/tests/scrapers/${domain.replace('.', '')}.test.ts`);
  writeFileSync(testPath, testCode);

  console.log(`✓ Generated ${className}Scraper`);
  console.log(`  TypeScript: ${tsPath}`);
  console.log(`  Test: ${testPath}`);
}

function extractOverriddenMethods(pythonCode: string): string[] {
  // Simple regex to find method definitions
  const methodRegex = /def\s+(\w+)\(/g;
  const methods: string[] = [];
  let match;

  while ((match = methodRegex.exec(pythonCode)) !== null) {
    const methodName = match[1];
    if (!methodName.startsWith('_') && methodName !== '__init__') {
      methods.push(methodName);
    }
  }

  return methods;
}

// CLI
const domain = process.argv[2];
const className = process.argv[3];

if (!domain || !className) {
  console.error('Usage: generate-scraper.ts <domain> <ClassName>');
  process.exit(1);
}

generateScraper({ domain, className });
```

**Usage:**
```bash
pnpm ts-node tools/scripts/generate-scraper.ts allrecipes.com AllRecipes
```

**Success Criteria:**
- [ ] Script generates TypeScript scraper
- [ ] Detects overridden methods from Python
- [ ] Creates test file

#### Step 4.2: Implement Priority Scrapers

**Same process as other approaches, but with advantages:**
- Python code is right there (`../python/recipe_scrapers/`)
- Shared test data at `../../shared/test-data/`
- Can run parity check easily

**Success Criteria:**
- [ ] 10 priority scrapers implemented
- [ ] Tests pass
- [ ] Parity check passes

#### Step 4.3: Batch Implementation

**Create bulk conversion script or use generator for all 518 scrapers**

**Success Criteria:**
- [ ] All 518 scrapers ported
- [ ] All tests pass
- [ ] Parity check passes

---

### Phase 5: Coordinated Releases (Week 10)

#### Step 5.1: Version Management

**Install changesets:**
```bash
pnpm add -D -w @changesets/cli
pnpm changeset init
```

**Configure .changeset/config.json:**
```json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

**Workflow:**
1. Make changes
2. Run `pnpm changeset` to document changes
3. On release, run `pnpm changeset version` to bump versions
4. Run `pnpm changeset publish` to publish

**Success Criteria:**
- [ ] Changesets configured
- [ ] Version bumping works
- [ ] Can release both packages

#### Step 5.2: Set Up Release Workflow

**Create .github/workflows/release.yml:**
```yaml
name: Release

on:
  push:
    branches:
      - main

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pnpm install

      - name: Build packages
        run: pnpm build

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: pnpm run release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          PYPI_TOKEN: ${{ secrets.PYPI_TOKEN }}

      - name: Publish to PyPI
        if: steps.changesets.outputs.published == 'true'
        run: |
          cd packages/python
          python -m pip install --upgrade build twine
          python -m build
          python -m twine upload dist/* --username __token__ --password ${{ secrets.PYPI_TOKEN }}
```

**Add release script to root package.json:**
```json
{
  "scripts": {
    "release": "turbo run build && changeset publish"
  }
}
```

**Success Criteria:**
- [ ] Can release both packages together
- [ ] Automated via GitHub Actions
- [ ] Version numbers coordinated

---

### Phase 6: Documentation (Week 11)

#### Step 6.1: Monorepo Documentation

**Update root README.md:**
```markdown
# recipe-scrapers

Monorepo containing Python and TypeScript implementations of recipe-scrapers.

## Packages

- [`@recipe-scrapers/python`](packages/python/README.md) - Python implementation
- [`@recipe-scrapers/typescript`](packages/typescript/README.md) - TypeScript implementation

## Quick Start

### Python
\`\`\`bash
pip install recipe-scrapers
\`\`\`

### TypeScript
\`\`\`bash
npm install recipe-scrapers
\`\`\`

## Development

This is a monorepo managed with [pnpm](https://pnpm.io/) and [Turborepo](https://turbo.build/).

### Setup
\`\`\`bash
pnpm install
\`\`\`

### Build all packages
\`\`\`bash
pnpm build
\`\`\`

### Run all tests
\`\`\`bash
pnpm test
\`\`\`

### Parity check
\`\`\`bash
pnpm parity-check
\`\`\`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)
```

**Success Criteria:**
- [ ] Root README explains monorepo
- [ ] Links to package-specific docs
- [ ] Development instructions clear

#### Step 6.2: Package Documentation

**Update packages/typescript/README.md:**
```markdown
# @recipe-scrapers/typescript

TypeScript implementation of recipe-scrapers.

This package is part of the recipe-scrapers monorepo and maintains 100% parity with the Python version through automated testing.

[Rest of README similar to Approach 2]
```

**Success Criteria:**
- [ ] Each package has complete README
- [ ] Cross-references between packages
- [ ] Clear monorepo context

---

## Success Metrics

### Quantitative Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Parity Rate** | 100% | Parity validation script |
| **Build Time** | <2min for all packages | Turborepo metrics |
| **Test Coverage (TS)** | >90% | Jest coverage |
| **Test Coverage (Python)** | >90% | Coverage.py |
| **Cache Hit Rate** | >80% | Turborepo cache analytics |
| **CI Duration** | <10min | GitHub Actions metrics |
| **Scrapers Ported** | 518/518 | Count TypeScript scrapers |
| **Failed Tests** | 0 | CI must be green |

### Qualitative Metrics

- [ ] **Developer Experience:** Easy to develop both versions
- [ ] **Build Performance:** Turborepo speeds up builds
- [ ] **Test Efficiency:** Shared test data reduces duplication
- [ ] **Parity:** Automated validation ensures consistency
- [ ] **Release Coordination:** Both packages versioned together
- [ ] **Documentation:** Clear monorepo organization

---

## Advantages of Monorepo Approach

### 1. Shared Infrastructure
- ✅ Single source of truth for test data
- ✅ Shared tooling configs
- ✅ Coordinated CI/CD
- ✅ Unified versioning

### 2. Developer Experience
- ✅ Easy to reference Python code
- ✅ Both versions in same checkout
- ✅ Turborepo accelerates builds with caching
- ✅ Single command to build/test all

### 3. Parity Enforcement
- ✅ Automated parity checks
- ✅ Same test data for both
- ✅ Can't drift apart easily
- ✅ Coordinated releases

### 4. Modern Tooling
- ✅ Turborepo remote caching
- ✅ Parallel execution
- ✅ Dependency graph optimization
- ✅ Best-in-class DX

---

## Disadvantages & Mitigation

| Disadvantage | Mitigation |
|-------------|------------|
| **Tooling complexity** | Good documentation, setup scripts |
| **Learning curve** | Onboarding guide, examples |
| **Repo size** | Sparse checkout options, shallow clones |
| **Different languages** | Clear package boundaries |
| **Release coordination** | Changesets for independent versioning if needed |

---

## Ongoing Maintenance

### Daily
- [ ] Monitor CI for both packages
- [ ] Parity check results

### Weekly
- [ ] Review PRs for both packages
- [ ] Update dependencies
- [ ] Check Turborepo cache performance

### Monthly
- [ ] Evaluate tooling updates
- [ ] Performance optimization
- [ ] Documentation updates

### Quarterly
- [ ] Monorepo structure review
- [ ] Tooling evaluation
- [ ] Community feedback

---

## Comparison with Other Approaches

### vs Approach 1 (TypeScript in Python Repo)

**Advantages:**
- ✅ Better tooling (Turborepo)
- ✅ Clearer package boundaries
- ✅ Remote caching
- ✅ Coordinated releases

**Disadvantages:**
- ❌ More initial setup
- ❌ Requires learning Turborepo/pnpm

### vs Approach 2 (Separate Repos)

**Advantages:**
- ✅ Shared test data (no sync needed)
- ✅ Easy Python reference
- ✅ Coordinated releases
- ✅ Single repo to star/fork

**Disadvantages:**
- ❌ More complex setup
- ❌ Larger repo size

### vs Approach 4 (Hybrid)

**Advantages:**
- ✅ Best long-term structure
- ✅ No migration needed later
- ✅ Shared infrastructure from start

**Disadvantages:**
- ❌ No "simple start"
- ❌ Commits more effort upfront

---

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 0: Monorepo Setup** | 1 week | Turborepo configured, code restructured |
| **Phase 1: TS Package Setup** | 1 week | TypeScript package initialized |
| **Phase 2: Core Implementation** | 3 weeks | Core scrapers and plugins |
| **Phase 3: Parity Validation** | 1 week | Automated parity checking |
| **Phase 4: Scrapers** | 4 weeks | All 518 scrapers ported |
| **Phase 5: Releases** | 1 week | Coordinated release workflow |
| **Phase 6: Documentation** | 1 week | Complete docs |
| **Total** | **12 weeks** | Production monorepo |

**Effort:** 1 full-time developer + DevOps support for Turborepo setup

---

## Conclusion

The monorepo approach provides the best long-term structure with modern tooling, shared infrastructure, and automated parity enforcement. Best suited for teams comfortable with modern JavaScript tooling and wanting optimal developer experience.

**Key Success Factors:**
- Turborepo for build performance
- Shared test data eliminates sync issues
- Automated parity validation
- Coordinated releases
