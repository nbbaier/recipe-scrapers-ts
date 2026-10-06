# Coding Standards

Biome (Ultracite) and Oxlint (anti-slop plugin) enforce the mechanical rules; `bun run check` reports them. These are the judgement rules they cannot catch.

## Types and data

- Parse external input (scraped HTML, JSON-LD, network responses) at its I/O boundary: validate and sanitize it, then give it a named domain type.
- Narrow types with checks rather than asserting them.
- Mark immutable values and literal sets `as const`.
- Give magic numbers a named constant.

## Control flow

- Return early, including for error cases, so the main path stays unnested.
- Name complex conditions with well-named boolean variables.
- Catch an error only to handle it or add context.

## Review focus

Spend review attention on business logic correctness, meaningful naming, module structure and data flow, and edge cases (boundary conditions and error states).
