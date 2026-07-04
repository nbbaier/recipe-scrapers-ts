# Plan 005: Make toJson stop hiding unexpected errors as missing fields

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat f53cc0c..HEAD -- src/scrapers/abstract.ts src/utils/time.ts src/utils/yields.ts src/utils/grouping.ts src/exceptions.ts`
> Drift from plans 002–004 is expected in these files. Locate the `toJson`
> method in the live `src/scrapers/abstract.ts` (search for `toJson`) and
> confirm its catch block still swallows everything before proceeding; if it
> already discriminates error types, this plan is done — mark it REJECTED
> (already fixed) in `plans/README.md` and stop.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: MED
- **Depends on**: plans/003 (touches the same catch mechanically), plans/004 (refactors the utils this plan re-types throws in)
- **Category**: bug (observability)
- **Planned at**: commit `f53cc0c`, 2026-07-04

## Why this matters

`AbstractScraper.toJson()` builds the full recipe dict by calling every
extractor and swallowing ALL exceptions, so a missing field and a crashed
extractor look identical in output. A genuine regression (null-deref,
`TypeError`) ships as a silently-absent field. The fix: keep skipping the
library's own "data not available" exceptions (that contract must not change —
Python parity), but log anything unexpected so defects become visible.

Complication (why this is not a two-line change): several `src/utils` functions
throw PLAIN `Error` for expected missing-data cases, so "unexpected = not a
RecipeScrapersException" would be noisy until those throws are re-typed.

## Current state

- `src/scrapers/abstract.ts:465-467` (at `f53cc0c`; plan 003 may have turned
  `catch (_error)` into `catch`) — inside `toJson()`'s method loop:
  ```ts
  } catch (_error) {
    // Skip fields that throw exceptions (data not available)
  }
  ```
- Exception hierarchy in `src/exceptions.ts` — everything the library throws
  intentionally extends `RecipeScrapersException` (base at `:8`). Notable
  subtlety: `SchemaOrgException extends FillPluginException`, and
  `SchemaOrgFillPlugin` (`src/plugins/schemaorg-fill.ts:60-63`) catches
  `FillPluginException`/`NotImplementedError` to trigger schema fallback —
  so which class a util throws is behavior-relevant, not cosmetic.
- Plain-`Error` throws in expected missing-data paths (verify live with
  `grep -rn "throw new Error" src/`):
  - `src/utils/time.ts:35` — `"Element cannot be null or undefined"` (null time element)
  - `src/utils/time.ts:52` — `"Unexpected format for time element"`
  - `src/utils/yields.ts:87` — `"Element cannot be null or undefined"` (null yields element)
  - `src/utils/grouping.ts:137` — the ingredient-count-mismatch throw (this one
    is a real data-integrity signal — it SHOULD be logged, leave it plain)
  - plus any others the grep finds — classify each: "expected missing-data" vs
    "genuine anomaly".
- Logging convention: `settings.LOG_LEVEL` gates console output —
  `<= 0` debug, `<= 1` info (see `src/plugins/schemaorg-fill.ts:49-54,75-80`).
  `settings` is imported from `../settings` (`src/scrapers/abstract.ts` already
  imports it — verify).
- Tests for `toJson` live in `tests/unit/scrapers/abstract.test.ts` (a
  `TestScraper extends AbstractScraper` pattern, `:11-80`).

## Commands you will need

| Purpose   | Command                                                  | Expected on success |
|-----------|----------------------------------------------------------|---------------------|
| Tests     | `bun run test`                                           | all pass            |
| One file  | `bun x vitest run tests/unit/scrapers/abstract.test.ts`  | all pass            |
| Typecheck | `bun run type-check`                                     | exit 0              |
| Lint      | `bun x ultracite check`                                  | 0 errors (post-plan-004 state preserved) |

## Scope

**In scope** (the only files you should modify):
- `src/scrapers/abstract.ts` — the `toJson` catch block only
- `src/utils/time.ts`, `src/utils/yields.ts` — re-type the two
  null-element throws only
- `tests/unit/scrapers/abstract.test.ts`, `tests/unit/utils/time.test.ts`,
  `tests/unit/utils/yields.test.ts` — assertions on thrown types + new toJson tests
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):
- `SchemaOrgFillPlugin` / `src/plugins/*` — its catch semantics stay as-is.
- `src/utils/grouping.ts` count-mismatch throw — stays a plain `Error` ON
  PURPOSE (it signals corrupted grouping, and after this plan it gets logged).
- The set of fields `toJson` emits, their names, or null-conversion behavior.
- Making `toJson` rethrow anything — output contract is unchanged; this plan
  only adds logging.

## Git workflow

- Branch: `advisor/005-tojson-error-visibility` (or the operator's branch).
- Two commits: `fix: use ElementNotFoundInHtml for null time/yields elements`
  then `feat: log unexpected extractor errors in toJson`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Re-type the expected null-element throws

In `src/utils/time.ts` and `src/utils/yields.ts`, change the null/undefined
element guards from `throw new Error("Element cannot be null or undefined")` to
`throw new ElementNotFoundInHtml("Element cannot be null or undefined")`
(import from `../exceptions`). Keep the messages identical.

**Why `ElementNotFoundInHtml` specifically**: it extends
`RecipeScrapersException` but NOT `FillPluginException`, so `toJson` will treat
it as expected while `SchemaOrgFillPlugin`'s fallback behavior is untouched.
Do NOT use `SchemaOrgException` (it would newly trigger schema fallback — a
behavior change).

Leave `time.ts`'s `"Unexpected format for time element"` throw as a plain
`Error` — an unrecognized format IS an anomaly worth logging. If plan 004's
refactor moved these throws into helpers, apply the same change wherever the
message now lives.

Update any existing tests that assert `.toThrow(Error)`-with-that-message so
they still pass (they should — `ElementNotFoundInHtml extends Error`), and add
one assertion per util that the thrown error is `instanceof ElementNotFoundInHtml`.

**Verify**: `bun x vitest run tests/unit/utils/time.test.ts tests/unit/utils/yields.test.ts` → all pass. `bun run test` → all pass.

### Step 2: Discriminate in toJson's catch

In `src/scrapers/abstract.ts`, import `RecipeScrapersException` from
`../exceptions` (check the existing import — several exception classes are
likely already imported) and change `toJson`'s catch to:

```ts
} catch (error) {
  // Library exceptions mean "data not available" — skip the field silently.
  // Anything else is a probable defect: keep the field absent (output
  // contract), but surface it at info level and above.
  if (!(error instanceof RecipeScrapersException) && settings.LOG_LEVEL <= 1) {
    console.warn(`toJson: unexpected error in ${method}():`, error);
  }
}
```

Adjust the variable name for the loop's method identifier to whatever the live
code uses (`method` at `f53cc0c`, `src/scrapers/abstract.ts:450`). If `settings`
is not already imported in this file, import it from `../settings`.

**Verify**: `bun run type-check` → exit 0. `bun x ultracite check` → 0 errors.

### Step 3: Tests for the new behavior

In `tests/unit/scrapers/abstract.test.ts`, following the existing `TestScraper`
pattern, add:

1. A scraper whose extractor throws `ElementNotFoundInHtml` → `toJson()` omits
   the field (or emits it per current mapping) and logs nothing (spy on
   `console.warn` with `vi.spyOn`, assert not called).
2. A scraper whose extractor throws `new TypeError("boom")` → `toJson()` output
   is unchanged in shape (field absent) AND `console.warn` was called once with
   a message containing the method name. Set the log level so the warn path is
   active (`updateSettings`/`resetSettings` pattern already used in this file);
   also assert warn is NOT called when LOG_LEVEL is above the threshold.

**Verify**: `bun x vitest run tests/unit/scrapers/abstract.test.ts` → all pass, including new.

### Step 4: Full verification and index update

**Verify**: `bun run test` → all pass (fixture tests especially — if any
fixture scraper was silently relying on a plain-Error skip, it still skips, so
they must pass; new WARNINGS in test output are acceptable, failures are not).
Update `plans/README.md`.

## Test plan

Step 3's two toJson tests plus the `instanceof` assertions in the two util test
files. Pattern: `tests/unit/scrapers/abstract.test.ts` (TestScraper subclass,
settings reset in `beforeEach`/`afterEach`, vitest `vi.spyOn` for console).

## Done criteria

- [ ] `grep -n "throw new Error(\"Element cannot be null" src/utils/time.ts src/utils/yields.ts` → empty
- [ ] `toJson`'s catch discriminates `instanceof RecipeScrapersException`
- [ ] `bun run test` exits 0 with the new tests present
- [ ] `bun run type-check` exits 0; `bun x ultracite check` → 0 errors
- [ ] No files outside the in-scope list modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The live `toJson` catch already discriminates error types (drift → plan
  already superseded; mark REJECTED in the index).
- Any FIXTURE test fails after Step 1 — a real scraper depends on the old
  exception type reaching some other handler; that needs a human decision.
- The grep in Current state reveals plain-`Error` throws in `src/` (not
  `scripts/`) beyond the ones listed, on paths reachable from extractors, whose
  classification (expected vs anomaly) is unclear — list them and stop.
- You find yourself modifying `SchemaOrgFillPlugin` or any plugin.

## Maintenance notes

- Future extractors should throw `RecipeScrapersException` subclasses for
  "data not available"; plain errors will now show up as warnings — that's the
  point. Consider documenting this in `AGENTS.md` (out of scope here).
- Reviewer focus: Step 1's class choice (`ElementNotFoundInHtml`, NOT a
  `FillPluginException` subclass) — getting this wrong silently changes the
  schema-fallback behavior of every scraper method.
- Deferred: converting `scripts/` throws similarly (scripts are operator-run;
  noise there is acceptable).
