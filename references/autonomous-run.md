# Autonomous Runs

An autonomous run works a ticket through the lifecycle with nobody available to answer at
each stage boundary. This file changes exactly one thing: who receives an escalation when
no human is watching. It does not change a ceiling, a trigger, or the shape of the handoff
packet. `references/escalation-ladder.md` remains authoritative for all three, and an agent
that reads this file without reading that one has the wrong half.

## Escalation redirect

A handoff packet from T0, T1, or T2 is routed to a terminal tier rather than halting the
run.

| Trigger | Recipient under an autonomous run |
|---------|-----------------------------------|
| irreversibility | `principal-engineer` |
| blast-radius | `principal-engineer` |
| unknown-unknowns | `principal-engineer` |
| contract-change | `principal-engineer` |
| cost | `principal-engineer` |
| incomplete-brief | `principal-engineer` |
| security-surface | `security-auditor` |
| a measured regression | `performance-engineer` |
| a release concern | `sre` |

The packet format is unchanged. Emit the same block, with the same fields and the same
one blocking question; only the recipient differs.

The recipient is terminal and must decide. "It depends" is not a deliverable here any more
than it is anywhere else, and a terminal tier that hands the question sideways to another
agent has failed.

Every decision made this way is recorded in the run report, paired with the trigger that
caused it. A run that consulted a terminal tier four times and reports none of them has
hidden the four most interesting things that happened.

## What reaches the human

Only a T3's own escalation, and only on the three grounds the ladder already permits a T3
to escalate: product intent, cost materially above the brief, and risk appetite.

That pauses the run. It does not unwind completed work. The branch stays where it is, with
its commits intact, and the report says which stage stopped and what question is open.

## Assumption ledger

Every value the run derived rather than received is tagged where it is written.

```
1. [GIVEN]   Export includes a header row
2. [ASSUMED] Export finishes within 30s for 10k rows
3. [ASSUMED] A failure emails the requester
```

The tag applies to acceptance criteria the ticket did not state, and to any
definition-of-done command the ticket did not name. Both are things a human would have been
asked for, had one been there.

Every `[ASSUMED]` line is reprinted at the top of the run report. The ledger is what makes
an unattended run auditable rather than merely fast: it is the list of places where the run
supplied intent that nobody gave it.

## Run report

Emit this block verbatim at the end of every run, including one that aborted or paused.

```markdown
## RUN REPORT
- **Ticket:** <id or first line of the body>
- **Branch:** <branch name>
- **Outcome:** completed | aborted | paused
- **Assumptions:** <every [ASSUMED] line, or "none">
- **T3 decisions:** <trigger -> decision, one per line, or "none">
- **Commits:** <count and one-line subjects>
- **Verification:** <the command run, and the decisive output line>
- **Review verdict:** <approve | request-changes, with counts by severity>
- **Release plan:** <path, or why none>
- **Not done:** <what was skipped or left open, or "nothing">
```

`Not done` is never omitted, and never reads "nothing" when something was skipped. This is
non-negotiable 5 in `AGENTS.md`: scaling the work down is the human's call, and a report
that quietly narrows the scope takes that call away from them.

`Verification` quotes output. A run that asserts the suite passed without the line that
says so has reported a belief, not a result.
