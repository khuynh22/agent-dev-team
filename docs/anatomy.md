# Anatomy

What a skill and an agent are made of, and which parts are load-bearing.

## Skill

```yaml
---
name: tdd-loop                    # must equal the directory name
description: Writes the failing test first, watches it fail for the right reason, then
  makes it pass with the smallest change. Use before implementing any feature or bug fix,
  when adding a regression test, or when a change needs proof it works. Refuses to write
  implementation code before a red test exists.
license: MIT
metadata:                         # free-form, spec-allowed, ignored by hosts
  phase: build
  owners: [software-engineer, senior-engineer, test-engineer]
  version: "0.1.0"
---
```

**Only six keys are legal:** `name`, `description`, `license`, `compatibility`, `metadata`,
`allowed-tools`. Anything else is a hard error on claude.ai upload and the Skills API:

```
Unexpected key(s) in SKILL.md frontmatter: argument-hint.
Allowed properties are: allowed-tools, compatibility, description, license, metadata, name
```

That is why tier and ownership live in `metadata` rather than as top-level keys, and why
`model` and `effort` appear only on agents. `scripts/validate.js` fails the build on a
seventh key.

### The description is the product

It is the only part a router sees before deciding. Three things it must do:

1. **Say what the skill does**, in one clause, with the concrete nouns.
2. **Say when to use it**, in the words a user would actually type. Not "use for testing
   concerns" but "before implementing any feature or bug fix".
3. **Not contain a neighbour's words.** `documentation` and `release-and-rollback` both
   used the word "runbook" during development, and the routing evals caught
   `release-and-rollback` winning "write a runbook for this alert". The fix was to the
   description, not to the eval.

Max 1024 characters. The combined description and `when_to_use` text is truncated at 1,536
characters in the skill listing, so the front of it matters most.

### The body

Under 500 lines. A workflow, not reference documentation. The pattern that works:

| Section | Job |
|---------|-----|
| Overview | Why this exists, in two or three sentences. Name the failure it prevents. |
| Process | Numbered steps with checkpoints. The core of the file. |
| Output format | A literal block the agent fills in. Structure travels; prose does not. |
| Verification | What must be true, phrased as things to check, not things to feel. |
| Red flags | The rationalizations, each with its rebuttal. |

The red-flag table is the part most often skipped and most often the reason a skill
changes behaviour. Generic advice does not survive contact with time pressure. A rebuttal
to the specific excuse being made right now sometimes does:

| Thought | Reality |
|---------|---------|
| "It is too small to test" | Small changes break things. The test costs a minute. |

Write the excuse in the words someone would actually think it, not in the words a
style guide would use.

## Agent

```yaml
---
name: senior-engineer             # must equal the filename
description: Implements ambiguous, cross-cutting, or risky changes...
tools: Read, Edit, Write, Grep, Glob, Bash
model: opus                       # sonnet | opus | haiku | fable | inherit
effort: high                      # low | medium | high | xhigh | max
color: blue
---

# Senior Engineer

**Tier:** T2 · **Escalates to:** principal-engineer · **Terminal:** no
```

The tier line is parsed by `scripts/validate.js`, which checks that every escalation target
exists, that only T3 roles are terminal, that terminal means "escalates to human", and that
no escalation path cycles.

Required sections: `## Accepts`, `## Refuses`, `## Escalates to`.

`## Refuses` is doing the most work. A role defined only by what it does will do anything.
The refusals are what make a tier a tier.

### Choosing model and effort

The lowest that can do the job. `intern-engineer` is `haiku` at `low` effort deliberately —
its value is being cheap and stopping, and a more capable model at T0 is more likely to
talk itself past the ceiling, not less.

| Role kind | Typical |
|-----------|---------|
| Mechanical execution | `haiku` / `low` |
| Ordinary implementation | `sonnet` / `medium` |
| Ambiguity, review, subsystems | `opus` / `high` |
| Arbitration, security, incidents, bring-up | `opus` / `xhigh` or `max` |

## Reference

`references/*.md` are checklists loaded on demand, cited from a skill or agent body as
`` `references/security-checklist.md` ``. The validator checks every such link resolves.

They exist so a workflow can stay under 500 lines while still having depth behind it. A
checklist inlined into six skills is six copies to keep in sync; cited from six skills, it
is one file that costs nothing until something points at it.

Order a checklist by how often each item is the actual answer, not by category. The
security checklist opens with trust boundaries and object-level authorization because those
are what the findings usually are — not because they come first alphabetically.
