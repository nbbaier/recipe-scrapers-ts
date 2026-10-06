## Agent skills

### Issue tracker

Issues live in GitHub Issues for `nbbaier/recipe-scrapers-ts` (via the `gh` CLI). External PRs are not treated as a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) is used as-is. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Code standards

Run `bun run check:fix` (`ultracite fix`) before committing; `bun run check` reports remaining issues.

When writing or reviewing TypeScript in `src/` or `tests/`, read `CODING_STANDARDS.md`.
</coding_guidelines>
