---
description: Run a ticket end to end unattended, from requirements to a reviewed branch and a release plan
argument-hint: [ticket id or ticket body]
---

Run this ticket unattended: $ARGUMENTS

Use the `autonomous-relay` skill. The policy that governs an unattended run — who receives
an escalation, what gets tagged as an assumption, and the report you must emit — is in
`references/autonomous-run.md`.

**Get the ticket first.** Fetch it by issue key if a tracker connector is available,
otherwise treat the argument as the ticket body. If neither is possible, stop before the
first stage and say which input was missing. Do not infer a goal from the repository.

Then run all six stages without stopping between them:

1. `product-manager` — requirements with acceptance criteria. There is nobody to
   interview, so state assumptions instead of asking, and tag every criterion you derived
   rather than received.
2. `tech-lead` — the task breakdown, each task with a tier and a definition of done that is
   a runnable command.
3. `software-engineer` or `senior-engineer` per the tier each task was assigned — build it,
   test first, one verified commit per task.
4. `code-reviewer` and `test-engineer` — the review panel, plus a specialist when the diff
   earns one.
5. `sre` — the release plan. A document, not a deployment.
6. The report.

**Escalations do not stop the run.** A packet from below T3 routes to a terminal tier,
which must decide; record each decision with its trigger. Only a T3's own escalation on
intent, cost, or risk pauses the run and reaches me.

**Abort on one condition only:** an open Critical from the review panel.

**Git:** branch from the default branch as `adt/<ticket-id>-<topic>`, one commit per task,
no push and no pull request.

End with the run report block from `references/autonomous-run.md`, filled in. Never omit
the assumptions or what was left not done.
