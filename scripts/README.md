# TypeScript Scraper Migration Scripts

Automated tools for migrating Python scrapers to TypeScript and managing registrations.

## Quick Start

### Migrate a Single Scraper
```bash
bun run migrate budgetbytes
```

### Migrate Multiple Scrapers
```bash
bun run migrate --batch budgetbytes,pinchofyum,minimalistbaker
```

### Auto-Register All Scrapers
```bash
bun run register
```

This updates both `src/scrapers/sites/index.ts` and `src/factory.ts` automatically.

### Test All Scrapers Work
```bash
bun run test:scrapers
```

---

## Scripts

### 1. `migrate-scraper.ts`
**Automatically converts Python scrapers to TypeScript**

```bash
bun scripts/migrate-scraper.ts <scraper-name>
bun scripts/migrate-scraper.ts --batch name1,name2,name3
```

**What it does:**
- Parses Python scraper file
- Detects implementation pattern:
  - Minimal (Schema.org only)
  - WPRM (WordPress Recipe Maker)
  - Custom methods (generates TODO stubs)
- Generates TypeScript code
- Updates `sites/index.ts` with exports

**Example:**
```bash
# Migrate single scraper
bun scripts/migrate-scraper.ts cookieandkate

# Migrate batch
bun scripts/migrate-scraper.ts --batch budgetbytes,skinnytaste,pinchofyum
```

### 2. `fix-sites-index.ts`
**Fixes exports in `src/scrapers/sites/index.ts`**

```bash
bun scripts/fix-sites-index.ts
```

**What it does:**
- Reads all scraper files in `src/scrapers/sites/`
- Extracts actual class names from each file
- Generates correct exports in alphabetical order
- Overwrites `sites/index.ts`

**When to use:**
- After manually creating scrapers
- When exports are out of sync
- After mass migration

### 3. `update-factory.ts`
**Registers all scrapers in the factory**

```bash
bun scripts/update-factory.ts
```

**What it does:**
- Reads all scraper files
- Extracts class names and hostnames
- Updates `src/factory.ts` with:
  - Import statements
  - `registerScraper()` calls
- Preserves other factory code

**When to use:**
- After adding new scrapers
- When registration is out of sync

### 4. `test-scrapers.ts`
**Tests that all scrapers can be instantiated**

```bash
bun scripts/test-scrapers.ts              # Test all
bun scripts/test-scrapers.ts allrecipes.com  # Test one
```

**What it does:**
- Loads each registered scraper
- Creates instance with test HTML
- Verifies `toJson()` works
- Reports success/failure

**Does NOT:**
- Validate against Python output
- Use real test data
- Check field accuracy

### 5. `validate-parity.ts`
**Validates TypeScript output matches Python** (requires Python installation)

```bash
bun run validate-parity                    # All domains
bun run validate-parity -- --domains allrecipes.com  # Specific domain
```

**What it does:**
- Loads test HTML from `tests/test_data/`
- Runs both Python and TypeScript scrapers
- Compares JSON outputs field-by-field
- Generates detailed diff report

**Requirements:**
- Python 3.x installed
- `recipe_scrapers` Python package installed (`pip install -e ../`)

---

## Complete Workflow

### Adding New Scrapers

**Option 1: Automated (Recommended)**
```bash
# 1. Migrate from Python
bun run migrate --batch cookieandkate,budgetbytes,skinnytaste

# 2. Auto-register (updates index.ts and factory.ts)
bun run register

# 3. Build
bun run build

# 4. Test
bun run test:scrapers

# 5. Validate (requires Python)
bun run validate-parity -- --domains cookieandkate.com
```

**Option 2: Manual**
```bash
# 1. Create scraper file manually
# src/scrapers/sites/myscraper.ts

# 2. Run registration scripts
bun run register

# 3. Build and test
bun run build
bun run test:scrapers
```

### After Manual Edits

If you manually edit scraper files or notice export mismatches:

```bash
# Fix exports and registration
bun run register

# Rebuild
bun run build

# Verify
bun run test:scrapers
```

---

## Troubleshooting

### "No matching export" errors

**Problem:** TypeScript can't find scraper exports

**Solution:**
```bash
bun run register  # Fix exports
bun run build     # Rebuild
```

### Scrapers not registered in factory

**Problem:** New scrapers don't work when called

**Solution:**
```bash
bun scripts/update-factory.ts
bun run build
```

### Class name mismatches

**Problem:** Export uses wrong class name

**Cause:** `sites/index.ts` generated class name doesn't match actual class

**Solution:**
```bash
bun scripts/fix-sites-index.ts  # Reads actual class names from files
```

---

## Script Details

### Detection Logic in `migrate-scraper.ts`

```typescript
// Minimal scraper (just host())
if (methods.length === 0 && !hasWprm) → minimal

// WPRM scraper (uses WPRMMixin)
if (hasWprm) → WPRM template with equipment()

// Custom methods
if (methods.length > 0) → stubs with TODO comments
```

### Class Name Generation in `fix-sites-index.ts`

**Reads from actual file:**
```typescript
const classMatch = content.match(/export class (\w+Scraper)/);
// Uses actual class name, not generated from filename
```

**Why this matters:**
- `foodnetwork.ts` → `FoodNetworkScraper` (not `FoodnetworkScraper`)
- `pinchofyum.ts` → `PinchOfYumScraper` (not `PinchofyumScraper`)

---

## npm Scripts

Convenient shortcuts in `package.json`:

```bash
bun run migrate              # Run migrate-scraper.ts
bun run register             # Run fix-sites-index + update-factory
bun run test:scrapers        # Run test-scrapers.ts
bun run validate-parity      # Run validate-parity.ts
```

All scripts support `--help` for detailed usage.
