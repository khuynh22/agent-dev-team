---
description: Run the pre-merge review panel over a diff, branch, or pull request
argument-hint: [diff, branch, or PR]
---

Review this: $ARGUMENTS

If no target is given, review the uncommitted diff and, failing that, the current branch
against its merge base.

Run the panel from `references/orchestration-patterns.md`. Each reviewer works
independently and does not see the others' findings before producing its own; shared
context produces agreement rather than coverage.

- `code-reviewer` with `code-review-pass` — always
- `test-engineer` — always
- `security-auditor` with `security-hardening` — when the diff touches authentication,
  authorization, secrets, cryptography, file paths, shell execution, deserialization, or
  input crossing a trust boundary
- `performance-engineer` with `performance-pass` — when the diff touches a measured hot
  path
- `data-engineer` with `data-quality` — when the diff changes a pipeline, a warehouse
  model, or a metric definition
- `ux-reviewer` — when the diff changes what a user sees or reads

Then merge: rank by severity, de-duplicate by `file:line`, and escalate any disagreement
between two reviewers to `principal-engineer` rather than averaging it into a weak
suggestion.

Report the merged findings and a single verdict. Any open Critical means request changes.
State what was not reviewed. Do not edit the code.
