# Plan 001: Add characterization tests for best-image, grouping, and schemaorg-fill

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat f53cc0c..HEAD -- src/plugins/best-image.ts src/utils/grouping.ts src/plugins/schemaorg-fill.ts tests/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `f53cc0c`, 2026-07-04

## Why this matters

`docs/ultracite-cleanup-plan.md` (Tier 3) schedules complexity refactors of
functions in `src/plugins/best-image.ts`, `src/utils/grouping.ts`, and
`src/plugins/schemaorg-fill.ts`. As of commit `f53cc0c`, **no test file in
`tests/` references any of these three modules** (verified by grep). Refactoring
them without tests is blind. This plan adds characterization tests that pin
*current* behavior so the later refactor (plan 004) has a safety net. These are
characterization tests: if the code's current behavior looks odd, **pin it
anyway** and note it — do not "fix" the code in this plan.

## Current state

- `src/plugins/best-image.ts` — `BestImagePlugin`, a decorator-style plugin. Its
  public entry is `static run(decorated)` which returns a wrapper. The wrapper
  reads from `this` (the scraper): `this.bestImageSelection` (boolean gate),
  `this.schema?.data` (schema.org data object), `this.$` (a cheerio instance),
  and `this.constructor.name`. All other methods are `private static` — test
  through the wrapper, not the privates.

  Wrapper core (`src/plugins/best-image.ts:44-56`):
  ```ts
  const image = decorated.apply(this, args);
  if (!this.bestImageSelection) {
    return image;
  }
  const candidates = BestImagePlugin._collectCandidates(this, image);
  if (!candidates || candidates.length === 0) {
    return image;
  }
  const best = BestImagePlugin._selectBestCandidate(candidates);
  return best || image;
  ```

  Scoring (`src/plugins/best-image.ts:327-347`) ranks candidates by the tuple
  `[area, secure, -order]`: area = width×height (or side² if only one dimension
  known), secure = 1 if URL starts with `https://`, order = insertion order
  (earlier wins ties). Dimensions are taken from candidate metadata, or parsed
  from the URL via `DIMENSION_PATTERN` (e.g. `...-1200x800.jpg`) or
  `QUERY_WIDTH_PATTERN`/`QUERY_HEIGHT_PATTERN` (e.g. `?w=1200&h=800`), see
  `src/plugins/best-image.ts:26-29` and `:369-397`. Candidates are collected
  from: the primary image (the decorated method's return), `schema.data.image`,
  and `<meta property="og:image[...]">` tags read via `this.$`
  (`src/plugins/best-image.ts:144-212`). Duplicate URLs merge, keeping max
  dimensions per axis (`:214-251`). `_parseDimension` (`:267-302`) accepts
  numbers, strings containing digits, and objects with `value`/`maxValue`/`minValue`.

- `src/utils/grouping.ts` — exports one function:
  `groupIngredients(ingredientsList: string[], $: CheerioAPI, groupHeading?, groupElement?)`.
  Behavior (all at `src/utils/grouping.ts:101-172`):
  - If no selectors are given, it probes `DEFAULT_GROUPINGS` (`:31-58`) — the
    "wprm" selectors (`.wprm-recipe-ingredient-group h4` etc.) and "tasty"
    selectors — and uses the first heading+element pair where both match.
  - If nothing matches: returns `[{ purpose: null, ingredients: ingredientsList }]`.
  - If the matched element count differs from `ingredientsList.length`: throws
    `Error` with message `` `Found ${n} grouped ingredients but was expecting to find ${m}.` `` (`:136-140`).
  - Otherwise walks headings+elements in DOM order, assigning each ingredient
    element to the most recent heading, matching the element text back to an
    entry of `ingredientsList` by bigram similarity with unicode-fraction
    normalization (`½` → `1/2`, `:6-29`, `:60-99`).

- `src/plugins/schemaorg-fill.ts` — `SchemaOrgFillPlugin.run(decorated)` returns
  a wrapper that calls `decorated`; on `FillPluginException` or
  `NotImplementedError` it falls back to `this.schema[decorated.name]`; if
  `this.schema?.data` is falsy it throws `RecipeSchemaNotFound`; any other error
  (or a missing schema method) is rethrown (`src/plugins/schemaorg-fill.ts:56-87`).
  Exceptions come from `src/exceptions.ts` — note the hierarchy:
  `SchemaOrgException extends FillPluginException extends RecipeScrapersException`,
  and `NotImplementedError extends RecipeScrapersException`.

- Repo test conventions: vitest, files under `tests/unit/**/*.test.ts` mirroring
  `src/` layout. Exemplar: `tests/unit/scrapers/abstract.test.ts` (imports
  `describe/expect/it` from `vitest`; uses `resetSettings`/`updateSettings` from
  `../../../src/settings` with `beforeEach`/`afterEach`). Match that style.
  Note: a post-edit hook runs `bun run fix` (Ultracite autofix) automatically
  after file edits — mechanical reformatting of your new files is expected.
  Use `import { load } from "cheerio"` (named import) in new test files, NOT
  `import * as cheerio` — the namespace form is a lint error being removed in
  plan 003.

## Commands you will need

| Purpose   | Command                                   | Expected on success |
|-----------|-------------------------------------------|---------------------|
| Install   | `bun install`                             | exit 0              |
| Tests     | `bun run test`                            | all pass (268 existing + your new ones) |
| One file  | `bun x vitest run tests/unit/plugins/best-image.test.ts` | all pass |
| Typecheck | `bun run type-check`                      | exit 0, no errors   |
| Lint      | `bun x ultracite check`                   | error count does not increase vs. baseline (88 at `f53cc0c`) |

## Scope

**In scope** (create only; modify nothing in `src/`):
- `tests/unit/plugins/best-image.test.ts` (create)
- `tests/unit/utils/grouping.test.ts` (create)
- `tests/unit/plugins/schemaorg-fill.test.ts` (create)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):
- Everything under `src/` — this plan pins current behavior; fixing behavior is
  plans 002/004/005.
- Existing test files.
- `docs/ultracite-cleanup-plan.md`.

## Git workflow

- Branch: `advisor/001-characterization-tests` (or commit to the current
  working branch if the operator says so).
- Conventional-commit style, e.g. `test: add characterization tests for best-image, grouping, schemaorg-fill`
  (matches repo history: `test:`, `fix:`, `style:`, `chore:` prefixes).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: BestImagePlugin tests

Create `tests/unit/plugins/best-image.test.ts`. Build a small harness — the
wrapper is invoked with a fake scraper as `this`:

```ts
import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import { BestImagePlugin } from "../../../src/plugins/best-image";

function wrapImage(returnValue: unknown) {
  const decorated = function image() {
    return returnValue;
  };
  return BestImagePlugin.run(decorated as never);
}

function makeScraper(overrides: Record<string, unknown> = {}) {
  return { bestImageSelection: true, schema: undefined, $: undefined, ...overrides };
}
// invoke: wrapImage("https://a/img.jpg").call(makeScraper({...}))
```

Cover at least these cases (each asserting the returned URL):

1. `bestImageSelection: false` → returns the decorated method's value unchanged.
2. No candidates anywhere (primary is `""`, no schema, no `$`) → returns primary as-is.
3. Area wins: primary `"http://example.com/a.jpg"` (no dimensions) vs.
   `schema: { data: { image: { url: "https://example.com/b.jpg", width: 800, height: 600 } } }`
   → returns the schema URL.
4. Secure tiebreak: two dimensionless candidates, primary `http://…`, schema image `https://…` → https wins.
5. Order tiebreak: two dimensionless candidates, both `https://…` → the primary (registered first) wins.
6. Dimensions parsed from URL path: schema images
   `https://example.com/photo-1200x800.jpg` vs `https://example.com/photo-100x100.jpg`
   → the 1200x800 one wins.
7. Dimensions parsed from query string: `https://example.com/i.jpg?w=1000&h=900`
   beats a dimensionless candidate.
8. OpenGraph candidates: `$: load(html)` where `html` contains
   `<meta property="og:image" content="https://example.com/og.jpg">`,
   `<meta property="og:image:width" content="2000">`,
   `<meta property="og:image:height" content="1500">` → the OG image wins over a
   dimensionless primary.
9. Duplicate-URL merge: the same URL as primary (no dims) and as OG image (with
   dims) → that URL wins over a small-dimension alternative (proves dims merged).
10. `_parseDimension` object form via schema:
    `image: { url: "https://example.com/c.jpg", width: { value: "640" }, height: { value: "480" } }`
    beats a dimensionless candidate.

**Verify**: `bun x vitest run tests/unit/plugins/best-image.test.ts` → all pass.

### Step 2: groupIngredients tests

Create `tests/unit/utils/grouping.test.ts`, using `load` from cheerio for
fixtures. Cover:

1. No selector match: plain HTML → `[{ purpose: null, ingredients: <input list> }]`.
2. Empty input on plain HTML: `groupIngredients([], load("<div/>"))` →
   `[{ purpose: null, ingredients: [] }]` (characterizes the empty-list path).
3. wprm grouping: fixture like
   ```html
   <div class="wprm-recipe-ingredient-group"><h4>Sauce</h4></div>
   <ul><li class="wprm-recipe-ingredient">1/2 cup soy sauce</li>
       <li class="wprm-recipe-ingredient">1 tbsp honey</li></ul>
   ```
   with `ingredientsList = ["1/2 cup soy sauce", "1 tbsp honey"]` → one group
   with `purpose: "Sauce"` containing both ingredients. (Adjust fixture DOM
   until the heading/element selectors at `src/utils/grouping.ts:36-46` both
   match; heading elements must be found within their parent per the check at
   `:147-150` — keep the `h4` inside the group div as shown.)
4. Count mismatch: 3 `.wprm-recipe-ingredient` elements but a 2-entry list →
   `expect(() => …).toThrow(/Found 3 grouped ingredients but was expecting to find 2/)`.
5. Explicit selectors: pass `groupHeading`/`groupElement` args for custom
   classes and verify grouping works without the default probes.
6. Unicode fraction matching: DOM text `½ cup sugar`, list entry `"1/2 cup sugar"`
   → the group contains `"1/2 cup sugar"` (the list entry, not the DOM text).

**Verify**: `bun x vitest run tests/unit/utils/grouping.test.ts` → all pass.

### Step 3: SchemaOrgFillPlugin tests

Create `tests/unit/plugins/schemaorg-fill.test.ts`. Harness: wrap a function
with `SchemaOrgFillPlugin.run(...)` and `.call()` it with a fake scraper
`{ schema, url: "https://example.com" }`. Import `FillPluginException`,
`NotImplementedError`, `RecipeSchemaNotFound` from `../../../src/exceptions`.
Cover:

1. Decorated succeeds → its value is returned; schema is never consulted.
2. Decorated throws `NotImplementedError`; `schema = { data: {}, title: () => "From Schema" }`
   and the decorated function's `name` is `title` (use a named function
   `function title() { … }`) → returns `"From Schema"`.
3. Same but throwing `FillPluginException` → same fallback.
4. Decorated throws `NotImplementedError`; `schema = undefined` → the wrapper
   throws `RecipeSchemaNotFound`.
5. Decorated throws a plain `Error("boom")` → that same error propagates
   (no schema fallback attempted).
6. Decorated throws `NotImplementedError`; schema has `data` but no matching
   method → the original `NotImplementedError` propagates.

If console noise from the plugin's `console.info`/`console.debug` clutters test
output, set the log level up via `updateSettings`/`resetSettings` from
`../../../src/settings` in `beforeEach`/`afterEach` (see
`tests/unit/scrapers/abstract.test.ts` for the pattern) — optional.

**Verify**: `bun x vitest run tests/unit/plugins/schemaorg-fill.test.ts` → all pass.

### Step 4: Full-suite check and index update

**Verify**: `bun run test` → all pass (268 + new). `bun run type-check` → exit 0.
`bun x ultracite check` → no NEW errors relative to baseline (88 errors at
`f53cc0c`; your test files must contribute zero). Update this plan's row in
`plans/README.md` to DONE.

## Test plan

This plan IS the test plan — the three files above, ~22 new tests total.
Structural pattern: `tests/unit/scrapers/abstract.test.ts`.

## Done criteria

- [ ] Three new test files exist at the paths in Scope
- [ ] `bun run test` exits 0; total test count > 268
- [ ] `bun run type-check` exits 0
- [ ] `bun x ultracite check` reports ≤ 88 errors (no new ones from test files)
- [ ] `git status` shows no modified files under `src/`
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any excerpt in "Current state" doesn't match the live code (drift).
- A behavior you are pinning appears to be a bug so severe the test looks
  nonsensical — pin it, but if you *cannot* express it as a passing test after
  two attempts, stop and report the discrepancy instead of changing `src/`.
- You find yourself wanting to edit anything under `src/` to make a test pass.
- The wprm fixture in Step 2 cannot be made to trigger grouping after ~3 DOM
  variations — report the selectors' actual matching behavior instead.

## Maintenance notes

- Plan 004 (complexity refactors) relies on these tests as its safety net; if
  behavior intentionally changes later, update these tests deliberately, not
  reflexively.
- During test writing you are also verifying the audit's LOW-confidence finding
  that `bestMatch` (`src/utils/grouping.ts:91`) can read `scores[0]` on an empty
  list — Step 2 case 2 documents that the empty-list path returns early and
  never reaches `bestMatch`. If you observe otherwise, note it in your report.
