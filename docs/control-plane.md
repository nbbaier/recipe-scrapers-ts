# Control Plane Policy

This repository uses a machine-readable contract at `policy/risk-policy.contract.json` to keep agent automation deterministic.

## Contract Scope

The contract defines:

- Risk tiers by path patterns (`riskTierRules`)
- Required checks by tier (`mergePolicy`)
- Docs drift requirements for control-plane changes (`docsDriftRules`)

## Risk Policy Gate

Run the gate locally:

```bash
bun run risk-policy-gate
```

Provide changed files directly:

```bash
bun run risk-policy-gate --changed "src/factory.ts,README.md"
```

Strict mode (fails if required checks cannot be evaluated):

```bash
bun run risk-policy-gate --strict-checks
```

The gate is deterministic and evaluates:

1. Risk tier based on changed paths
2. Required checks for that tier
3. Docs drift compliance

In CI, `.github/workflows/ci.yml` runs `risk-policy-gate` first and only then fans out into `type-check`, `lint`, and `test` jobs.

## Migration Batch Workflow

`.github/workflows/migration-batch.yml` runs nightly (and on demand) to generate a deterministic batch of pending scraper domains. The workflow writes `artifacts/migration-batch.json`, then creates a GitHub issue assigned to Copilot coding agent (model `gpt-5.2-codex`) so Copilot can open the migration PR.
