---
name: team-escalation
description: Hands work up to a higher tier, or down to a lower one, with a structured packet so no context is lost. Use when a task exceeds the current agent's ceiling, when a brief is too vague to execute, when two agents disagree, or when decomposing work for someone else to do. Escalating correctly is a successful outcome, not a failure.
license: MIT
metadata:
  phase: meta
  owners: [tech-lead, principal-engineer]
  version: "0.1.0"
---

# Team Escalation

The ladder only works if the handoffs are structured. An escalation that is a shrug
transfers the problem plus the loss of everything the first agent learned.

Full ceilings and trigger definitions: `references/escalation-ladder.md`.

## When to escalate up

Any one of these fires, regardless of tier or confidence:

1. **Irreversibility** — data deletion, a released API, a migration with no rollback, an
   outward-facing publish.
2. **Blast radius** — the change can break something you have not read.
3. **Security surface** — authentication, authorization, secrets, cryptography, or input
   crossing a trust boundary.
4. **Unknown-unknowns** — two or more unresolved unknowns after one honest investigation
   pass. One unknown is research; two means you are at the wrong altitude.
5. **Contract change** — a caller outside your change set would have to be edited.
6. **Cost** — the work is materially larger than the brief implied.
7. **Incomplete brief** — for a T0, any missing brief field is an immediate escalation.

Confidence is not a counter-trigger.

## Escalating up

1. **Stop.** Do not "finish the part you can" if that part bakes in the decision you are
   escalating. Leave the tree in a state the next agent can read.
2. **Reduce it to one question.** Two questions means the work was not decomposed. Split
   the handoff or ask the more blocking one.
3. **Gather evidence.** The decisive quoted line, not the log.
4. **Emit the packet.** Verbatim, so the receiver can parse it.

```markdown
## HANDOFF
- **From:** <agent-name> (T<n>)
- **To:** <agent-name> (T<n>)
- **Trigger:** irreversibility | blast-radius | security-surface | unknown-unknowns | contract-change | cost | incomplete-brief
- **Task as given:** <one sentence>
- **Done so far:** <committed or in the working tree; "nothing" is valid>
- **Files touched:** <path:line list, or "none">
- **Blocking question:** <one decision, answerable yes/no or A/B>
- **Options considered:** <A / B, and which you would pick and why>
- **Reversibility:** reversible | reversible-with-effort | irreversible
- **Evidence:** <quoted output>
```

5. **Route.** One tier up, unless the trigger names a specialist: security surface goes to
   `security-auditor`, a measured regression to `performance-engineer`, a release concern
   to `sre`. Do not skip tiers to save time; the skipped tier is usually the one that
   would have solved it cheaply.

## Delegating down

Work handed down without a complete brief comes back wrong, and that is the delegator's
defect.

```markdown
## BRIEF
- **To:** <agent-name> (T<n>)
- **Goal:** <one sentence, in observable behavior>
- **Files in scope:** <explicit paths>
- **Pattern to follow:** <path:line of code to copy the shape of>
- **Definition of done:** <the exact command that must pass>
- **Out of scope:** <what to leave alone even if it looks wrong>
- **Stop condition:** <what makes you stop and escalate>
```

Every field is required for a T0. `Pattern to follow` may be omitted at T1 and above when
the pattern is obvious from surrounding code.

Delegated work returns with evidence. The delegator checks the evidence, not the summary.

## Receiving an escalation

1. Answer the blocking question first, before re-doing the work. The sender needs a
   decision, not a rescue.
2. If the packet is incomplete, ask for the missing field rather than guessing. One round
   trip is cheaper than a wrong decision.
3. Decide whether to answer and hand back down, or absorb the task. Prefer handing back:
   the sender has the context loaded.
4. If you are terminal (T3) you must produce a decision. A referral is not an answer.

## Verification

- The packet has every field, and the blocking question is exactly one question.
- "Done so far" is true, and no untested code is described as working.
- Evidence is quoted output, not a characterisation of output.
- The route is one tier up or a named specialist, not a skip to the top.

## Red flags

| Thought | Reality |
|---------|---------|
| "I'll finish what I can first" | Not if it bakes in the decision you are escalating. |
| "Escalating early looks bad" | Escalating early with a packet is the highest-value thing a low tier does. |
| "I'll just ask the human" | The human answers intent, cost, and risk. Technical questions go up the ladder. |
| "I'll escalate the whole task" | Escalate the decision. Handing up a shrug loses everything you learned. |
| "Two questions, but they are related" | Then answer the one that unblocks and re-ask the other after. |
| "I'll go straight to principal, it is complex" | The skipped tier is usually the one that solves it cheaply. |
