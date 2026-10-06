# Coding Standards

Biome (via Ultracite) enforces most formatting and lint rules automatically. These are the project rules it does not cover, or that need judgement.

## Types

- Prefer `unknown` over `any`, but treat `unknown` as a way station, not a destination. Parse the value at its I/O boundary and give it a named domain type; leaving `unknown` in a parameter, return type, or type alias pushes the unresolved shape onto every caller.
- Use const assertions (`as const`) for immutable values and literal types.
- Narrow types instead of asserting them.
- Extract magic numbers into named constants.

## Code organization

- Keep functions focused and under reasonable cognitive complexity limits.
- Extract complex conditions into well-named boolean variables.
- Prefer early returns over nesting, including for error cases.
- Use `try-catch` meaningfully: catch to handle or add context, not just to rethrow.

## Security

- Validate and sanitize external input (scraped HTML, network responses).

## Performance

- Avoid spread syntax in accumulators within loops.
- Use top-level regex literals instead of creating them in loops.
- Prefer specific imports over namespace imports.
- Avoid barrel files (index files that re-export everything).

## Testing

- Keep test suites flat; avoid deep `describe` nesting.

## Where Biome can't help

Focus review attention on business logic correctness, meaningful naming, module structure and data flow, and edge cases (boundary conditions and error states).
