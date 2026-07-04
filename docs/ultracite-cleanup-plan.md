# Ultracite Cleanup Plan

Follow-up work after the Biome → Ultracite migration (commits `43ac5f1`..`f53cc0c`).
The migration is done and green (268 unit tests pass). This file tracks the
remaining lint findings that Ultracite's stricter ruleset surfaced but that
`ultracite fix` could not auto-resolve.

**Baseline:** `git log` — the four migration commits ending at
`chore: add Ultracite auto-fix hooks and refresh ignore rules`.

**Current state:** `bun x ultracite check` reports **88 errors + 9 warnings**.

**Policy decisions already made (see `biome.jsonc`):**

- `noBarrelFile` — **off** (published library; barrel `index.ts` files are the public API).
- `noExplicitAny` — **warn** (dynamic scraped JSON-LD); not counted below.
- `noExportedImports` — **off for `src/scrapers/sites/index.ts`** (registry needs the
  scrapers in scope for `SCRAPER_REGISTRY` and re-exports them).
- Scripts and tests are held to the **same bar** as `src/` — fix everywhere.

Suggested workflow: fix **one rule category per commit** so history stays readable.
The post-edit hook runs `bun run fix` after each edit, so mechanical reformatting
is applied automatically. Re-run `bun run test` after each category.

---

## Tier 1 — mechanical / low-risk (do first)

These are near-mechanical; verify behavior is unchanged but risk is low.

### `useReadonlyClassProperties` (16)
Mark class fields that are never reassigned as `readonly`.
- `scripts/compare-outputs.ts` (6)
- `scripts/validate-parity.ts` (6)
- `src/parsers/schema-org.ts` (4)

### `noUselessCatchBinding` (4)
Drop the unused `catch (e)` binding → `catch {}`.
- `src/parsers/schema-org.ts` (1)
- `src/plugins/opengraph-image-fetch.ts` (1)
- `src/scrapers/abstract.ts` (1)
- `tests/unit/parsers/schema-org.test.ts` (1)

### `useConsistentArrayType` (3)
Normalize `Array<T>` ↔ `T[]` to the preset's preferred form.
- `src/scrapers/abstract.ts` (2)
- `src/utils/yields.ts` (1)

### `useAtIndex` (3)
Use `.at()` instead of index arithmetic (e.g. `arr[arr.length - 1]` → `arr.at(-1)`).
- `src/plugins/best-image.ts` (2)
- `src/utils/url.ts` (1)

### `noDelete` (4)
Replace `delete obj.k` with reassignment / destructuring omission.
- `scripts/compare-outputs.ts` (2)
- `scripts/validate-parity.ts` (2)

### Singletons (1 each)
- `useConsistentTypeDefinitions` — `scripts/validate-parity.ts` (interface vs type alias)
- `useConsistentMemberAccessibility` — `src/parsers/schema-org.ts`
- `useCollapsedIf` — `src/plugins/best-image.ts` (merge nested `if`)
- `noParameterAssign` — `src/parsers/schema-org.ts` (copy to local instead of reassigning param)
- `noVoid` — `scripts/migrate-scraper.ts`
- `noUnusedExpressions` — `scripts/generate-dashboard.ts`
- `noEmptyBlockStatements` — `tests/unit/settings/index.test.ts`
- `useGuardForIn` — `tests/unit/factory.test.ts` (guard `for...in` with `hasOwnProperty`)

---

## Tier 2 — requires small judgment

### `useTopLevelRegex` (31) — largest bucket
Hoist regex literals out of functions/loops to module scope (top-level `const`).
Straightforward but touches many files; watch for regexes that close over dynamic
values (those can't be hoisted — suppress with justification instead).
- `scripts/migrate-scraper.ts` (11)
- `scripts/validate-scraper-registry.ts` (5)
- `scripts/sync-scraper-registry.ts` (3)
- `scripts/generate-dashboard.ts` (2)
- `tests/unit/test-data.test.ts` (2)
- `src/parsers/schema-org.ts` (1), `src/plugins/best-image.ts` (1),
  `src/utils/fractions.ts` (1), `src/utils/url.ts` (1),
  `src/scrapers/sites/altonbrown.ts` (1), `budgetbytes.ts` (1),
  `skinnytaste.ts` (1), `twentyfourkitchen.ts` (1)

### `noForEach` (5)
Convert `.forEach()` to `for...of`.
- `scripts/compare-outputs.ts` (2)
- `scripts/validate-parity.ts` (1), `src/settings/index.ts` (1),
  `tests/unit/utils/yields.test.ts` (1)

### `noNamespaceImport` (5)
Replace `import * as x` with named/default imports.
- `scripts/compare-outputs.ts` (1), `src/parsers/opengraph.ts` (1),
  `src/parsers/schema-org.ts` (1), `src/plugins/html-tag-stripper.ts` (1),
  `src/scrapers/abstract.ts` (1)
- ⚠️ Check each import's module: some CJS/namespace imports (e.g. cheerio, jsonld)
  may genuinely need the namespace form — suppress with justification if so.

### `noNestedTernary` (2)
Flatten nested ternaries into `if`/early returns or a lookup.
- `scripts/compare-outputs.ts` (2)

---

## Tier 3 — real refactors (do last, one function at a time)

### `noExcessiveCognitiveComplexity` (7)
Break up complex functions; extract helpers. Test coverage matters here.
- `src/plugins/best-image.ts` (2)
- `src/parsers/schema-org.ts` (1), `src/plugins/schemaorg-fill.ts` (1),
  `src/utils/grouping.ts` (1), `src/utils/time.ts` (1), `src/utils/yields.ts` (1)

---

## Warnings — unused suppressions (9)

Stale `// biome-ignore` comments that no longer suppress anything (rules changed
or code moved). Remove the dead directives.
- `tests/unit/scrapers/abstract.test.ts` (6)
- `tests/unit/settings/index.test.ts` (2)
- `tests/unit/utils/time.test.ts` (1)

---

## Done criteria

- `bun x ultracite check` reports 0 errors (warnings limited to intentional
  `noExplicitAny` uses).
- `bun run test` stays green (268 tests).
- `bun run type-check` passes.
