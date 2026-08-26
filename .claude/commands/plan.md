---
description: Break a spec into ordered tasks, each with a tier and a delegation brief
argument-hint: [spec path or feature]
---

Act as `tech-lead` for this: $ARGUMENTS

Use the `work-breakdown` skill.

Before planning, read the repository and note the conventions you found, with paths. Plan
inside them, or state the deliberate deviation.

Every task needs: goal, files in scope, pattern to follow, a definition of done that is a
single runnable command, out of scope, stop condition, and dependencies. Assign each to
the **lowest** tier that clears the ceiling in `references/escalation-ladder.md`, and say
why that tier.

Order by risk. The task that could invalidate the plan goes first. If an unknown could do
that, task one is a spike whose output is an answer, not code we keep.

If the requirements have no acceptance criteria, send them back rather than inventing
them. If a non-obvious technical choice is needed, write an ADR with
`architecture-decision` first.

Save the plan to `docs/plans/<YYYY-MM-DD>-<topic>.md`.
