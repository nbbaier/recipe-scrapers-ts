# TypeScript/Python Parity Validation Issues

**Date:** 2025-11-19
**Test Run:** `bun run scripts/validate-parity.ts -- --implemented-only`
**Results:** 28 passed / 53 failed (34.57% pass rate)

## Overview

This document details the root causes of parity validation failures between the TypeScript and Python implementations of recipe-scrapers. The `--implemented-only` flag now allows testing only the implemented scrapers without failing on unimplemented ones.

## Root Causes

### 1. `null` vs `undefined` Serialization ⚠️

**Problem:** Python and TypeScript handle missing values differently in JSON serialization.

**Python:**

```python
# Returns None, which serializes as null
def ratings(self):
    return None

# JSON output: {"ratings": null}
```

**TypeScript:**

```typescript
// Returns undefined, which is omitted from JSON
ratings(): number | null {
    return undefined;
}

// JSON output: {} (ratings field omitted entirely)
```

**Impact:** Fields like `ratings`, `category`, `yields` etc. show differences

**Fix:** Modify `toJson()` to explicitly convert `undefined` → `null` before serialization

---

### 2. `ingredients()` Return Type Inconsistency 🔴

**Problem:** Python scrapers are inconsistent in their return types. Some return `list[str]` (correct), others return `str` (incorrect but in production).

**Python Example (cookinglight.com):**

```python
# recipe_scrapers/cookinglight.py:10-14
def ingredients(self):
    ingredients = self.soup.find("div", {"class": "ingredients"}).ul.find_all("li")
    return "\n".join([normalize_string(ingredient.get_text()) for ingredient in ingredients])
```

**Output:** `"ingredient1\ningredient2\ningredient3"` (string)

**TypeScript (following type definition):**

```typescript
ingredients(): string[] {
    // Returns array from Schema.org
    return ["ingredient1", "ingredient2", "ingredient3"];
}
```

**Output:** `["ingredient1", "ingredient2", "ingredient3"]` (array)

**Impact:** Major - affects many test cases

**Affected Sites:** cookinglight.com, and likely others with custom overrides

**Fix:** Add custom overrides in TypeScript scrapers to return string where Python does

---

### 3. `instructions()` Formatting Differences 🔴

**Problem:** Python preserves section headers (e.g., "Step 1", "Build your roux"), TypeScript strips them.

**Python Example (pinchofyum.com):**

```json
{
   "instructions": "Sauté garlic and onion\nIn a large soup pot...\nBuild your roux\nAdd remaining...",
   "instructions_list": [
      "Sauté garlic and onion",
      "In a large soup pot...",
      "Build your roux",
      "Add remaining..."
   ]
}
```

**TypeScript:**

```json
{
   "instructions": "In a large soup pot...\nAdd remaining...",
   "instructions_list": ["In a large soup pot...", "Add remaining..."]
}
```

**Impact:** Major - affects instruction text comparison

**Fix:** Preserve section headers in TypeScript Schema.org parser

---

### 4. `ingredient_groups.ingredients` Format Inconsistency 🔴

**Problem:** Similar to issue #2 but within ingredient groups.

**Python:**

```json
{
   "ingredient_groups": [
      {
         "ingredients": "1/2 cup beans\n1 teaspoon oil\n1/2 cup tomatoes",
         "purpose": null
      }
   ]
}
```

**TypeScript:**

```json
{
   "ingredient_groups": [
      {
         "ingredients": ["1/2 cup beans", "1 teaspoon oil", "1/2 cup tomatoes"]
      }
   ]
}
```

**Impact:** Major - affects ingredient group parsing

**Fix:** Ensure IngredientGroup serialization matches Python output format

---

### 5. Missing `purpose` Field in ingredient_groups ⚠️

**Problem:** When `purpose` is `null` in Python, it's explicitly included. In TypeScript when `undefined`, it's omitted.

**Python:** `{"purpose": null}`
**TypeScript:** `{}` (field omitted)

**Impact:** Minor - cosmetic difference

**Fix:** Same as issue #1 - convert `undefined` → `null`

---

## Proposed Solutions

### Option 1: TypeScript Matches Python (Recommended for v1.0 parity) ✅

**Goal:** Achieve 100% parity with Python for initial release

**Changes Required:**

1. **Update `toJson()` serialization:**

   ```typescript
   toJson(): Partial<Recipe> {
       const jsonDict: Record<string, unknown> = {};

       for (const method of methodsToCall) {
           try {
               let result = (func as () => unknown).call(this);
               // Convert undefined to null for JSON serialization parity
               if (result === undefined) {
                   result = null;
               }
               jsonDict[fieldName] = result;
           } catch (_error) {
               // Skip fields that throw exceptions
           }
       }

       return jsonDict as Partial<Recipe>;
   }
   ```

2. **Add custom scraper overrides** for sites like cookinglight:

   ```typescript
   // cookinglight.ts
   ingredients(): string {  // Return string, not string[]
       const ingredients = this.$('div.ingredients ul li')
           .map((_, el) => this.$(el).text().trim())
           .get();
       return ingredients.join('\n');  // Join with newlines
   }
   ```

3. **Preserve section headers** in Schema.org instructions parsing

4. **Update IngredientGroup serialization** to match Python format

**Pros:**

- Achieves 100% parity with Python
- Can validate against all existing Python test data
- Safe for initial v1.0 release

**Cons:**

- Types don't match actual return values (ingredients declared as string[] but returns string)
- Less idiomatic TypeScript/JavaScript

---

### Option 2: Fix Python to Match Types (Long-term improvement)

**Goal:** Make Python follow its own type hints

**Changes Required:**

1. Update Python scrapers to consistently return `list[str]` for `ingredients()`
2. Update all test data to match
3. Fix type hints across Python codebase

**Pros:**

- Consistent types
- Better developer experience
- TypeScript can use proper types

**Cons:**

- Requires changes to stable Python codebase
- Breaking change for Python users
- Large amount of test data to update

---

### Option 3: Compatibility Mode (Middle ground)

**Goal:** Keep TypeScript types correct, add compatibility layer

**Implementation:**

```typescript
interface ScrapeOptions {
    pythonCompatMode?: boolean;  // Default: false
}

toJson(options?: ScrapeOptions): Partial<Recipe> {
    const result = this._generateJson();

    if (options?.pythonCompatMode) {
        // Convert arrays to strings where Python does
        if (Array.isArray(result.ingredients)) {
            result.ingredients = result.ingredients.join('\n');
        }
        // Convert undefined to null
        Object.keys(result).forEach(key => {
            if (result[key] === undefined) result[key] = null;
        });
    }

    return result;
}
```

**Pros:**

- Clean types by default
- Can still validate parity when needed
- Clear migration path

**Cons:**

- More complexity
- Two modes to maintain

---

## Recommendation

**For v1.0 (current goal):** Implement **Option 1**

- Focus: Achieve 100% parity with Python
- Timeline: Can be done quickly
- Risk: Low - matches existing behavior

**For v2.0 (after npm extraction):** Migrate to **Option 3** or **Option 2**

- Clean up types
- Add compatibility mode for Python parity validation
- Document breaking changes

---

## Testing Strategy

### Current Validation

```bash
# Run parity tests on implemented scrapers only
bun run scripts/validate-parity.ts -- --implemented-only

# Validate specific domains
bun run scripts/validate-parity.ts -- --domains cookinglight.com cafedelites.com
```

### Expected Outcomes After Fixes

- **Phase 1:** Fix serialization (null/undefined) → ~60% pass rate
- **Phase 2:** Fix custom scraper overrides → ~85% pass rate
- **Phase 3:** Fix instructions formatting → ~95% pass rate
- **Phase 4:** Polish remaining edge cases → 100% pass rate

---

## Files to Modify

### High Priority

1. `typescript/src/scrapers/abstract.ts` - Update `toJson()` method
2. `typescript/src/scrapers/sites/cookinglight.ts` - Add custom overrides
3. `typescript/src/parsers/schema-org.ts` - Preserve section headers

### Medium Priority

4. Other site scrapers with custom ingredient/instruction parsing
5. `typescript/src/types/recipe.ts` - Update docs about string vs array

### Low Priority

6. Test suite updates
7. Documentation updates

---

## Next Steps

1. ✅ Document `--implemented-only` flag (completed)
2. ⬜ Implement null/undefined serialization fix
3. ⬜ Add custom overrides to failing scrapers
4. ⬜ Fix instructions formatting
5. ⬜ Re-run validation and iterate
6. ⬜ Achieve 100% parity

---

## Validation Command Reference

```bash
# Test all domains (will show many failures for unimplemented)
bun run scripts/validate-parity.ts

# Test only implemented scrapers (recommended)
bun run scripts/validate-parity.ts -- --implemented-only

# Test specific domain
bun run scripts/validate-parity.ts -- --domains allrecipes.com

# Test multiple domains
bun run scripts/validate-parity.ts -- --domains allrecipes.com foodnetwork.com bonappetit.com

# Build first if code changed
bun run build && bun run scripts/validate-parity.ts -- --implemented-only
```

---

## Appendix: Example Failures

### cookinglight.com/cookinglight.testhtml

```diff
- ingredients (Python):  "1/2 cup beans\n1 teaspoon oil"
+ ingredients (TypeScript): ["1/2 cup beans", "1 teaspoon oil"]

- ingredient_groups.ingredients (Python): "1/2 cup beans\n1 teaspoon oil"
+ ingredient_groups.ingredients (TypeScript): ["1/2 cup beans", "1 teaspoon oil"]

- ratings (Python): null
+ ratings (TypeScript): undefined
```

### pinchofyum.com (instructions formatting)

```diff
- instructions (Python): "Sauté garlic and onion\nIn a large soup pot...\nBuild your roux\nAdd remaining..."
+ instructions (TypeScript): "In a large soup pot...\nAdd remaining..."

- instructions_list (Python): ["Sauté garlic and onion", "In a large soup pot...", "Build your roux", ...]
+ instructions_list (TypeScript): ["In a large soup pot...", "Add remaining..."]
```

### cafedelites.com (ingredient_groups)

```diff
- ingredient_groups (Python): [
    {"ingredients": ["1/2 cup sugar", "1/2 tsp cinnamon"], "purpose": "COATING"},
    {"ingredients": ["4 oz butter", "1 cup water", ...], "purpose": "CHURROS"}
  ]
+ ingredient_groups (TypeScript): [
    {"ingredients": ["1/2 cup sugar", "1/2 tsp cinnamon", "4 oz butter", "1 cup water", ...]}
  ]
```

_Note: Grouping logic not correctly splitting by purpose_

---

**Report Generated:** 2025-11-19
**For Questions:** Reference this document in TypeScript port discussions
