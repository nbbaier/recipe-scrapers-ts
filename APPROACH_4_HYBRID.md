# Approach 4: Hybrid - Start in Python Repo, Extract Later

## Overview

**The Recommended Approach**

Begin development in the Python repository under a `typescript/` directory to maximize reference accessibility and validation during porting. Once the TypeScript port achieves 100% parity and is production-ready, extract it to an independent repository with automated test data synchronization.

**Best For:** Balancing optimal development experience with clean long-term structure. Get the benefits of tight integration during development, then graduate to independence at maturity.

---

## Two-Phase Strategy

### Phase A: Development (In Python Repo)
**Duration:** 10-12 weeks
**Goal:** Complete TypeScript port with validated 1:1 parity

### Phase B: Extraction (To Separate Repo)
**Duration:** 1-2 weeks
**Goal:** Independent TypeScript package with automated test data sync

---

## Phase A: Development in Python Repository

### Directory Structure (Development Phase)

```
recipe-scrapers/
├── recipe_scrapers/           # Python source (existing)
│   ├── __init__.py
│   ├── _abstract.py
│   └── ...
├── typescript/                # TypeScript port (NEW)
│   ├── src/
│   │   ├── index.ts
│   │   ├── scrapers/
│   │   │   ├── abstract.ts
│   │   │   ├── schema-org.ts
│   │   │   ├── opengraph.ts
│   │   │   └── sites/
│   │   │       ├── allrecipes.ts
│   │   │       └── ...
│   │   ├── plugins/
│   │   ├── utils/
│   │   ├── types/
│   │   └── exceptions.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── scrapers/
│   ├── dist/
│   ├── docs/
│   ├── scripts/
│   │   ├── compare-outputs.ts
│   │   └── validate-parity.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── README.md
│   └── EXTRACTION_PLAN.md      # Document for Phase B
├── tests/                      # Shared test data
│   └── test_data/
│       ├── allrecipes.com/
│       └── ...
├── .github/
│   └── workflows/
│       ├── python.yml          # Existing
│       ├── typescript.yml      # NEW
│       └── parity-check.yml    # NEW
├── pyproject.toml              # Existing
├── .gitignore                  # Update for TS
└── README.md                   # Update to mention TS
```

---

## Detailed Implementation: Phase A (Development)

### Week 0: Preparation

#### Step 0.1: Create Development Branch

**Actions:**
```bash
cd recipe-scrapers
git checkout -b typescript-port
git push -u origin typescript-port
```

**Success Criteria:**
- [ ] Development branch created
- [ ] Branch pushed to GitHub
- [ ] Protected branch rules configured

#### Step 0.2: Update Repository Documentation

**Update README.md:**
```markdown
# recipe-scrapers

[Existing content...]

## TypeScript Port (In Development)

We're actively developing a TypeScript port of recipe-scrapers in the `typescript/` directory.

**Status:** 🚧 Under development
**Target:** 100% API parity with Python version
**Documentation:** See [`typescript/README.md`](typescript/README.md)

Once stable, the TypeScript version will be extracted to its own repository and published to npm.
```

**Success Criteria:**
- [ ] README updated
- [ ] TypeScript port status visible
- [ ] Sets expectations about extraction

#### Step 0.3: Update .gitignore

**Actions:**
```bash
cat >> .gitignore << 'EOF'

# TypeScript
typescript/node_modules/
typescript/dist/
typescript/coverage/
typescript/*.tsbuildinfo
typescript/.eslintcache
EOF
```

**Success Criteria:**
- [ ] TypeScript artifacts ignored
- [ ] No accidental commits

### Weeks 1-9: Core Development

**Follow implementation from Approach 1 (Python Repo), with these key advantages:**

#### Easy Python Reference
```bash
# While implementing TypeScript
cd typescript/src/scrapers
cat ../../recipe_scrapers/_abstract.py    # Check Python implementation
cat ../../recipe_scrapers/_schemaorg.py   # Reference schema.org parser
```

#### Shared Test Data
```typescript
// typescript/tests/scrapers/allrecipes.test.ts
import { readFileSync } from 'fs';

const testData = '../tests/test_data/allrecipes.com/recipe.testhtml';
const expected = '../tests/test_data/allrecipes.com/recipe.json';

// Direct access to same test data Python uses
const html = readFileSync(testData, 'utf-8');
const expectedJson = JSON.parse(readFileSync(expected, 'utf-8'));
```

#### Side-by-Side Comparison

**Create typescript/scripts/compare-outputs.ts:**
```typescript
#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import * as diff from 'diff';

interface ComparisonResult {
  domain: string;
  testFile: string;
  identical: boolean;
  differences?: any;
}

async function compareImplementations() {
  const testDataPath = '../tests/test_data';
  // Read all test cases
  // For each:
  //   1. Run Python scraper
  //   2. Run TypeScript scraper
  //   3. Compare JSON outputs
  //   4. Report differences
}

// CLI usage:
// ts-node scripts/compare-outputs.ts allrecipes.com
// ts-node scripts/compare-outputs.ts --all
```

**Success Criteria:**
- [ ] All core components implemented
- [ ] Easy reference to Python code
- [ ] Shared test data validates parity
- [ ] Comparison tools ensure accuracy

### Week 10: Validation & Documentation

#### Step 10.1: Comprehensive Parity Validation

**Create typescript/scripts/validate-parity.ts:**
```typescript
#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as chalk from 'chalk';

interface ValidationReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  failures: Array<{
    domain: string;
    testFile: string;
    differences: any;
  }>;
}

class ParityValidator {
  private report: ValidationReport;

  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passed: 0,
      failed: 0,
      passRate: 0,
      failures: [],
    };
  }

  async validate(): Promise<void> {
    console.log(chalk.blue('🔍 Validating TypeScript/Python Parity\n'));

    const testDataPath = join(__dirname, '../../tests/test_data');
    const domains = readdirSync(testDataPath);

    for (const domain of domains) {
      await this.validateDomain(domain, testDataPath);
    }

    this.calculateMetrics();
    this.printReport();
    this.saveReport();

    if (this.report.failed > 0) {
      process.exit(1);
    }
  }

  private async validateDomain(domain: string, basePath: string): Promise<void> {
    const domainPath = join(basePath, domain);
    const testFiles = readdirSync(domainPath).filter(f => f.endsWith('.testhtml'));

    for (const testFile of testFiles) {
      this.report.totalTests++;

      try {
        const pythonOutput = this.runPythonScraper(domain, testFile);
        const tsOutput = this.runTypeScriptScraper(domain, testFile);

        if (this.areEqual(pythonOutput, tsOutput)) {
          this.report.passed++;
          console.log(chalk.green(`✓ ${domain}/${testFile}`));
        } else {
          this.report.failed++;
          const differences = this.findDifferences(pythonOutput, tsOutput);
          this.report.failures.push({ domain, testFile, differences });
          console.log(chalk.red(`✗ ${domain}/${testFile}`));
          this.printDifferences(differences);
        }
      } catch (error) {
        this.report.failed++;
        console.log(chalk.red(`✗ ${domain}/${testFile} - Error: ${error.message}`));
      }
    }
  }

  private runPythonScraper(domain: string, testFile: string): any {
    const script = `
import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from recipe_scrapers import scrape_html

html_path = Path('tests/test_data/${domain}/${testFile}')
html = html_path.read_text()

scraper = scrape_html(html, 'https://${domain}/')
print(json.dumps(scraper.to_json(), sort_keys=True))
    `;

    const output = execSync(`python -c "${script}"`, {
      cwd: join(__dirname, '../..'),
      encoding: 'utf-8',
    });

    return JSON.parse(output);
  }

  private runTypeScriptScraper(domain: string, testFile: string): any {
    const { scrapeHtml } = require('../dist');
    const htmlPath = join(__dirname, `../../tests/test_data/${domain}/${testFile}`);
    const html = readFileSync(htmlPath, 'utf-8');

    const scraper = scrapeHtml(html, `https://${domain}/`);
    return scraper.toJson();
  }

  private areEqual(a: any, b: any): boolean {
    return JSON.stringify(this.normalize(a)) === JSON.stringify(this.normalize(b));
  }

  private normalize(obj: any): any {
    // Sort keys, normalize whitespace, etc.
    if (Array.isArray(obj)) {
      return obj.map(item => this.normalize(item));
    }
    if (typeof obj === 'object' && obj !== null) {
      const normalized: any = {};
      Object.keys(obj).sort().forEach(key => {
        normalized[key] = this.normalize(obj[key]);
      });
      return normalized;
    }
    if (typeof obj === 'string') {
      return obj.trim();
    }
    return obj;
  }

  private findDifferences(python: any, typescript: any): any {
    const differences: any = {};
    const allKeys = new Set([
      ...Object.keys(python || {}),
      ...Object.keys(typescript || {})
    ]);

    for (const key of allKeys) {
      const pyValue = python?.[key];
      const tsValue = typescript?.[key];

      if (JSON.stringify(pyValue) !== JSON.stringify(tsValue)) {
        differences[key] = {
          python: pyValue,
          typescript: tsValue,
        };
      }
    }

    return differences;
  }

  private printDifferences(differences: any): void {
    for (const [key, { python, typescript }] of Object.entries(differences)) {
      console.log(chalk.gray(`    ${key}:`));
      console.log(chalk.gray(`      Python: ${JSON.stringify(python)}`));
      console.log(chalk.gray(`      TypeScript: ${JSON.stringify(typescript)}`));
    }
  }

  private calculateMetrics(): void {
    this.report.passRate = (this.report.passed / this.report.totalTests) * 100;
  }

  private printReport(): void {
    console.log('\n' + chalk.blue('='.repeat(60)));
    console.log(chalk.blue('📊 Parity Validation Report'));
    console.log(chalk.blue('='.repeat(60)));
    console.log(`Total tests: ${this.report.totalTests}`);
    console.log(chalk.green(`Passed: ${this.report.passed} (${this.report.passRate.toFixed(2)}%)`));
    console.log(chalk.red(`Failed: ${this.report.failed}`));

    if (this.report.passRate === 100) {
      console.log(chalk.green.bold('\n🎉 100% PARITY ACHIEVED!'));
      console.log(chalk.green('TypeScript port is ready for extraction.\n'));
    } else {
      console.log(chalk.yellow(`\n⚠️  ${this.report.failed} tests need attention before extraction.\n`));
    }

    console.log(chalk.blue('='.repeat(60)) + '\n');
  }

  private saveReport(): void {
    const reportPath = join(__dirname, '../parity-report.json');
    writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(chalk.gray(`Report saved to: ${reportPath}\n`));
  }
}

new ParityValidator().validate();
```

**Add to typescript/package.json:**
```json
{
  "scripts": {
    "validate-parity": "npm run build && ts-node scripts/validate-parity.ts",
    "compare": "ts-node scripts/compare-outputs.ts"
  },
  "devDependencies": {
    "ts-node": "^10.9.2",
    "chalk": "^4.1.2",
    "diff": "^5.1.0"
  }
}
```

**Success Criteria:**
- [ ] Parity validation reports 100% pass rate
- [ ] All 518 scrapers validated
- [ ] Report saved for documentation

#### Step 10.2: Document Extraction Plan

**Create typescript/EXTRACTION_PLAN.md:**
```markdown
# Extraction Plan: TypeScript Port to Separate Repository

## Status

✅ TypeScript port complete
✅ 100% parity achieved
✅ All tests passing
✅ Ready for extraction

## Extraction Process

### Pre-Extraction Checklist

- [ ] Parity validation shows 100% pass rate
- [ ] All TypeScript tests passing
- [ ] Documentation complete
- [ ] No breaking changes in flight
- [ ] Maintainers approve extraction

### Extraction Steps

[Detailed steps for Phase B, see below]

### Post-Extraction Checklist

- [ ] New repository created and configured
- [ ] Test data sync working
- [ ] CI/CD configured
- [ ] Package published to npm
- [ ] Python repo updated with links
- [ ] Announcement published

## Timeline

Estimated: 1-2 weeks from extraction start to npm publication
```

**Success Criteria:**
- [ ] Extraction plan documented
- [ ] Checklist ready to execute
- [ ] Timeline estimated

### Week 11: Pre-Extraction Preparation

#### Step 11.1: Freeze Development

**Actions:**
1. Create `typescript/v1.0.0` milestone
2. Merge all pending PRs
3. Final parity validation
4. Tag the state: `git tag typescript-pre-extraction-v1.0.0`

**Success Criteria:**
- [ ] Development frozen
- [ ] All changes merged
- [ ] State tagged for reference

#### Step 11.2: Prepare npm Package

**Update typescript/package.json for publication:**
```json
{
  "name": "recipe-scrapers",
  "version": "1.0.0",
  "description": "TypeScript library for extracting recipe data from cooking websites",
  "keywords": [
    "recipe",
    "scraper",
    "parser",
    "cooking",
    "schema.org",
    "structured-data",
    "typescript"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/recipe-scrapers-ts.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/recipe-scrapers-ts/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/recipe-scrapers-ts#readme"
}
```

**Success Criteria:**
- [ ] Package metadata complete
- [ ] npm package name available
- [ ] Version ready for 1.0.0

#### Step 11.3: Document Relationship

**Update typescript/README.md:**
```markdown
# recipe-scrapers (TypeScript)

TypeScript port of the popular [Python recipe-scrapers library](https://github.com/hhursev/recipe-scrapers).

## Development History

This TypeScript port was developed within the Python repository to ensure 100% parity. It has been extracted to its own repository for independent evolution while maintaining compatibility.

**Parity Status:** ✅ 100% (as of v1.0.0)

[Rest of README...]
```

**Success Criteria:**
- [ ] Relationship to Python version documented
- [ ] Development history explained
- [ ] Parity status highlighted

---

## Phase B: Extraction to Separate Repository

### Week 12: Extraction

#### Step 12.1: Create New Repository

**Actions:**
```bash
# On GitHub
# Create new repository: recipe-scrapers-ts
# Public repository
# MIT license
# No initialization (we'll push existing code)
```

**Success Criteria:**
- [ ] Repository created
- [ ] Settings configured
- [ ] Collaborators added

#### Step 12.2: Extract TypeScript Code

**Method 1: Clean Copy (Recommended)**

```bash
# In a new directory
git clone https://github.com/hhursev/recipe-scrapers.git temp-extraction
cd temp-extraction

# Extract just TypeScript directory with history
git filter-repo --path typescript/ --path-rename typescript/:

# Or use git subtree
git subtree split --prefix=typescript -b typescript-only
git checkout typescript-only

# Add new remote
git remote add typescript https://github.com/YOUR_USERNAME/recipe-scrapers-ts.git

# Push
git push typescript typescript-only:main
```

**Method 2: Fresh Start (Simpler)**

```bash
# Create new repo locally
git init recipe-scrapers-ts
cd recipe-scrapers-ts

# Copy TypeScript code (without git history)
cp -r ../recipe-scrapers/typescript/* .

# Initialize git
git add .
git commit -m "Initial commit: TypeScript port extracted from Python repo"

# Push to new repo
git remote add origin https://github.com/YOUR_USERNAME/recipe-scrapers-ts.git
git push -u origin main
```

**Success Criteria:**
- [ ] TypeScript code in new repo
- [ ] Git history preserved (optional)
- [ ] Clean structure

#### Step 12.3: Set Up Test Data Sync

**Create scripts/sync-test-data.sh in new repo:**
```bash
#!/bin/bash
set -e

PYTHON_REPO="https://github.com/hhursev/recipe-scrapers.git"
TEMP_DIR=$(mktemp -d)
DEST_DIR="tests/test_data"

echo "🔄 Syncing test data from Python repository..."

# Sparse clone of just test data
git clone --depth 1 --filter=blob:none --sparse "$PYTHON_REPO" "$TEMP_DIR"
cd "$TEMP_DIR"
git sparse-checkout init --cone
git sparse-checkout set tests/test_data

# Sync to our repo
echo "📦 Copying test data..."
rm -rf "../$DEST_DIR"
mkdir -p "../$DEST_DIR"
cp -r tests/test_data/* "../$DEST_DIR/"

# Cleanup
cd ..
rm -rf "$TEMP_DIR"

# Count files
TEST_COUNT=$(find "$DEST_DIR" -name '*.json' | wc -l)
echo "✅ Synced $TEST_COUNT test cases"
```

**Make executable:**
```bash
chmod +x scripts/sync-test-data.sh
```

**Initial sync:**
```bash
./scripts/sync-test-data.sh
git add tests/test_data
git commit -m "chore: initial test data sync from Python repo"
git push
```

**Success Criteria:**
- [ ] Test data synced
- [ ] Sync script works
- [ ] Tests pass with synced data

#### Step 12.4: Set Up Automated Sync

**Create .github/workflows/sync-test-data.yml:**
```yaml
name: Sync Test Data

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:      # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Sync test data
        run: ./scripts/sync-test-data.sh

      - name: Check for changes
        id: changes
        run: |
          git diff --quiet tests/test_data || echo "changed=true" >> $GITHUB_OUTPUT

      - name: Create Pull Request
        if: steps.changes.outputs.changed == 'true'
        uses: peter-evans/create-pull-request@v5
        with:
          commit-message: 'chore: sync test data from Python repository'
          title: 'Sync test data from Python repository'
          body: |
            Automated sync of test data from [Python recipe-scrapers](https://github.com/hhursev/recipe-scrapers).

            **Test Data Changes:**
            - New test cases added
            - Existing test cases updated
            - Some test cases may have been removed

            **Action Required:**
            - Review test changes
            - Run `npm test` to verify all tests pass
            - Merge if tests pass, otherwise investigate failures

            This PR was automatically created by the sync-test-data workflow.
          branch: auto-sync-test-data
          delete-branch: true
          labels: test-data,automated
```

**Success Criteria:**
- [ ] Automated sync runs daily
- [ ] Creates PR when changes detected
- [ ] Can trigger manually

#### Step 12.5: Set Up CI/CD

**Create .github/workflows/ci.yml:**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node-version: [18, 20, 22]

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Build
        run: npm run build

      - name: Test
        run: npm run test:coverage

      - name: Upload coverage
        if: matrix.os == 'ubuntu-latest' && matrix.node-version == '20'
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

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

      - run: npm ci
      - run: npm run build
      - run: npm test

      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Success Criteria:**
- [ ] CI runs on all platforms
- [ ] Publishing workflow configured
- [ ] npm token secured

#### Step 12.6: Publish to npm

**Actions:**
```bash
# Verify everything works
npm run validate
npm run build

# Create release
git tag v1.0.0
git push origin v1.0.0

# Create GitHub release
gh release create v1.0.0 \
  --title "v1.0.0 - Initial Release" \
  --notes "Initial TypeScript port of recipe-scrapers with 100% parity to Python version."
```

**Success Criteria:**
- [ ] v1.0.0 published to npm
- [ ] GitHub release created
- [ ] Package installable

#### Step 12.7: Update Python Repository

**Create PR to Python repo:**

**Update README.md:**
```markdown
## TypeScript Version

A TypeScript port of recipe-scrapers is available as a separate package:

**npm:** `npm install recipe-scrapers`
**Repository:** [recipe-scrapers-ts](https://github.com/YOUR_USERNAME/recipe-scrapers-ts)

The TypeScript version maintains 100% API parity with the Python version.
```

**Add to docs:**
Create section in documentation explaining both versions.

**Success Criteria:**
- [ ] Python repo links to TypeScript
- [ ] Users can discover TypeScript version
- [ ] Relationship explained

#### Step 12.8: Archive TypeScript Code in Python Repo

**In Python repo:**
```bash
git checkout main

# Remove typescript/ directory
git rm -r typescript/
git commit -m "chore: remove TypeScript code (extracted to separate repo)

TypeScript port has been extracted to its own repository:
https://github.com/YOUR_USERNAME/recipe-scrapers-ts

See typescript-extraction branch for historical reference."

# Create archive branch
git checkout typescript-pre-extraction-v1.0.0
git checkout -b typescript-archive
git push origin typescript-archive
```

**Update .github/ARCHIVE_NOTICE.md:**
```markdown
# TypeScript Port Archive

The TypeScript port that was previously developed in this repository has been extracted to its own repository:

**New Location:** https://github.com/YOUR_USERNAME/recipe-scrapers-ts

This branch (`typescript-archive`) preserves the historical state for reference.
```

**Success Criteria:**
- [ ] TypeScript code removed from Python repo
- [ ] Archive branch preserved
- [ ] History maintained

---

## Success Metrics

### Phase A: Development Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Parity Rate** | 100% | Validation script |
| **Test Coverage** | >90% | Jest coverage |
| **Implementation Time** | 10-12 weeks | Project timeline |
| **Reference Efficiency** | Easy access | Developer feedback |
| **Test Data Sharing** | 0 duplication | Single source |

### Phase B: Extraction Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Extraction Time** | 1-2 weeks | Calendar time |
| **Data Loss** | 0% | Git history preserved |
| **Test Pass Rate** | 100% | CI after extraction |
| **Sync Reliability** | >99% | Daily sync success rate |
| **npm Downloads** | >50/week after 3mo | npm stats |
| **GitHub Stars** | >100 after 6mo | GitHub insights |

---

## Advantages of Hybrid Approach

### During Development (Phase A)

✅ **Easy Python Reference**
- Python code is right there
- Simple `cat ../recipe_scrapers/file.py`
- Git blame shows Python history

✅ **Shared Test Data**
- No duplication
- Same HTML/JSON for both
- Automatic parity validation

✅ **Validation**
- Run both versions side-by-side
- Compare outputs directly
- Ensure true 1:1 parity

✅ **Low Overhead**
- No sync setup needed
- No multiple repos to manage
- Simple development workflow

### After Extraction (Phase B)

✅ **Clean Separation**
- Independent repositories
- Standard structure
- Clear ownership

✅ **Independent Evolution**
- TypeScript can evolve separately
- Different release schedules
- TypeScript-specific features

✅ **Ecosystem Conventions**
- npm package in its own repo
- Standard JavaScript project
- Easy for contributors to understand

✅ **Discoverability**
- Own GitHub repo to star/fork
- Separate npm package
- Independent documentation

---

## Disadvantages & Mitigation

### Phase A Disadvantages

| Disadvantage | Mitigation |
|-------------|------------|
| **Temporary Python repo complexity** | Clear README explaining status |
| **Mixed signals for contributors** | Mark as "under development" |
| **Larger Python repo temporarily** | Will be removed in Phase B |

### Phase B Disadvantages

| Disadvantage | Mitigation |
|-------------|------------|
| **Test data sync required** | Automated daily sync |
| **Potential for drift** | Parity checks in CI |
| **Broken reference links** | Update all documentation |

---

## Decision Points

### When to Trigger Extraction

**Criteria:**
1. ✅ 100% parity validation passes
2. ✅ All 518 scrapers implemented
3. ✅ Test coverage >90%
4. ✅ Documentation complete
5. ✅ Maintainers approve
6. ✅ npm package name available

**Process:**
1. Review checklist
2. Get maintainer approval
3. Schedule extraction week
4. Execute Phase B steps
5. Announce extraction

### If Extraction Delayed

**Temporary maintenance in Python repo:**
- Keep developing in `typescript/`
- Continue validation
- Document delay reason
- Set new extraction target date

### If Extraction Cancelled

**Fall back to Approach 1:**
- Keep TypeScript in Python repo permanently
- Update documentation
- Set up long-term maintenance plan

---

## Communication Plan

### During Phase A (Development)

**Weekly Updates:**
- Progress on scraper implementation
- Parity validation results
- Blockers or challenges

**Milestones:**
- 100 scrapers: 20% complete
- 250 scrapers: 50% complete
- 500 scrapers: 95% complete
- 100% parity: Ready for extraction

### Phase B Announcement (Extraction)

**Pre-Extraction:**
```
📣 Announcement: TypeScript Port Extraction

After X months of development, our TypeScript port has achieved 100% parity
with the Python version. We're extracting it to its own repository for
independent evolution.

Timeline:
- Week 12: Extraction begins
- Week 13: npm package published
- Week 14: Documentation complete

New repository: [link]
```

**Post-Extraction:**
```
🎉 TypeScript Port Now Available!

We're excited to announce that recipe-scrapers is now available for TypeScript:

npm install recipe-scrapers

Repository: [link]
Documentation: [link]

The TypeScript version maintains 100% API parity with Python.

Thank you to everyone who contributed!
```

---

## Timeline

### Phase A: Development in Python Repo

| Week | Deliverable |
|------|-------------|
| 0 | Preparation, branch setup |
| 1-2 | Core utilities and parsers |
| 3-4 | Plugin system and abstract scraper |
| 5-6 | First 50 scrapers |
| 7-8 | Next 250 scrapers |
| 9 | Remaining scrapers |
| 10 | Validation and documentation |
| 11 | Pre-extraction preparation |

**Total: 11 weeks**

### Phase B: Extraction

| Week | Deliverable |
|------|-------------|
| 12 | Repository creation, code extraction, test data sync setup |
| 13 | CI/CD, publish to npm, update Python repo |

**Total: 2 weeks**

### Complete Timeline: 13 weeks

**Effort:**
- Phase A: 1 full-time developer
- Phase B: 0.5 full-time developer

---

## Comparison with Other Approaches

### vs Approach 1 (Permanent in Python Repo)

**Advantages over Approach 1:**
- ✅ Clean final state (separate repos)
- ✅ Independent evolution
- ✅ Better discoverability

**Shared with Approach 1:**
- ✅ Easy Python reference during dev
- ✅ Shared test data during dev

### vs Approach 2 (Separate from Start)

**Advantages over Approach 2:**
- ✅ Easier development (Python reference)
- ✅ No test data sync during development
- ✅ Validation easier

**Shared with Approach 2:**
- ✅ Final structure is same (separate repos)
- ✅ Independent npm package

### vs Approach 3 (Monorepo)

**Advantages over Approach 3:**
- ✅ Simpler tooling (no Turborepo needed)
- ✅ Standard final structure
- ✅ Clear extraction path

**Disadvantages vs Approach 3:**
- ❌ No Turborepo caching
- ❌ No coordinated releases (long-term)

---

## Conclusion

The hybrid approach provides the best of both worlds:

**During Development:**
- Python code easily accessible for reference
- Shared test data ensures parity
- Simple validation

**After Extraction:**
- Clean, independent TypeScript repository
- Standard npm package structure
- Automated test data sync maintains parity

**Timeline:** 13 weeks total (11 dev + 2 extraction)
**Best For:** Teams wanting optimal development experience with clean long-term structure

This is the **recommended approach** for porting recipe-scrapers to TypeScript.
