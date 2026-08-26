---
name: architecture-decision
description: Records a non-obvious technical choice as an ADR with context, options, the decision, consequences, and the condition that should reopen it. Use when choosing between technologies or designs, when a decision is expensive to reverse, or when someone will ask in six months why it was done this way. Also use to review a proposed design.
license: MIT
metadata:
  phase: plan
  owners: [tech-lead, principal-engineer]
  version: "0.1.0"
---

# Architecture Decision

Write an ADR when the choice is not obvious, is expensive to reverse, or will be
questioned later. Do not write one for a choice with an obvious default; that is
paperwork, and it dilutes the record.

## Decide whether it needs one

| Write an ADR | Skip it |
|--------------|---------|
| Two defensible options with different consequences | One option, obvious default |
| Expensive or slow to reverse | Cheap to change next week |
| Constrains future work | Local to one function |
| Deviates from a convention in this repository | Follows the existing pattern |
| Someone will ask why in six months | Nobody will ever ask |

## Process

1. **State the decision as a question.** "Which queue?" is a question. "Use Kafka" is an
   answer looking for justification, and it will find one.

2. **Establish the forces.** What is actually in tension: throughput against operational
   cost, consistency against latency, today's simplicity against tomorrow's migration.
   If you cannot name a tension, there is no decision here, only a default.

3. **Constrain by what is true here.** Team size and operational capacity, existing
   infrastructure, real data volume, latency and durability requirements, cost, compliance.
   Most technology debates dissolve once the actual numbers are on the table.

4. **List real options,** including "do nothing" and "use what we already run". Options
   nobody would choose do not belong; a straw man makes the record worthless.

5. **Compare on the axes that distinguish them.** Not a feature matrix. Two options that
   score the same on nine axes and differ on the tenth are decided by the tenth.

6. **Decide.** Then write the rejected option's strongest argument fairly, because that is
   the argument someone will make again later.

7. **Write the consequences,** including what becomes hard.

8. **Write the revisit condition** as an observable trigger, not a date.

## Format

```markdown
# ADR <n>: <the decision>

- **Status:** proposed | accepted | superseded by ADR <n>
- **Date:** <YYYY-MM-DD>
- **Deciders:** <who>

## Context
<the forces; what is true here that makes this a decision rather than a default>

## Constraints
<the numbers and limits that actually narrow the field>

## Options
### A. <name>
<what it is; the trade-off that distinguishes it>
### B. <name>

## Decision
<what will be done, stated as a decision>

## Rejected
<the losing option and its strongest argument>

## Consequences
- Becomes easy:
- Becomes hard:
- Becomes expensive to reverse:

## Revisit when
<observable condition>
```

## Reviewing someone else's design

Ask, in order:

1. What breaks first as this grows? At what number?
2. What happens when each dependency is slow, then unavailable?
3. Where is the state, and who owns it? Two owners is the bug.
4. What is the migration path from what exists today?
5. What is the simplest thing that would work, and what does this buy over it?
6. How is it observed, and how is it rolled back?

Question five is the one that most often changes the design. Ask it even when the design
is good.

## Verification

- The decision is stated as a decision, not a preference or a comparison.
- Constraints include real numbers, not adjectives.
- The rejected option's best argument is written down fairly.
- Consequences include what becomes hard, not only what becomes easy.
- The revisit condition is observable.

## Red flags

| Thought | Reality |
|---------|---------|
| "Everyone uses this, so it is right" | For their constraints. Write yours down and check. |
| "We might need that scale later" | Design for the scale you can measure, plus a migration path. |
| "I'll list the options and decide later" | Later has less context and more pressure. Decide now. |
| "The trade-offs are obvious" | Then the ADR takes five minutes. Write it; the reader in six months is not you. |
| "This is the modern approach" | Modern is not a force. Name the tension it resolves. |
| "We can always change it" | Then it may not need an ADR. If you cannot, that is exactly why it does. |
