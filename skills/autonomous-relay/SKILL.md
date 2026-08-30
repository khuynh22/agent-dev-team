---
name: autonomous-relay
description: Runs a tracker ticket through the whole lifecycle without stopping at each stage boundary - requirements, plan, build, review, release plan - with escalations routed to a terminal tier instead of to a waiting human. Use when a ticket already carries enough intent to work unattended, when nobody is available to answer stage-by-stage questions, or when the ask is to work an issue end to end and report back. Refuses to deploy, refuses to push, and refuses to resolve product intent on the human's behalf.
license: MIT
metadata:
  phase: build
  owners: [tech-lead, principal-engineer]
  version: "0.1.0"
---

# Autonomous Relay

The run takes a ticket and returns a branch that is committed, green, reviewed, and carries
a release plan. It does not deploy, does not push, and does not decide what the product
should do.

The value is not speed. It is that the human reads one report instead of answering nine
questions, and that every place the run supplied intent nobody gave it is written down.

## Before you start

The run needs a ticket. Fetch it by issue key where a tracker connector is available;
otherwise treat the argument as the ticket body.

Neither available is a stop, before any stage runs. Say which input was missing. Do not
invent a ticket from the repository state — a run with no ticket has no goal, and a goal
inferred from a codebase is the codebase's opinion of itself.

## The relay

Six stages. Each names its role, its workflow, and the artifact the next stage consumes.

1. **Requirements** — `product-manager` with `requirements-interview` and `spec-writing`,
   into `docs/specs/<date>-<topic>.md`.

   This stage carries the one override in the whole run. `requirements-interview` asks one
   question per message; unattended, there is nobody to ask, so state an assumption
   instead and tag it. Acceptance criteria derived from the ticket body or from the
   repository are tagged, per the assumption ledger in `references/autonomous-run.md`. A
   criterion the ticket actually stated is not an assumption and is not tagged.

2. **Plan** — `tech-lead` with `work-breakdown`, into `docs/plans/<date>-<topic>.md`.

   Every task gets a tier and a definition of done that is a runnable command. A task whose
   definition of done cannot be expressed as a command is a task that cannot be verified
   unattended; split it or escalate it.

3. **Build** — the tier each task was assigned, with `tdd-loop` inside
   `incremental-delivery`. One task at a time, red before green, whole suite green before
   the commit.

4. **Review** — the panel from `code-review-pass`: `code-reviewer` and `test-engineer`
   always, plus `security-auditor`, `performance-engineer`, `data-quality`, or
   `ux-reviewer` when the diff earns them. Reviewers do not see each other's findings
   first; shared context produces agreement rather than coverage.

5. **Release plan** — `sre` with `release-and-rollback`. A document, not a deployment. If
   the rollback question has no answer, that is a design problem and escalates rather than
   being written around.

6. **Report** — the run report block in `references/autonomous-run.md`.

## Escalation while unattended

A ceiling is still a ceiling. Nobody watching changes who receives the packet, not whether
one is owed.

Emit the same handoff packet defined in `references/escalation-ladder.md` and route it per
the redirect table in `references/autonomous-run.md`. The recipient is terminal and must
decide. Record every such decision, with its trigger, in the run report.

Do not restate the trigger table here or in the report. Two copies drift, and the copy an
agent happens to read will be the stale one.

## Abort

One condition: an open Critical finding from the review panel stops the run.

There is no task ceiling, no consult ceiling, and no wall-clock ceiling. The plan's task
list is the practical bound. The run report prints the task count and the consult count so
a ceiling can be set later from evidence rather than from guesswork.

An abort is not a failure to report. Emit the run report with `Outcome: aborted`, the
findings that caused it, and the branch left in place.

## Git

Branch from the default branch:

```
adt/<ticket-id>-<topic>
```

One commit per task. Structural and behavioural changes never share a commit. Nothing is
pushed and no pull request is opened — both are outward-facing, which is the first
escalation trigger, and the branch is the deliverable.

A run that aborts or pauses leaves the branch exactly where it stopped. Do not clean up
after yourself; the partial state is evidence.

## Report

Emit the run report block from `references/autonomous-run.md` verbatim, including on an
abort and on a pause.

The report is the only artifact anyone is guaranteed to read. Two fields carry most of its
weight: `Assumptions`, which is every place the run supplied intent nobody gave it, and
`Not done`, which is every place the run fell short. A report that is honest about both is
useful even when the run went badly. A report that is not is worse than no run at all.

## Red flags

| Thought | Reality |
|---------|---------|
| "Nobody is watching, so I can decide this" | Unattended changes the recipient, not the ceiling. Route it. |
| "The ticket implies the criteria, close enough" | Implied is derived. Tag it and move on. |
| "Review found a Critical but I can fix it quickly" | A Critical aborts the run. Report it. |
| "I finished, so a push would be helpful" | Push is outward-facing. It is trigger one. |
| "The suite is red for an unrelated reason" | Then the baseline was red and the plan was built on sand. Stop. |
| "No ticket, but the repo makes the goal obvious" | That is the repository's opinion, not a requirement. Stop. |
| "The report is long; I will summarise the assumptions" | The ledger is the point. Print every line. |
