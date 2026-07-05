# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| --------------------------- | --------------------- | ----------------------------------------- |
| `needs-triage`               | `needs-triage`         | Maintainer needs to evaluate this issue   |
| `needs-info`                 | `needs-info`           | Waiting on reporter for more information  |
| `ready-for-agent`            | `ready-for-agent`      | Fully specified, ready for an AFK agent   |
| `ready-for-human`            | `ready-for-human`      | Requires human implementation             |
| `wontfix`                    | `wontfix`              | Will not be actioned                      |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

## Blocked state: native issue relations, not a label

Parent/child structure and blocking are encoded with GitHub's native issue
relations, not labels:

- **Sub-issues** — child work items are attached to their parent (e.g. the
  blueprint spec issue) via the sub-issues API:
  `gh api repos/{owner}/{repo}/issues/<parent>/sub_issues -X POST -F sub_issue_id=<child numeric id>`
- **Dependencies** — hard blockers use blocked-by relations:
  `gh api repos/{owner}/{repo}/issues/<n>/dependencies/blocked_by` (GET to
  check, POST with `-F issue_id=<blocker numeric id>` to add).

Both APIs take the issue's numeric database `id` (from
`gh api repos/{owner}/{repo}/issues/<n> --jq .id`), not the issue number.

Dispatch rule for agents: an issue is dispatchable only when it has
`ready-for-agent` **and** its `blocked_by` list contains no open issues. When
an issue's last open blocker closes, add `ready-for-agent` to it. Soft
ordering preferences (nice-to-run-after, not must) stay in prose in the issue
body, not in relations.

Edit the right-hand column to match whatever vocabulary you actually use.
