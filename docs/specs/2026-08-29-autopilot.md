# Autopilot: unattended relay from ticket to release plan

**Status:** approved, not yet built
**Date:** 2026-08-29

## Problem

The team runs as a relay today: `/team`, `/spec`, `/plan`, `/build`, `/review`, `/ship`.
Every stage boundary is a stop. `/team` waits for confirmation before routing. `/spec`
asks one question per message. `/build` reports after each task. Any agent below T3 that
meets an escalation trigger emits a handoff packet and halts.

That is correct for interactive work and wrong for a ticket that already says what it
wants. A tracker issue with acceptance criteria carries enough intent to reach a reviewed
branch without a human in the loop for each hop.

Nothing in the repository supports an unattended run. There is no command, no policy for
what an escalation does when no human is watching, and no record of what an agent assumed
while nobody was there to ask.

## Goal

One command takes a ticket and returns a branch that is committed, green, reviewed, and
carries a release plan. The human reads the result, not the steps.

## Non-goals

- Deploying. `/ship` writes a release plan; it does not execute one. Autopilot inherits
  that boundary.
- Pushing or opening a pull request. Both are outward-facing, which is escalation trigger
  1. The branch stays local.
- Replacing the interactive commands. Autopilot composes them; it does not supersede them.
- Making product decisions. `references/orchestration-patterns.md` already states that no
  arrangement of agents produces one. Autopilot records assumptions instead of pretending
  to resolve intent.

## Decisions

### D1 — Escalation redirects to T3 rather than to the human

A handoff packet from T0, T1, or T2 routes to `principal-engineer`. Where the trigger
names a specialist, it routes there instead: `security-surface` to `security-auditor`, a
measured regression to `performance-engineer`, a release concern to `sre`.

T3 is terminal and must decide. The packet format in `references/escalation-ladder.md` is
unchanged; only its recipient changes.

Only a T3's own escalation reaches the human, and only on the three grounds the ladder
already permits a T3 to escalate: product intent, cost materially above the brief, and
risk appetite. That pauses the run. It does not unwind completed work.

**Why not one tier at a time.** The ladder warns that every context transfer loses
information. T1 to T2 to T3 costs two transfers to reach the same decider.

**Why not stop on every security surface.** Most authentication-adjacent tickets would
never finish unattended, which removes the reason to have the command. `security-auditor`
is T3 and terminal; routing to it is already the strongest available gate.

### D2 — The relay runs spec through ship

```
ingest   ticket
spec     product-manager      docs/specs/<date>-<topic>.md
plan     tech-lead            docs/plans/<date>-<topic>.md
build    tier per task        commits on a branch
review   panel                findings and a verdict
ship     sre                  release plan document
report   to the human
```

`/ship` is included because it produces a document rather than an action. The rollback
question it forces is worth answering while the context is still loaded.

### D3 — Derived acceptance criteria are marked, not hidden

`/plan` refuses requirements that carry no acceptance criteria, and that refusal stays.
Autopilot satisfies it at the spec stage: `product-manager` derives acceptance criteria
from the ticket body and the repository, and tags each one.

```
1. [GIVEN]   Export includes a header row
2. [ASSUMED] Export finishes within 30s for 10k rows
3. [ASSUMED] A failure emails the requester
```

Every `[ASSUMED]` line is reprinted at the top of the final report. The same tag applies
to any definition-of-done command the ticket did not name.

This is the single point where autopilot overrides a documented behaviour of an existing
skill: `requirements-interview` asks one question per message, and under autopilot it
states an assumption instead. The override is written in the new skill. It does not edit
`requirements-interview`, which stays correct for interactive use.

### D4 — One abort condition

Once the run has started, an open Critical finding from the review panel is the only thing
that aborts it. A missing ticket (D6) is an input failure that prevents the run from
starting, not an abort.

There is no task ceiling, no consult ceiling, and no wall-clock ceiling. The plan's task
list is the practical bound. This is a deliberate choice to keep the first version simple;
the report prints the counts so a ceiling can be added later from evidence rather than
from guesswork.

### D5 — A branch, no push

```
git checkout -b adt/<ticket-id>-<topic>
```

Branched from the default branch. One commit per task, structural and behavioural changes
never in the same commit, both inherited from `incremental-delivery` unchanged. Nothing is
pushed. A run that aborts leaves the branch in place with its commits intact.

### D6 — Ticket input degrades gracefully

The argument is an issue key when a tracker connector is available, and the ticket body
otherwise. Neither available means the run stops before the spec stage and says which
input it lacked.

The repository ships to tools that have no tracker connector, so the skill must not depend
on one.

### D7 — The contract lives in a skill, not in the command

Every command in this repository is a thin shim over one or more skills. Autopilot follows
that shape: `.claude/commands/autopilot.md` dispatches, `skills/autonomous-relay/` holds
the workflow, and `references/autonomous-run.md` holds the long-form policy.

A skill is also the portable unit. Reference files resolve relative to the installation
directory and do not travel to the Skills API; a skill does.

## Files

| File | Change |
|------|--------|
| `skills/autonomous-relay/SKILL.md` | new, the workflow |
| `references/autonomous-run.md` | new, escalation redirect and report shape |
| `.claude/commands/autopilot.md` | new, command shim |
| `commands/autopilot.toml`, `.gemini/commands/autopilot.toml` | generated |
| `AGENTS.md` | routing row, autonomy section |
| `README.md`, `CLAUDE.md`, `GEMINI.md` | command list |
| `docs/anatomy.md`, `docs/getting-started.md`, `docs/test-plan.md` | new command and its tests |
| `CHANGELOG.md` | entry |
| `evals/cases/` | routing cases |

No new agent. The relay uses the existing roster.

## Constraints from the validator

`scripts/validate.js` enforces the following, and the build must satisfy them:

- Skill frontmatter accepts only `name`, `description`, `license`, `compatibility`,
  `metadata`, `allowed-tools`. `metadata.phase` is required and `metadata.owners` must
  name real agents.
- A skill's `name` must equal its directory name. The body is capped at 500 lines.
- In a command body, every backticked token matching `[a-z][a-z0-9-]{3,}` must be an
  existing skill or agent name. Invented terms in backticks fail the build.
- Every reference path written as `references/<name>.md` must exist.
- `AGENTS.md` must mention every agent and every skill name in backticks.

## Verification

`npm test` runs static validation, the evals, and a command-shim freshness check.

New eval cases:

1. A request to run a ticket unattended routes to `autonomous-relay`.
2. A T1 that meets a contract-change trigger during an unattended run routes to
   `principal-engineer`, not to the human.
3. A T3 that meets a product-intent trigger routes to the human.
4. A ticket with no acceptance criteria produces marked assumptions rather than a stop.

## Risks

**The report is the only artifact anyone reads.** If it hides an assumption or overstates
what was verified, the whole run is worse than useless. The report shape is therefore
specified in the reference file, not left to the agent, and it must state what was not
done as well as what was.

**No budget ceiling.** A run that thrashes has no upper bound short of the plan's task
list. Accepted for the first version; the report's counts are the evidence for setting a
ceiling later.

**Skill-count growth.** This adds a twenty-sixth skill. Justified because the autonomy
contract is a workflow, and workflows are skills in this repository.
