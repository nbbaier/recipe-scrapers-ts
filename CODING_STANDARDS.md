# Coding Standards

`bun run check` (Ultracite) enforces the mechanical rules. These are the judgement rules it cannot catch.

- **Parse, don't validate** scraped HTML, JSON-LD, and network responses at the I/O boundary: the rest of the code sees only named domain types.
- Narrow types with checks rather than `as` assertions; mark literal sets `as const`.
- Catch an error only to handle it or add context.
