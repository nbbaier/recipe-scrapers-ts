# Plan 002: Fix HowToStep array itemListElement drop and getMinutes(0) inconsistency

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat f53cc0c..HEAD -- src/parsers/schema-org.ts src/utils/time.ts tests/unit/parsers/schema-org.test.ts tests/unit/utils/time.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (recommended after plan 001, before plan 003)
- **Category**: bug
- **Planned at**: commit `f53cc0c`, 2026-07-04

## Why this matters

Two verified correctness bugs:

1. In `SchemaOrg.extractHowToInstructionsText`, a `HowToStep` whose
   `itemListElement` is an **array** (common in real-world JSON-LD) is cast to a
   single object; `array.text` and `array.name` are both `undefined`, so every
   nested step is silently dropped and recipes return empty/partial
   instructions. The sibling `HowToSection` branch handles arrays correctly.
2. `getMinutes(0)` (numeric input) returns `0`, while `getMinutes("0")` (string
   input) returns `null` — an inconsistency that leaks straight into
   `cookTime()`/`prepTime()` output. The `try/catch` around `Number.parseInt`
   on that path is also dead code (`parseInt` never throws).

Bonus: fix 1 removes the parameter reassignment at `src/parsers/schema-org.ts:491`,
which clears the `noParameterAssign` lint error tracked in
`docs/ultracite-cleanup-plan.md` (Tier 1 singleton).

This project is a parity port of Python's `recipe-scrapers`; parity is checked
by fixture tests (`tests/unit/test-data.test.ts` against `test_data/`). These
fixes must keep all fixture tests green — see STOP conditions.

## Current state

- `src/parsers/schema-org.ts:37-42` — the interface types `itemListElement` as
  a single step:
  ```ts
  interface HowToStep {
    "@type": "HowToStep";
    itemListElement?: HowToStep;
    name?: string;
    text?: string;
  }
  ```
- `src/parsers/schema-org.ts:489-499` — the buggy branch (inside the
  `@type === "HowToStep"` arm of `extractHowToInstructionsText`):
  ```ts
  // Handle nested itemListElement
  if (schemaItem.itemListElement) {
    schemaItem = schemaItem.itemListElement as unknown as HowToStep;
  }

  if (schemaItem.text) {
    instructionsGist.push(schemaItem.text);
  } else if (schemaItem.name) {
    // Fallback to name if text is missing
    instructionsGist.push(schemaItem.name);
  }
  ```
  For contrast, the `HowToSection` branch just below (`:500-512`) iterates
  `itemListElement` as an array and recurses.
- `src/utils/time.ts:44-51` — the numeric path with the dead try/catch and
  missing zero-normalization:
  ```ts
  } else if (typeof element === "number") {
    // If it's already a number, try to parse it as integer minutes
    try {
      return Number.parseInt(element.toString(), 10);
    } catch {
      throw new Error("Unexpected format for time element");
    }
  }
  ```
  The string path at `:56-59` normalizes: `return asInt === 0 ? null : asInt;`.
- Existing tests: `tests/unit/parsers/schema-org.test.ts` (the nested-
  instructions test at `:573` covers only `HowToSection` with an array) and
  `tests/unit/utils/time.test.ts`.
- A post-edit hook runs `bun run fix` (Ultracite autofix) automatically after
  edits; mechanical reformatting is expected.

## Commands you will need

| Purpose     | Command                                                | Expected on success |
|-------------|--------------------------------------------------------|---------------------|
| Install     | `bun install`                                          | exit 0              |
| Tests       | `bun run test`                                         | all pass            |
| One file    | `bun x vitest run tests/unit/parsers/schema-org.test.ts` | all pass          |
| Typecheck   | `bun run type-check`                                   | exit 0              |
| Lint        | `bun x ultracite check`                                | error count ≤ baseline (88 at `f53cc0c`; this plan should reduce it by ≥1) |

## Scope

**In scope** (the only files you should modify):
- `src/parsers/schema-org.ts` (the `HowToStep` interface and the
  `extractHowToInstructionsText` HowToStep branch ONLY)
- `src/utils/time.ts` (the numeric-input branch of `getMinutes` ONLY)
- `tests/unit/parsers/schema-org.test.ts` (add tests)
- `tests/unit/utils/time.test.ts` (add tests)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):
- The `-`/`to` range-splitting in `getMinutes` (`src/utils/time.ts:61-74`). Its
  blind hyphen split mangles inputs like `"1-1/2 hours"`, but the behavior
  matches the upstream Python port and changing it risks parity — deliberately
  deferred (see `plans/README.md`, "Findings considered and rejected").
- Any other lint findings in these files (plan 003 handles them).
- `src/scrapers/abstract.ts`, `src/plugins/*`.

## Git workflow

- Branch: `advisor/002-howtostep-getminutes-fixes` (or the operator's branch).
- Two commits, conventional style:
  `fix: handle array itemListElement in nested HowToStep instructions` and
  `fix: normalize numeric 0 to null in getMinutes and drop dead try/catch`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Widen the HowToStep interface

In `src/parsers/schema-org.ts:39`, change:
```ts
itemListElement?: HowToStep;
```
to:
```ts
itemListElement?: HowToStep | HowToStep[];
```

**Verify**: `bun run type-check` → may now error inside
`extractHowToInstructionsText` (expected; fixed next step). If it errors
anywhere OTHER than that method, STOP.

### Step 2: Handle both array and single-object itemListElement

Replace the block at `src/parsers/schema-org.ts:489-499` (shown in Current
state) with logic that (a) iterates arrays element-wise with the same
text-then-name fallback as today's single-object path, and (b) keeps the
single-object path byte-for-byte equivalent in behavior, without reassigning
the `schemaItem` parameter:

```ts
// Handle nested itemListElement (single step or array of steps)
const nested = schemaItem.itemListElement;
if (Array.isArray(nested)) {
  for (const item of nested) {
    if (typeof item === "string") {
      instructionsGist.push(item);
    } else if (item?.text) {
      instructionsGist.push(item.text);
    } else if (item?.name) {
      instructionsGist.push(item.name);
    }
  }
  return instructionsGist;
}
const step = nested ?? schemaItem;

if (step.text) {
  instructionsGist.push(step.text);
} else if (step.name) {
  // Fallback to name if text is missing
  instructionsGist.push(step.name);
}
```

Important: this deliberately does NOT recurse via
`extractHowToInstructionsText` for array items — recursion would drop nested
plain objects lacking `@type`, which the current single-object path accepts.
Match the shape above.

**Verify**: `bun run type-check` → exit 0. `bun x vitest run tests/unit/parsers/schema-org.test.ts` → all pass.

### Step 3: Add HowToStep-array tests

In `tests/unit/parsers/schema-org.test.ts`, next to the existing nested-
instructions test (around line 573), add tests constructing a recipe whose
`recipeInstructions` contains a `HowToStep` with:

1. `itemListElement` as an **array** of HowToSteps with `text` → all texts
   appear, in order, in `instructions()` output.
2. `itemListElement` as a **single** HowToStep object → unchanged behavior
   (regression pin).
3. An array item having only `name` (no `text`) → the name is used.

Follow the existing test-construction pattern in that file (they build HTML
with an `application/ld+json` script and instantiate `SchemaOrg`).

**Verify**: `bun x vitest run tests/unit/parsers/schema-org.test.ts` → all pass, including 3 new.

### Step 4: Fix the getMinutes numeric path

Replace `src/utils/time.ts:44-51` (shown in Current state) with:

```ts
} else if (typeof element === "number") {
  // Already a number: treat as integer minutes (0 normalizes to null,
  // matching the string path below)
  const parsed = Number.parseInt(element.toString(), 10);
  return parsed === 0 ? null : parsed;
}
```

Also update the JSDoc on `getMinutes` if it documents the numeric behavior in a
way this contradicts (it currently doesn't mention `0` specifically).

**Verify**: `bun x vitest run tests/unit/utils/time.test.ts` → all pass.

### Step 5: Add getMinutes tests

In `tests/unit/utils/time.test.ts` add:

1. `getMinutes(0)` → `null` (the fix).
2. `getMinutes(45)` → `45` (regression pin).
3. `getMinutes(2.5)` → `2` (pins current truncation via `parseInt`).
4. `getMinutes("0")` → `null` (pin existing string behavior for symmetry).

**Verify**: `bun x vitest run tests/unit/utils/time.test.ts` → all pass, including new.

### Step 6: Full verification and index update

**Verify**: `bun run test` → all pass (fixture/parity tests included).
`bun run type-check` → exit 0. `bun x ultracite check` → error count strictly
less than the pre-plan count (the `noParameterAssign` error at
`schema-org.ts:491` must be gone; confirm with
`bun x ultracite check --max-diagnostics=200 2>&1 | grep noParameterAssign` → no output).
Update `plans/README.md`.

## Test plan

Covered in steps 3 and 5 — seven new tests across the two existing test files,
following each file's existing structure.

## Done criteria

- [ ] `bun run type-check` exits 0
- [ ] `bun run test` exits 0; new tests from steps 3 and 5 exist and pass
- [ ] `bun x ultracite check --max-diagnostics=200 2>&1 | grep noParameterAssign` → empty
- [ ] `grep -n "as unknown as HowToStep" src/parsers/schema-org.ts` → empty
- [ ] No files outside the in-scope list modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at `src/parsers/schema-org.ts:489-499` or `src/utils/time.ts:44-51`
  doesn't match the excerpts (drift).
- Any FIXTURE test (`tests/unit/test-data.test.ts`) fails after either fix —
  that means real recipe data depends on the old behavior and the parity
  question needs a human decision.
- Type-check errors appear outside `extractHowToInstructionsText` after Step 1.
- You feel the need to change the range-splitting logic (`time.ts:61-74`) —
  explicitly out of scope.

## Maintenance notes

- Plan 004 later refactors `getMinutes` and `extractHowToInstructionsText`'s
  parent file for cognitive complexity; land this plan first so the refactor
  starts from correct behavior.
- Reviewer should scrutinize Step 2's non-recursion decision — it preserves
  today's tolerance for untyped nested objects; switching to recursion would be
  a behavior change requiring fixture evidence.
- Deferred: hyphen-range handling in `getMinutes` (see README rejected list).
