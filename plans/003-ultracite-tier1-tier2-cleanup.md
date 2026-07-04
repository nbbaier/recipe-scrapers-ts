# Plan 003: Clear Ultracite Tier 1 + Tier 2 lint errors and stale suppressions

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: run `bun x ultracite check --max-diagnostics=200`
> and compare its per-rule counts against the inventory below. Small deltas from
> plans 001/002 are expected (e.g. `noParameterAssign` already fixed); if a rule
> listed below has MORE occurrences than stated, or a rule not listed appears,
> note it and proceed rule-by-rule from the LIVE output, which is authoritative.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (run after plan 002 to avoid touching the same lines twice)
- **Category**: dx
- **Planned at**: commit `f53cc0c`, 2026-07-04

## Why this matters

The Biome → Ultracite migration left 88 lint errors + 9 warnings
(`docs/ultracite-cleanup-plan.md` — verified accurate at `f53cc0c`). While the
gate is red, new lint regressions are invisible. This plan clears everything
EXCEPT the 7 `noExcessiveCognitiveComplexity` errors (those are real refactors —
plan 004). After this plan, `bun x ultracite check` should report exactly those
7 errors and only intentional `noExplicitAny` warnings.

## Current state

Lint driver: `bun x ultracite check --max-diagnostics=200` (Biome engine,
config in `biome.jsonc`, which extends `ultracite/biome/core` + `vitest`).
Policy decisions already made in `biome.jsonc` — do not revisit: `noBarrelFile`
off, `noExplicitAny` warn-only, `noExportedImports` off for
`src/scrapers/sites/index.ts`. Scripts and tests are held to the same bar as
`src/`.

A post-edit hook runs `bun run fix` after each edit — safe autofixes and
formatting apply automatically; some of the diagnostics below are marked
FIXABLE and may resolve the moment you touch the file.

Inventory at `f53cc0c` (error counts per rule → files):

**Tier 1 — mechanical:**
- `useReadonlyClassProperties` (16): `scripts/compare-outputs.ts:24-26`,
  `scripts/validate-parity.ts:51-53`, `src/parsers/schema-org.ts:65-66`
- `noUselessCatchBinding` (4): `src/parsers/schema-org.ts:98`,
  `src/plugins/opengraph-image-fetch.ts:32`, `src/scrapers/abstract.ts:465`,
  `tests/unit/parsers/schema-org.test.ts:848`
- `useConsistentArrayType` (3): `src/scrapers/abstract.ts:383,385`, `src/utils/yields.ts:25`
- `useAtIndex` (3): `src/plugins/best-image.ts:186,192`, `src/utils/url.ts:123`
- `noDelete` (4): `scripts/compare-outputs.ts:351,360`, `scripts/validate-parity.ts:401,410`
- Singletons: `useConsistentTypeDefinitions` `scripts/validate-parity.ts:29`;
  `useConsistentMemberAccessibility` `src/parsers/schema-org.ts:64`;
  `useCollapsedIf` `src/plugins/best-image.ts:191`;
  `noParameterAssign` `src/parsers/schema-org.ts:491` (likely already fixed by plan 002 — skip if absent);
  `noVoid` `scripts/migrate-scraper.ts:913`;
  `noUnusedExpressions` `scripts/generate-dashboard.ts:180`;
  `noEmptyBlockStatements` `tests/unit/settings/index.test.ts:225`;
  `useGuardForIn` `tests/unit/factory.test.ts:157`

**Tier 2 — small judgment:**
- `useTopLevelRegex` (31): `scripts/migrate-scraper.ts` (11: lines 192, 203,
  210, 216, 228, 261, 291, 312, 355, 515, 521), `scripts/validate-scraper-registry.ts`
  (5: 32, 34, 46, 67, 85), `scripts/sync-scraper-registry.ts` (3: 30, 32, 44),
  `scripts/generate-dashboard.ts` (2: 109, 111), `tests/unit/test-data.test.ts`
  (2: 47, 48), and one each in `src/parsers/schema-org.ts:484`,
  `src/plugins/best-image.ts:279`, `src/utils/fractions.ts:66`,
  `src/utils/url.ts:37`, `src/scrapers/sites/altonbrown.ts:20`,
  `budgetbytes.ts:23`, `skinnytaste.ts:23`, `twentyfourkitchen.ts:46`
- `noForEach` (5): `scripts/compare-outputs.ts:244,253`,
  `scripts/validate-parity.ts:465`, `src/settings/index.ts:82`,
  `tests/unit/utils/yields.test.ts:12`
- `noNamespaceImport` (5): `import * as cheerio from "cheerio"` in
  `src/parsers/opengraph.ts:8`, `src/parsers/schema-org.ts:9`,
  `src/plugins/html-tag-stripper.ts:8`, `src/scrapers/abstract.ts:9`;
  `import * as diff from "diff"` in `scripts/compare-outputs.ts:18`
- `noNestedTernary` (2): `scripts/compare-outputs.ts:247,250`

**Warnings — stale suppressions (9)** (`suppressions/unused`): dead
`// biome-ignore` comments at `tests/unit/scrapers/abstract.test.ts:102,104,157,168,208,212`,
`tests/unit/settings/index.test.ts:17,23`, `tests/unit/utils/time.test.ts:124`.

Line numbers shift as you edit — always re-run the check and work from live
output. The counts above are for orientation and final accounting.

## Commands you will need

| Purpose   | Command                                        | Expected on success |
|-----------|------------------------------------------------|---------------------|
| Install   | `bun install`                                  | exit 0              |
| Lint      | `bun x ultracite check --max-diagnostics=200`  | see per-step targets |
| Autofix   | `bun run fix`                                  | exit 0 (also runs via post-edit hook) |
| Tests     | `bun run test`                                 | all pass            |
| Typecheck | `bun run type-check`                           | exit 0              |

## Scope

**In scope**: every file listed in the inventory above (in `src/`, `scripts/`,
`tests/`), plus `docs/ultracite-cleanup-plan.md` (final status update) and
`plans/README.md` (status row). `biome.jsonc` ONLY if a justified suppression
is better expressed as a targeted override — prefer inline
`// biome-ignore lint/<group>/<rule>: <reason>` comments instead.

**Out of scope** (do NOT touch):
- The 7 `noExcessiveCognitiveComplexity` findings — plan 004. Do not "start" on
  them even where you're already editing the file.
- Behavior changes of any kind. Every fix here must be behavior-preserving.
- `src/scrapers/abstract.ts` `toJson` catch SEMANTICS: fix
  `noUselessCatchBinding` there mechanically (`catch (_error)` → `catch`), but
  do not narrow or change what it catches — plan 005 owns that.
- Existing `noExplicitAny` warnings (intentional policy).

## Git workflow

- Branch: `advisor/003-ultracite-tier1-tier2` (or the operator's branch).
- **One commit per rule category** (the workflow `docs/ultracite-cleanup-plan.md`
  prescribes), style: `style: mark never-reassigned class fields readonly`,
  `style: hoist regex literals to module scope`, etc.
- Run `bun run test` before each commit.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

Work one rule category per step/commit. For each: fix all occurrences from
live lint output, then `bun run test` + confirm the rule's count is 0.

### Step 1: Tier 1 mechanical rules

In order: `useReadonlyClassProperties` (add `readonly` to never-reassigned
class fields), `noUselessCatchBinding` (`catch (e)`/`catch (_error)` →
`catch`), `useConsistentArrayType`, `useAtIndex` (`arr[arr.length - 1]` →
`arr.at(-1)`; note `.at()` returns `T | undefined`, so a null-check or `?? `
may be needed to satisfy type-check), then the singletons. Many are FIXABLE —
try `bun run fix` first and hand-fix the rest.

For `noDelete` (4 sites in scripts): do NOT blindly replace `delete obj[k]`
with `obj[k] = undefined` — check how the object is consumed. If it's
`JSON.stringify`d, undefined-assignment is equivalent; if its keys are
enumerated (`Object.keys`, `in`), use destructuring omission
(`const { k: _unused, ...rest } = obj`) so the key truly disappears.

For `useGuardForIn` (`tests/unit/factory.test.ts:157`): wrap the loop body in
`if (Object.hasOwn(obj, key)) { … }` or convert to `for...of Object.keys(...)`.

**Verify**: `bun x ultracite check --max-diagnostics=200 2>&1 | grep -cE "useReadonlyClassProperties|noUselessCatchBinding|useConsistentArrayType|useAtIndex|noDelete|useConsistentTypeDefinitions|useConsistentMemberAccessibility|useCollapsedIf|noParameterAssign|noVoid|noUnusedExpressions|noEmptyBlockStatements|useGuardForIn"` → `0`. `bun run test` → all pass. Commit.

### Step 2: `useTopLevelRegex` (31)

Hoist each function-local regex **literal** to a module-scope
`const SCREAMING_CASE_NAME = /.../flags;` named by intent (e.g.
`TRAILING_DOTS_PATTERN`), placed near the top of the file after imports.
Precedent: `src/utils/time.ts:12` (`TIME_REGEX`) and
`src/plugins/best-image.ts:26-29` (static readonly patterns — for class
contexts, `private static readonly` members are fine too).

Two cautions:
- A regex that interpolates dynamic values (built with `new RegExp(...)`)
  cannot be hoisted — none of the 31 flagged sites should be dynamic (the rule
  only flags literals), but if one turns out to be, suppress it inline with a
  justification comment instead.
- Regexes with the `g` flag are STATEFUL (`lastIndex`). If a hoisted `g`-flagged
  regex is used with `.exec()`/`.test()` in a loop, hoisting changes behavior.
  For those, keep `.match()`/`.replace()`/`.matchAll()` usage (safe) or reset
  `lastIndex`; if the call pattern is unclear, suppress with justification
  rather than risk it.

**Verify**: `bun x ultracite check --max-diagnostics=200 2>&1 | grep -c useTopLevelRegex` → `0`. `bun run test` → all pass. Also run `bun run validate-registry` (exercises `scripts/validate-scraper-registry.ts`) → completes without crash. Commit.

### Step 3: `noForEach` (5), `noNestedTernary` (2)

Convert `.forEach(cb)` to `for...of` (use `.entries()` when the index is
used). Flatten the two nested ternaries in `scripts/compare-outputs.ts:247,250`
into `if/else if` chains or a small lookup — preserve exact output strings.

**Verify**: `bun x ultracite check --max-diagnostics=200 2>&1 | grep -cE "noForEach|noNestedTernary"` → `0`. `bun run test` → all pass. Commit.

### Step 4: `noNamespaceImport` (5)

- The four `import * as cheerio from "cheerio"` sites: check each file's usage.
  If only `cheerio.load(...)` is called, replace with
  `import { load } from "cheerio"` and update call sites; types like
  `cheerio.CheerioAPI` become `import type { CheerioAPI } from "cheerio"`
  (pattern already used in `src/utils/grouping.ts:1`).
- `import * as diff from "diff"` in `scripts/compare-outputs.ts:18`: find which
  `diff.*` functions are called and import them by name (the `diff` package
  exports named functions like `diffJson`, `diffLines`).
- If a module genuinely cannot be imported by name (CJS interop), keep the
  namespace import and suppress inline:
  `// biome-ignore lint/performance/noNamespaceImport: <package> has no usable named exports` —
  but verify by trying the named form first; `bun run type-check` is the judge.

**Verify**: `bun x ultracite check --max-diagnostics=200 2>&1 | grep -c noNamespaceImport` → `0` (or only suppressed-with-reason sites). `bun run type-check` → exit 0. `bun run test` → all pass. `bun run build` → exit 0 (import changes affect the published bundle). Commit.

### Step 5: Remove the 9 stale suppressions

Delete the dead `// biome-ignore` comment lines listed in Current state
(re-locate via live output: they're reported as `suppressions/unused`). Do not
delete suppressions the checker still considers active.

**Verify**: `bun x ultracite check --max-diagnostics=200 2>&1 | grep -c "suppressions/unused"` → `0`. `bun run test` → all pass. Commit.

### Step 6: Final accounting

Run `bun x ultracite check --max-diagnostics=200`. Expected end state:
**exactly 7 errors, all `noExcessiveCognitiveComplexity`** (locations:
`src/parsers/schema-org.ts`, `src/plugins/best-image.ts` ×2,
`src/plugins/schemaorg-fill.ts`, `src/utils/grouping.ts`, `src/utils/time.ts`,
`src/utils/yields.ts`), and warnings only from `noExplicitAny`. Update the
"Current state" line in `docs/ultracite-cleanup-plan.md` to reflect this, and
mark Tiers 1–2 and the warnings section done. Update `plans/README.md`.

## Test plan

No new tests — every change is behavior-preserving; the existing 268-test suite
plus `bun run type-check` and `bun run build` are the net. If any test fails
after a category, the "mechanical" fix wasn't mechanical: revert that one
change and report it in the plan's status row.

## Done criteria

- [ ] `bun x ultracite check` reports exactly 7 errors, all `noExcessiveCognitiveComplexity`
- [ ] Zero `suppressions/unused` warnings
- [ ] `bun run test` exits 0 (no count regression)
- [ ] `bun run type-check` exits 0
- [ ] `bun run build` exits 0
- [ ] One commit per rule category in `git log`
- [ ] `docs/ultracite-cleanup-plan.md` current-state line updated
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any single fix requires changing runtime behavior to satisfy the rule.
- A test fails after a change and the cause isn't an obvious test-side
  assumption (e.g. a test asserting on a namespace import).
- The named-import form of cheerio or diff fails type-check AND the suppression
  route feels wrong — report rather than fight module resolution.
- Fixing a `g`-flagged regex hoist would change match behavior (Step 2 caution)
  and you cannot confidently verify the call pattern.
- More than ~10 diagnostics exist that this plan doesn't account for.

## Maintenance notes

- After this plan, the lint gate is meaningful: any new error is a regression.
  Consider (out of scope here) adding `bun x ultracite check` to CI if not
  already present.
- Plan 004 clears the remaining 7 complexity errors; plan 005 revisits the
  `toJson` catch that Step 1 touched mechanically.
- The hoisted regex constants are now shared module state — future editors must
  not add the `g` flag to one without checking its call sites.
