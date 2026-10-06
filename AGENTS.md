- **GitHub issues and PRs**: before creating, reading, labelling, or closing one, read `docs/agents/issue-tracker.md`; before applying or interpreting a triage label or judging an issue dispatchable, also read `docs/agents/triage-labels.md`.
- **Domain docs**: before exploring the codebase or naming a domain concept, read `docs/agents/domain.md`.
- **Code standards**: before writing or reviewing TypeScript in `src/` or `tests/`, read `CODING_STANDARDS.md`. Before committing, run `bun run check:fix`; `bun run check` reports what remains.

## Gotchas

- This is a port of Python [recipe-scrapers](https://github.com/hhursev/recipe-scrapers) aiming for 1:1 output parity; record known divergences in `docs/PARITY_ISSUES.md`.
- `test_data/` is gitignored and replaced wholesale from upstream by `bun run sync-test-data`, so local fixture edits are lost; fix the scraper, not the fixture.
- `src/scrapers/sites/index.ts` is generated: after adding or renaming a scraper, run `bun run sync-registry` instead of editing it.
