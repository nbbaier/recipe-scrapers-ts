# TypeScript Port Plan: recipe-scrapers

## Executive Summary

This document outlines the requirements, approach, and considerations for creating a 1:1 TypeScript port of the recipe-scrapers Python library. The goal is to replicate all functionality while leveraging TypeScript's type safety and the Node.js ecosystem.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Port Requirements](#port-requirements)
3. [Component Mapping](#component-mapping)
4. [Dependencies & Ecosystem](#dependencies--ecosystem)
5. [Testing Strategy](#testing-strategy)
6. [Approach Discussion](#approach-discussion)
7. [Phased Implementation Plan](#phased-implementation-plan)
8. [Challenges & Considerations](#challenges--considerations)
9. [Recommendation](#recommendation)

---

## Project Overview

**recipe-scrapers** is a mature Python library that extracts recipe data from 518+ cooking websites using a consistent API. It leverages:

- **Schema.org parsing** as the primary extraction method
- **OpenGraph metadata** as fallback
- **Plugin architecture** for cross-cutting concerns
- **Data-driven testing** with HTML snapshots and expected JSON outputs
- **Minimal site-specific code** (most scrapers are 8-40 lines)

### Key Statistics
- **518 supported websites**
- **~50K lines of Python code**
- **Comprehensive test suite** with parallel execution
- **Active maintenance** with recent site additions
- **Type hints** throughout the codebase

---

## Port Requirements

### 1. Core Architecture Components

#### 1.1 Base Scraper (`AbstractScraper`)
**Current (Python):** `recipe_scrapers/_abstract.py` (204 lines)

**Requirements:**
- Abstract base class with 20+ methods (title, ingredients, instructions, etc.)
- BeautifulSoup integration for HTML parsing
- Plugin attachment system (runtime method wrapping)
- JSON serialization with error handling
- URL manipulation utilities

**TypeScript Challenges:**
- Python's dynamic method wrapping vs TypeScript decorators
- Runtime type checking for method introspection
- BeautifulSoup equivalent needs evaluation

#### 1.2 Schema.org Parser (`SchemaOrg`)
**Current (Python):** `recipe_scrapers/_schemaorg.py` (378 lines)

**Requirements:**
- Parse JSON-LD, Microdata, and RDFa formats
- Extract Recipe, Person, Website, and AggregateRating entities
- Handle nested `@graph` structures
- Parse ISO 8601 durations (PT1H30M → minutes)
- Flexible data extraction with fallbacks
- Reference resolution (Person entities by @id)

**TypeScript Challenges:**
- Finding equivalent to Python's `extruct` library
- Type safety for dynamic schema.org structures
- ISO 8601 duration parsing

#### 1.3 OpenGraph Parser (`OpenGraph`)
**Current (Python):** `recipe_scrapers/_opengraph.py`

**Requirements:**
- Extract og:title, og:image, og:description, etc.
- Fallback mechanism when Schema.org fails

**TypeScript Challenges:**
- Straightforward; should map easily to TypeScript

#### 1.4 Plugin System
**Current (Python):** `recipe_scrapers/plugins/` (7 plugins)

**Plugins:**
1. **ExceptionHandlingPlugin** - Graceful error handling with fallbacks
2. **SchemaOrgFillPlugin** - Auto-fills from schema.org data
3. **OpenGraphFillPlugin** - Fallback to OpenGraph
4. **HTMLTagStripperPlugin** - Strips HTML from text
5. **NormalizeStringPlugin** - Normalizes whitespace
6. **OpenGraphImageFetchPlugin** - Fetches images
7. **StaticValueExceptionHandlingPlugin** - Handles static values

**Requirements:**
- Decorator/wrapper pattern for method interception
- Configurable plugin ordering
- Should run check (plugin applies to specific methods/hosts)
- Per-scraper instance initialization

**TypeScript Challenges:**
- Python's runtime method wrapping is flexible; TypeScript needs careful design
- Consider: Decorators, Proxy pattern, or higher-order functions

#### 1.5 Utilities (`_utils.py`)
**Requirements:**
- ISO 8601 duration parsing → minutes
- Yield parsing (e.g., "4-6 servings" → "4-6")
- String normalization (whitespace, newlines)
- CSV to tags conversion
- Diet name formatting (e.g., "http://schema.org/VegetarianDiet" → "Vegetarian")

**TypeScript Challenges:**
- ISO 8601 parsing (use library like `luxon` or `date-fns`)
- Regex patterns should port directly

#### 1.6 Ingredient Grouping (`_grouping_utils.py`)
**Requirements:**
- Parse ingredient lists with section headers
- Group ingredients by purpose (e.g., "For the sauce:", "For the topping:")
- Return structured `IngredientGroup` objects

**TypeScript Challenges:**
- Straightforward; define interfaces for groups

#### 1.7 Exceptions (`_exceptions.py`)
**Requirements:**
- Custom exception classes:
  - `RecipeScrapersExceptions` (base)
  - `NoSchemaFoundInWildMode`
  - `SchemaOrgException`
  - `ElementNotFoundInHtml`
  - `WebsiteNotImplementedError`

**TypeScript Challenges:**
- TypeScript custom error classes are straightforward

#### 1.8 Factory Pattern (`_factory.py`)
**Requirements:**
- Registry of scrapers by domain
- Automatic scraper selection based on URL
- Wild mode (tries schema.org on unknown sites)

**TypeScript Challenges:**
- Static registry mapping; straightforward

### 2. Site-Specific Scrapers

**Current:** 518 scraper implementations

**Requirements:**
- Each scraper extends `AbstractScraper`
- Minimal code (most inherit all behavior from schema.org)
- Override methods only when site-specific logic needed
- Examples:
  - `allrecipes.py` - 8 lines (pure schema.org)
  - `bbcgoodfood.py` - 20 lines (custom ingredient grouping)
  - `seriouseats.py` - Custom image extraction logic

**TypeScript Approach:**
- Create TypeScript class for each scraper
- Maintain 1:1 mapping of overridden methods
- Priority: Port most popular sites first, then expand

### 3. Testing Infrastructure

**Current:** Data-driven tests with HTML snapshots

**Requirements:**
- Test data structure:
  ```
  tests/test_data/[domain]/
    ├── [recipe-name].testhtml  # HTML snapshot
    └── [recipe-name].json      # Expected output
  ```
- Mandatory fields tested: `author`, `canonical_url`, `host`, `image`, `ingredients`, `instructions_list`, `language`, `site_name`, `title`, `total_time`, `yields`
- Optional fields: `category`, `cuisine`, `description`, `nutrients`, etc.
- Parallel test execution
- Code coverage tracking

**TypeScript Approach:**
- Jest or Vitest for testing
- Reuse existing test data (HTML + JSON files)
- Write test generator to create tests from test data
- Aim for same coverage requirements

### 4. Configuration & Settings

**Current:** `recipe_scrapers/settings/`

**Requirements:**
- Environment variable-based configuration
- Plugin ordering
- Log levels
- Default vs custom settings

**TypeScript Approach:**
- Use environment variables or config files
- Define settings interface
- Validation with libraries like `zod`

### 5. Build & Distribution

**Current (Python):**
- setuptools with pyproject.toml
- Published to PyPI
- Type hints with py.typed marker

**TypeScript Requirements:**
- Package manager: npm/yarn/pnpm
- Build tool: TypeScript compiler + bundler (Rollup/tsup)
- Distribution: npm registry
- Dual CJS/ESM builds
- Type definitions (.d.ts files)
- Documentation generation (TypeDoc)

---

## Component Mapping

| Python Component | TypeScript Equivalent | Library/Approach |
|-----------------|----------------------|------------------|
| BeautifulSoup | cheerio or jsdom | cheerio (jQuery-like), jsdom (full DOM) |
| extruct | Custom implementation or microdata-node | Need research; may need custom parser |
| isodate | luxon or date-fns | ISO 8601 duration parsing |
| requests | node-fetch or axios | HTTP client (if needed) |
| unittest | Jest or Vitest | Modern test frameworks |
| mypy | TypeScript compiler | Built-in type checking |
| black | Prettier | Code formatting |
| flake8 | ESLint | Linting |
| pre-commit | husky + lint-staged | Git hooks |
| mkdocs | TypeDoc or Docusaurus | Documentation |

---

## Dependencies & Ecosystem

### Core Dependencies

1. **HTML Parsing:** `cheerio` (lightweight) or `jsdom` (full DOM)
   - **Recommendation:** cheerio for performance, jsdom if full DOM needed

2. **Structured Data Extraction:**
   - **Challenge:** No direct extruct equivalent
   - **Options:**
     - `microdata-node` (Microdata only)
     - `jsonld` (JSON-LD parsing)
     - Custom parser using cheerio + JSON-LD parsing
   - **Recommendation:** Combine `jsonld` for JSON-LD + custom Microdata parser

3. **ISO 8601 Duration Parsing:**
   - `luxon` (modern, powerful)
   - `date-fns` (lightweight, tree-shakeable)
   - **Recommendation:** `luxon` for comprehensive ISO 8601 support

4. **HTTP Client (Optional):**
   - `node-fetch` (standard fetch API)
   - `axios` (feature-rich)
   - **Recommendation:** `node-fetch` for compatibility

### Development Dependencies

- **TypeScript:** 5.x
- **Testing:** Jest or Vitest
- **Linting:** ESLint with TypeScript plugins
- **Formatting:** Prettier
- **Git Hooks:** husky + lint-staged
- **Documentation:** TypeDoc

---

## Testing Strategy

### 1. Reuse Existing Test Data

**Advantages:**
- 518+ sites already have HTML snapshots and expected JSON
- Ensures true 1:1 parity with Python version
- No need to recreate test data

**Implementation:**
- Read `.testhtml` files as test fixtures
- Parse expected JSON from `.json` files
- Generate tests dynamically from test_data directory
- Example test structure:
  ```typescript
  describe('AllRecipes Scraper', () => {
    it('should extract recipe correctly', async () => {
      const html = readFileSync('tests/test_data/allrecipes.com/recipe.testhtml');
      const expected = JSON.parse(readFileSync('tests/test_data/allrecipes.com/recipe.json'));

      const scraper = new AllRecipesScraper(html, 'https://allrecipes.com/recipe/...');

      expect(scraper.title()).toBe(expected.title);
      expect(scraper.ingredients()).toEqual(expected.ingredients);
      // ... test all mandatory fields
    });
  });
  ```

### 2. Test Organization

```
src/
  scrapers/
    __tests__/
      allrecipes.test.ts
      bbcgoodfood.test.ts
      ...
tests/
  test_data/           # Copied from Python repo
    allrecipes.com/
    bbcgoodfood.com/
    ...
  utils/
    test-generator.ts  # Auto-generates tests from test_data
```

### 3. Coverage Requirements

- Aim for 90%+ code coverage
- Test all mandatory fields for each scraper
- Test error handling and edge cases
- Test plugin system thoroughly

### 4. CI/CD

- GitHub Actions
- Test on multiple Node.js versions (18, 20, 22)
- Test on Linux, macOS, Windows
- Automated npm publishing

---

## Approach Discussion

### Option 1: Work in Python Repo (Reference-Driven Development)

**Pros:**
- **Easy reference:** Python code is right there for comparison
- **Test data access:** HTML snapshots and expected JSON already present
- **Git history:** Can see how issues were fixed in Python version
- **Validation:** Can run both versions side-by-side to verify parity
- **Single source of truth:** Test data updates benefit both versions

**Cons:**
- **Repository complexity:** Mixing Python and TypeScript in one repo is unusual
- **Build/CI complexity:** Need to support both Python and TypeScript workflows
- **Dependency conflicts:** package.json + pyproject.toml in same repo
- **Developer confusion:** Contributors may be unclear which version to work on
- **Future maintenance:** Hard to version independently

**Project Structure (if in Python repo):**
```
recipe-scrapers/
├── recipe_scrapers/        # Python source
├── typescript/             # TypeScript port
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── tests/                  # Shared test data
│   └── test_data/
├── pyproject.toml
└── README.md
```

---

### Option 2: Separate Repository (Clean Slate)

**Pros:**
- **Clean separation:** Each repo has single responsibility
- **Independent versioning:** Can evolve TypeScript version independently
- **Clear ownership:** Distinct communities for Python vs TypeScript
- **Standard structure:** Follows ecosystem conventions
- **Easier CI/CD:** Single language per repo
- **npm/PyPI separation:** Natural publishing workflows

**Cons:**
- **Test data duplication:** Need to copy test_data/ directory
- **Synchronization overhead:** Updates to test data must be synced
- **Harder comparison:** Need to switch repos to compare implementations
- **Discovery:** Users may not find the TypeScript version
- **Duplicate issues:** Same bugs reported in both repos

**Project Structure (separate repo):**
```
recipe-scrapers-ts/
├── src/
│   ├── scrapers/
│   │   ├── abstract.ts
│   │   ├── schema-org.ts
│   │   ├── opengraph.ts
│   │   └── sites/
│   │       ├── allrecipes.ts
│   │       ├── bbcgoodfood.ts
│   │       └── ...
│   ├── plugins/
│   ├── utils/
│   └── index.ts
├── tests/
│   ├── test_data/          # Copied from Python repo
│   └── scrapers/
├── package.json
├── tsconfig.json
└── README.md
```

---

### Option 3: Monorepo (Best of Both Worlds)

**Pros:**
- **Shared test data:** Single source of truth
- **Cross-referencing:** Easy to compare implementations
- **Unified CI:** Can test both versions together
- **Coordinated releases:** Can sync breaking changes
- **Developer experience:** Tools like Turborepo/Nx make this manageable

**Cons:**
- **Tooling complexity:** Requires monorepo tools (Turborepo, Nx, Lerna)
- **Build complexity:** Coordinating builds across languages
- **Repo size:** Larger clone size
- **Learning curve:** Contributors need to understand monorepo structure

**Project Structure (monorepo):**
```
recipe-scrapers-monorepo/
├── packages/
│   ├── python/
│   │   ├── recipe_scrapers/
│   │   └── pyproject.toml
│   └── typescript/
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── tests/
│   └── test_data/          # Shared between both
├── package.json            # Root workspace config
└── turbo.json              # Turborepo config
```

---

### Option 4: Start in Python Repo, Extract Later

**Hybrid Approach:**

**Phase 1 (Development):**
- Work in Python repo under `typescript/` directory
- Easy reference and validation
- Use shared test data

**Phase 2 (Release):**
- Extract TypeScript code to separate repo
- Set up automated test data sync from Python repo
- Publish to npm as standalone package

**Pros:**
- **Best development experience:** Easy reference during port
- **Clean final state:** Separate repos for production
- **Validation:** Can ensure true 1:1 parity before separating
- **Flexibility:** Can decide based on what works

**Cons:**
- **Extra work:** Migration step required
- **Temporary state:** Git history gets split
- **Timing:** When to extract is a judgment call

---

## Phased Implementation Plan

### Phase 1: Foundation (Weeks 1-2)

**Deliverables:**
- [ ] Set up TypeScript project structure
- [ ] Identify and integrate dependencies (cheerio, jsonld, luxon)
- [ ] Implement core utilities (`_utils.ts`)
- [ ] Implement custom exceptions
- [ ] Implement basic SchemaOrg parser (JSON-LD only)
- [ ] Implement OpenGraph parser
- [ ] Write unit tests for utilities and parsers

**Validation:**
- Unit tests pass
- Can parse schema.org JSON-LD from sample HTML

### Phase 2: Core Architecture (Weeks 3-4)

**Deliverables:**
- [ ] Implement AbstractScraper base class
- [ ] Implement plugin system architecture
- [ ] Implement all 7 plugins
- [ ] Implement factory pattern and scraper registry
- [ ] Write tests for abstract scraper and plugins

**Validation:**
- Plugin system works correctly
- Can create scraper instances via factory
- Base functionality tested

### Phase 3: Initial Scrapers (Weeks 5-6)

**Deliverables:**
- [ ] Port 10 high-priority scrapers (AllRecipes, Food Network, Serious Eats, etc.)
- [ ] Create test infrastructure that uses existing test_data
- [ ] Validate 1:1 parity with Python version
- [ ] Document API with TypeDoc

**Validation:**
- All tests for ported scrapers pass
- Output matches Python version exactly
- API documentation generated

### Phase 4: Comprehensive Port (Weeks 7-12)

**Deliverables:**
- [ ] Port all 518 scrapers (automate where possible)
- [ ] Implement Microdata and RDFa parsing (complete schema.org support)
- [ ] Ingredient grouping functionality
- [ ] Settings system
- [ ] Complete test coverage

**Validation:**
- All scrapers have passing tests
- Code coverage >90%
- All test data validated

### Phase 5: Ecosystem & Release (Weeks 13-14)

**Deliverables:**
- [ ] Set up CI/CD pipeline
- [ ] Publish to npm
- [ ] Create comprehensive documentation
- [ ] Write migration guide for Python users
- [ ] Set up GitHub issues/discussions

**Validation:**
- npm package installable and usable
- Documentation complete
- CI passing on all platforms

### Phase 6: Maintenance & Sync (Ongoing)

**Deliverables:**
- [ ] Process for syncing new scrapers from Python version
- [ ] Issue triage and bug fixes
- [ ] Performance optimization
- [ ] Community building

---

## Challenges & Considerations

### 1. Technical Challenges

#### Schema.org Parsing
**Challenge:** Python's `extruct` library is comprehensive and well-tested. No direct TypeScript equivalent exists.

**Solutions:**
- **JSON-LD:** Use `jsonld` npm package (mature, spec-compliant)
- **Microdata:** Write custom parser with cheerio (moderate complexity)
- **RDFa:** Write custom parser or find library (higher complexity)
- **Pragmatic approach:** Start with JSON-LD only (covers 90% of sites), add Microdata/RDFa later

#### Plugin System
**Challenge:** Python's dynamic method wrapping is more flexible than TypeScript's type system.

**Solutions:**
- **TypeScript Decorators:** Experimental but powerful
- **Proxy Pattern:** Intercept method calls dynamically
- **Higher-Order Functions:** Wrap methods functionally
- **Recommendation:** Use Proxy pattern for flexibility + type safety

#### ISO 8601 Duration Parsing
**Challenge:** Converting "PT1H30M" → 90 minutes

**Solutions:**
- Use `luxon`: `Duration.fromISO('PT1H30M').as('minutes')`
- Very straightforward

### 2. Maintenance Challenges

#### Keeping Scrapers in Sync
**Challenge:** Python version actively maintained with new sites added regularly.

**Solutions:**
- **Automated sync:** Script to detect new scrapers in Python repo
- **Shared test data:** Git submodule or automated copying
- **Community:** Encourage contributors to add sites to both versions
- **Documentation:** Clear process for adding new scrapers

#### Version Parity
**Challenge:** Ensuring TypeScript version has same features as Python.

**Solutions:**
- **Feature flags:** Enable features as they're ported
- **Version numbering:** Use 0.x until parity reached, then sync versions
- **Compatibility matrix:** Document which features are available

### 3. Ecosystem Differences

#### Python vs Node.js
- **Python:** Synchronous by default
- **Node.js:** Asynchronous by default

**Consideration:**
- Core parsing can be synchronous (HTML → data)
- HTTP fetching should be async
- Offer both sync and async APIs:
  ```typescript
  // Sync API (existing HTML)
  const scraper = scrapeHtml(html, url);
  scraper.title(); // Returns string

  // Async API (fetch from URL)
  const scraper = await scrapeMe(url);
  scraper.title(); // Returns string
  ```

### 4. Type Safety Opportunities

**Advantages of TypeScript:**
- Strongly typed recipe interfaces
- Compile-time catching of errors
- Better IDE support
- Self-documenting code

**Example:**
```typescript
interface Recipe {
  title: string;
  author?: string;
  ingredients: string[];
  instructions: string;
  totalTime?: number; // minutes
  yields?: string;
  image?: string;
  // ... all fields with proper types
}

interface RecipeScraper {
  title(): string;
  author(): string | undefined;
  ingredients(): string[];
  // ... all methods with proper return types
}
```

---

## Recommendation

### Recommended Approach: **Option 4 (Start in Python Repo, Extract Later)**

**Rationale:**

1. **Development Phase (In Python Repo):**
   - Work in `typescript/` directory within this repository
   - Easy reference to Python implementation
   - Shared test data automatically
   - Can validate true 1:1 parity
   - Low overhead to get started

2. **Why This Works Best:**
   - You explicitly said: "because I'm aiming for a port from the python, it seems like I would want to do the work where there is reference"
   - Having both versions side-by-side during development is invaluable
   - Shared test data ensures parity
   - Can run both versions to compare outputs
   - Git blame/history shows how issues were solved in Python

3. **Future Extraction (To Separate Repo):**
   - Once TypeScript port is complete and validated
   - Extract to `recipe-scrapers-ts` repository
   - Set up automated test data sync (Git submodule or CI job)
   - Publish to npm independently
   - Maintain cross-references in both repos

### Implementation Steps

#### Step 1: Set Up in Python Repo

```bash
cd recipe-scrapers
mkdir -p typescript/src typescript/tests
npm init -y
# Set up TypeScript, Jest, etc.
```

#### Step 2: Development Workflow

- Python code at `recipe_scrapers/`
- TypeScript code at `typescript/src/`
- Shared test data at `tests/test_data/`
- TypeScript tests at `typescript/tests/`

#### Step 3: Validation

- Compare outputs: `python test.py` vs `npm test`
- Ensure JSON outputs match exactly
- Document any intentional differences

#### Step 4: Extract When Ready

- Create new repo: `recipe-scrapers-ts`
- Move `typescript/` contents to new repo root
- Copy `tests/test_data/` to new repo
- Set up Git submodule or automated sync
- Update both READMEs with cross-links

### Directory Structure (Phase 1)

```
recipe-scrapers/
├── recipe_scrapers/           # Python source
├── typescript/                # TypeScript port (NEW)
│   ├── src/
│   │   ├── scrapers/
│   │   │   ├── abstract.ts
│   │   │   ├── schema-org.ts
│   │   │   ├── opengraph.ts
│   │   │   └── sites/
│   │   ├── plugins/
│   │   ├── utils/
│   │   └── index.ts
│   ├── tests/
│   │   └── scrapers/
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── README.md
├── tests/                     # Shared test data
│   └── test_data/
├── pyproject.toml
└── README.md                  # Update to mention TypeScript port
```

---

## Next Steps

1. **Get Feedback:** Discuss this plan with maintainers/community
2. **Set Up TypeScript Environment:** Initialize package.json, tsconfig, etc.
3. **Spike on Schema.org Parsing:** Validate JSON-LD parsing approach
4. **Implement Phase 1:** Build foundation and validate approach
5. **Iterate:** Adjust plan based on learnings

---

## Open Questions

1. **Licensing:** Should TypeScript port have same MIT license?
2. **Governance:** Same maintainers or separate team?
3. **Versioning:** Sync version numbers or independent?
4. **npm package name:** `recipe-scrapers` (if available) or `recipe-scrapers-ts`?
5. **Browser support:** Should TypeScript version work in browsers, or Node.js only?
6. **Performance targets:** Any specific performance goals vs Python version?

---

## Conclusion

Porting recipe-scrapers to TypeScript is a substantial but achievable project. The recommended approach of starting development within the Python repository provides the best development experience while maintaining flexibility for future extraction. The comprehensive test suite and data-driven testing approach ensure that 1:1 parity can be validated throughout the process.

**Estimated Timeline:** 14 weeks for complete port + 2 weeks buffer = **4 months** to production-ready TypeScript version

**Key Success Factors:**
1. Reusing existing test data
2. Incremental validation against Python version
3. Starting with core architecture before bulk scraper porting
4. Strong TypeScript types for better DX
5. Clear communication about port status and parity

This port will bring the powerful recipe-scrapers functionality to the TypeScript/Node.js ecosystem while maintaining the quality and comprehensiveness of the Python original.
