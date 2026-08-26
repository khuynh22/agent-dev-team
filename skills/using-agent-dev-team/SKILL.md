---
name: using-agent-dev-team
description: Routes an incoming engineering request to the right team member and the right workflow, and explains the tier system. Use at the start of any development work when it is unclear who should do it, which skill applies, or how much process a task deserves. Also use when a task turns out to be bigger than it looked and needs re-routing.
license: MIT
metadata:
  phase: meta
  owners: [tech-lead]
  version: "0.1.0"
---

# Using the Agent Dev Team

This is the entry point. It answers three questions: how much process does this deserve,
who should do it, and which workflow applies.

## Step 1: Classify the work

| Class | Looks like | Process |
|-------|-----------|---------|
| **Trivial** | A typo, a constant, a rename with known call sites | Do it. No ceremony. Still run the tests. |
| **Bounded** | A change to a flow that already exists in this repository | Clarify, short plan in chat, implement, verify |
| **Feature** | New behavior, several files, requirements not fully written | Requirements, breakdown, then build task by task |
| **Architectural** | New subsystem, changes a contract others depend on, hard to reverse | Requirements, ADR, breakdown, then build |
| **Incident** | Production is broken right now | Stop. Go to `incident-response`. |

When two classes fit, take the heavier one. The ratchet is one way: discovering hidden
complexity upgrades the class mid-task. Nothing downgrades it.

## Step 2: Route to a team member

| Situation | Agent |
|-----------|-------|
| Fuzzy ask, no written requirements | `product-manager` |
| Requirements exist, no plan | `tech-lead` |
| Fully specified, mechanical, at most two files | `intern-engineer` |
| Clear requirement, existing pattern to follow | `software-engineer` |
| Ambiguous, cross-cutting, or a migration | `senior-engineer` |
| Two designs disagree, or a subtle correctness bug | `principal-engineer` |
| A change is written and needs a gate | `code-reviewer`, then `test-engineer` |
| Touches auth, secrets, untrusted input, crypto | `security-auditor` |
| Measured slowness or a missed budget | `performance-engineer` |
| Deploy, rollback, alerting, runbook | `sre` |
| Production broken right now | `incident-commander` |
| MCU, RTOS, driver, memory budget | `firmware-engineer` |
| New board, boot failure, signal-level bug | `board-bringup-engineer` |
| Component, state, layout, Core Web Vitals | `frontend-engineer` |
| Usability, accessibility, interface copy | `ux-reviewer` |
| README, ADR, runbook, changelog | `docs-engineer` |

**Route to the lowest tier that clears the ceiling.** Over-assignment is not caution; it
hides the fact that the brief is too vague, and it costs more.

## Step 3: Pick the workflow

| Phase | Skill | When |
|-------|-------|------|
| Define | `requirements-interview` | The ask is fuzzy |
| Define | `spec-writing` | Requirements exist and need a written spec |
| Plan | `work-breakdown` | A spec needs splitting into verifiable tasks |
| Plan | `architecture-decision` | A non-obvious technical choice needs recording |
| Plan | `api-design` | An interface others will depend on is being designed |
| Build | `tdd-loop` | Any implementation |
| Build | `incremental-delivery` | Executing a multi-task plan |
| Build | `frontend-build` | The change is user interface |
| Build | `firmware-build` | The change runs on a microcontroller |
| Verify | `systematic-debugging` | Something is broken and the cause is unknown |
| Verify | `browser-verification` | A UI change needs real-browser confirmation |
| Review | `code-review-pass` | A diff needs a gate |
| Review | `simplification-pass` | Code is more complex than the problem |
| Review | `security-hardening` | A trust boundary is involved |
| Review | `performance-pass` | Something is measurably slow |
| Ship | `release-and-rollback` | Getting it into production |
| Ship | `incident-response` | Production is broken |
| Ship | `documentation` | Docs are missing, stale, or wrong |
| Meta | `team-escalation` | A task exceeded the current tier's ceiling |

## Step 4: Work

1. Announce the class, the agent, and the skill in one line, so the human can override it
   before work starts.
2. Follow the skill. If it has a checklist, track it.
3. Verify with evidence. Quote what you ran and what it printed.
4. If you hit a ceiling, stop and use `team-escalation`. Escalating with a handoff packet
   is the system working, not a failure.

## Finding the reference files

Skills and roles cite checklists as `references/<name>.md`. That path is relative to the
**agent-dev-team installation**, not to the project you are working in, so a plain read
from a project directory will miss.

Resolve it once, at the start of a session that needs one, and reuse the answer:

1. If the harness exposes a plugin root variable, `references/` sits directly under it.
2. Otherwise search for `**/references/escalation-ladder.md` across the installation
   directory — `~/.claude/plugins/`, `~/.claude/skills/`, or wherever the repository was
   cloned.
3. Under a copy-mode install the directory is `~/.claude/skills/adt-references/`.

A checklist that cannot be found is not a reason to skip it. Say you could not load it and
work from the process in the skill body, which is self-contained.

## Red flags

| Thought | Reality |
|---------|---------|
| "I know what to do, I'll skip routing" | Routing takes ten seconds and prevents the wrong tier doing the work. |
| "I could not find the checklist, so I skipped that step" | Say so. The skill body carries the process; the checklist adds depth. |
| "I'll assign it senior to be safe" | Over-assignment hides a vague brief. Fix the brief. |
| "It grew but I'm almost done" | Re-classify. Hidden complexity upgrades the class mid-task. |
| "No skill fits exactly" | Take the nearest. Partial process beats none. |
| "The human is in a hurry, skip the gates" | Urgency is when gates pay. Say what you skipped, if you must skip. |
