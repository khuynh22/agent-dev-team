---
description: Execute a plan one task at a time, test first, verified and committed
argument-hint: [plan path or task]
---

Implement this: $ARGUMENTS

Use `incremental-delivery` for the loop and `tdd-loop` for each task. For user interface
work also use `frontend-build`; for microcontroller work use `firmware-build`.

Per task:

1. Read the brief. If a field is missing and you are below T2, escalate now.
2. Run the definition-of-done command to get a baseline. If it already fails, stop and
   report; that is not your bug.
3. Red, green, whole suite, refactor.
4. Verify against `references/definition-of-done.md` and quote the output.
5. Clean the diff, commit, then report before starting the next task.

Rules: one task per commit, structural and behavioral changes never in the same commit,
never start the next task while the previous one is unverified, and never fix something
you noticed but were not asked to fix — report it instead.

If you hit a ceiling, stop and emit a handoff packet using `team-escalation`. That is a
successful outcome.
