# Plan 004: Refactor the 7 noExcessiveCognitiveComplexity functions

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat f53cc0c..HEAD -- src/parsers/schema-org.ts src/plugins/best-image.ts src/plugins/schemaorg-fill.ts src/utils/grouping.ts src/utils/time.ts src/utils/yields.ts`
> Changes from plans 002/003 are EXPECTED here (bug fixes, lint mechanical
> fixes, hoisted regexes). Work from the live code and the live lint output;
> the function list below is what must be verified live. Also verify plan 001's
> tests exist: `ls tests/unit/plugins/best-image.test.ts tests/unit/utils/grouping.test.ts tests/unit/plugins/schemaorg-fill.test.ts` — if any is missing, STOP (dependency not met).

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001 (characterization tests — HARD dependency), plans/003 (leaves these 7 as the only lint errors)
- **Category**: tech-debt
- **Planned at**: commit `f53cc0c`, 2026-07-04

## Why this matters

The last tier of the Ultracite cleanup (`docs/ultracite-cleanup-plan.md`,
Tier 3): 7 functions exceed Biome's cognitive-complexity threshold. These are
the highest-defect-risk functions in the library (they parse messy real-world
data). Breaking them into named helpers makes them reviewable and gets
`bun x ultracite check` to zero errors — the migration's done-criterion.

## Current state

The 7 flagged functions at `f53cc0c` (line numbers will have shifted after
plans 002/003 — re-locate via `bun x ultracite check --max-diagnostics=200 2>&1 | grep -B1 noExcessiveCognitiveComplexity`):

| # | Location (at f53cc0c) | Function | Safety net |
|---|----------------------|----------|-----------|
| 1 | `src/utils/time.ts:31` | `getMinutes` | strong — `tests/unit/utils/time.test.ts` (+ plan 002 additions) |
| 2 | `src/utils/yields.ts:83` | `getYields` | strong — `tests/unit/utils/yields.test.ts` |
| 3 | `src/parsers/schema-org.ts:81` | `SchemaOrg.extractData` (private method) | strong — `tests/unit/parsers/schema-org.test.ts` (~880 lines) |
| 4 | `src/utils/grouping.ts:101` | `groupIngredients` | from plan 001 — `tests/unit/utils/grouping.test.ts` |
| 5 | `src/plugins/best-image.ts:144` | `_collectOpenGraphCandidates` | from plan 001 — `tests/unit/plugins/best-image.test.ts` |
| 6 | `src/plugins/best-image.ts:267` | `_parseDimension` | from plan 001 (object/string/number cases) |
| 7 | `src/plugins/schemaorg-fill.ts:45` | the `wrapper` closure inside `SchemaOrgFillPlugin.run` | from plan 001 — `tests/unit/plugins/schemaorg-fill.test.ts` |

Repo conventions to match:
- Helpers in `src/utils/*` are module-private plain functions above the
  exported function (see `normalizeFractions`/`scoreSentenceSimilarity`/
  `bestMatch` in `src/utils/grouping.ts:6-99`).
- In classes, helpers are `private static` methods (see the `_camelCase`
  helpers throughout `src/plugins/best-image.ts`).
- JSDoc on exported functions; short comments only where intent isn't obvious.
- A post-edit hook runs `bun run fix` after each edit (auto-formatting).

## Commands you will need

| Purpose   | Command                                        | Expected on success |
|-----------|------------------------------------------------|---------------------|
| Lint      | `bun x ultracite check --max-diagnostics=200`  | complexity count drops per step |
| Tests     | `bun run test`                                 | all pass, run after EVERY function |
| One file  | `bun x vitest run tests/unit/utils/time.test.ts` | all pass          |
| Typecheck | `bun run type-check`                           | exit 0              |
| Build     | `bun run build`                                | exit 0              |

## Scope

**In scope** (the only files you should modify):
- The 6 source files in the table above — refactoring ONLY; observable
  behavior, exported signatures, and thrown error types/messages must not change.
- `docs/ultracite-cleanup-plan.md` (final status), `plans/README.md` (status row).

**Out of scope** (do NOT touch):
- Test files — if a test fails, your refactor changed behavior; fix the
  refactor, never the test. (Exception: none. A needed test change = STOP.)
- Public API surface (`src/index.ts`, exported types).
- Adding features, fixing latent bugs you notice (report them instead), or
  changing what any function returns for any input.
- Suppressing `noExcessiveCognitiveComplexity` with biome-ignore — the point is
  the refactor. (If ONE function genuinely resists decomposition, STOP and
  report rather than suppress.)

## Git workflow

- Branch: `advisor/004-complexity-refactors` (or the operator's branch).
- **One commit per function**, style:
  `refactor: extract helpers from getMinutes to reduce complexity`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

Do the strongest-safety-net functions first (order below). For EACH function:
(1) read it fully, (2) extract 2–4 well-named helpers using early returns,
(3) `bun run test` — all green, (4) confirm the function left the complexity
list, (5) commit.

### Step 1: `getMinutes` (src/utils/time.ts)

Natural seams: input-to-text coercion (the string/number/object-with-text
branches), range normalization (the `-` / `" to "` splits), ISO-8601 duration
parse, and the TIME_REGEX group-extraction arithmetic. Extract e.g.
`coerceTimeText(element): string | number`, `normalizeRange(timeText): string`,
`parseIsoDuration(timeText): number | null`, `parseTextDuration(timeText): number | null`.
Preserve the exact throw messages (`"Element cannot be null or undefined"`,
`"Unexpected format for time element"`) and the `0 → null` normalizations.

**Verify**: `bun x vitest run tests/unit/utils/time.test.ts` → pass; complexity list no longer contains `time.ts`. Commit.

### Step 2: `getYields` (src/utils/yields.ts)

Read the function first; extract seams analogously (text coercion, the
matching/units logic). Preserve throw messages and all return formats shown in
its JSDoc examples.

**Verify**: `bun x vitest run tests/unit/utils/yields.test.ts` → pass; `yields.ts` off the list. Commit.

### Step 3: `SchemaOrg.extractData` (src/parsers/schema-org.ts)

Seams visible at `f53cc0c`: JSON-LD script collection (`:82-101`), website-name
extraction (`:103-109`), person-reference extraction (`:112+`), and whatever
follows (read the whole method — it continues past the recipe-entity
selection). Extract `private` methods, e.g. `collectJsonLdEntities($)`,
`extractWebsiteName(entities)`, `extractPeople(entities)`. Keep the
constructor→`extractData` flow and all field assignments
(`this.data/people/ratingsData/websiteName`) identical.

**Verify**: `bun x vitest run tests/unit/parsers/schema-org.test.ts` → pass; `bun run test` → pass (fixture tests exercise this heavily); `schema-org.ts` off the list. Commit.

### Step 4: `groupIngredients` (src/utils/grouping.ts)

Seams: selector auto-detection (the `DEFAULT_GROUPINGS` probe loop, `:110-131`
at `f53cc0c`) → extract `findGroupingSelectors($)`; the heading-vs-ingredient
walk (`:143-164`) → extract `partitionByHeading(...)`. Preserve the exact
mismatch-throw message.

**Verify**: `bun x vitest run tests/unit/utils/grouping.test.ts` → pass; `grouping.ts` off the list. Commit.

### Step 5: `_collectOpenGraphCandidates` and `_parseDimension` (src/plugins/best-image.ts)

- `_collectOpenGraphCandidates`: extract the meta-tag scan into
  `private static _readOgImageData($): Array<{url?, width?, height?}>`, leaving
  the merge loop in place.
- `_parseDimension`: early-return per type (number/string/object) is mostly
  already there; extract the object-recursion branch
  (`value/maxValue/minValue`) into `_parseDimensionFromObject` or restructure
  with early returns until the rule passes.

**Verify**: `bun x vitest run tests/unit/plugins/best-image.test.ts` → pass; `best-image.ts` off the list. Commit.

### Step 6: `SchemaOrgFillPlugin.run`'s wrapper (src/plugins/schemaorg-fill.ts)

Extract the catch-block fallback into a `private static` helper, e.g.
`_fillFromSchema(scraper, methodName, args, originalError)` that either returns
the schema result or throws (RecipeSchemaNotFound / the original error). The
wrapper body then reads: try → return decorated; catch → if not
FillPluginException/NotImplementedError rethrow; else return
`_fillFromSchema(...)`. Preserve the log-level-gated `console.debug`/`console.info`
calls and the `Object.defineProperty(wrapper, "name", ...)` line.

**Verify**: `bun x vitest run tests/unit/plugins/schemaorg-fill.test.ts` → pass; `schemaorg-fill.ts` off the list. Commit.

### Step 7: Final zero-errors check

**Verify**: `bun x ultracite check` → **0 errors** (warnings only from
intentional `noExplicitAny`). `bun run test` → all pass. `bun run type-check` →
exit 0. `bun run build` → exit 0. Update `docs/ultracite-cleanup-plan.md`
(done criteria met — mark the file's checklist accordingly) and
`plans/README.md`.

## Test plan

No new tests required; the gate is the existing suite (268 + plan 001/002
additions) staying green after every function. If while refactoring you notice
an UNTESTED branch you're about to restructure (e.g. a rare input shape in
`getYields`), you may add a pinning test in the matching existing test file
BEFORE refactoring — that's the one sanctioned test-file change; note it in
your report.

## Done criteria

- [ ] `bun x ultracite check` exits with 0 errors; only `noExplicitAny` warnings remain
- [ ] `bun run test` exits 0, test count ≥ pre-plan count
- [ ] `bun run type-check` exits 0 and `bun run build` exits 0
- [ ] `git log` shows one refactor commit per function (7 functions, ≥6 commits — best-image may be 1 or 2)
- [ ] No test file modified except sanctioned pre-refactor pins (report them)
- [ ] `docs/ultracite-cleanup-plan.md` done-criteria updated; `plans/README.md` row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 001's test files don't exist (dependency not met).
- Any existing test fails and the fix would be to change the test.
- A function still trips the complexity rule after two honest decomposition
  attempts — report the shape of the problem; don't suppress.
- You find a real bug mid-refactor (behavior that's clearly wrong) — preserve
  it (refactors are behavior-neutral), and list it in your report for a
  follow-up plan.
- `bun run build` fails after a refactor (bundler-visible change).

## Maintenance notes

- Extracted helpers become the natural seams for future site-specific parsing
  quirks — prefer extending a helper over re-inlining logic.
- Reviewer focus: diff each function for accidental behavior drift, especially
  throw messages and null-vs-undefined returns (Python-parity relies on both).
- The `_parseDimension`/OG-scan helpers in best-image will also be touched if
  plan 005's logging lands nearby — sequence 005 after this plan (it is).
