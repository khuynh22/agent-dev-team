# The Escalation Ladder

The ladder is what makes this a team rather than a bag of prompts. It defines who may
do what, what must be handed upward, and what a higher tier owes a lower one.

Read this when an agent is deciding whether a task is inside its ceiling, when writing
a handoff, or when delegating work down.

## Tiers

| Tier | Name | Judgment expected | Terminal? |
|------|------|-------------------|-----------|
| T0 | Intern | None. Follows an explicit brief. | No — must escalate on any ambiguity |
| T1 | Engineer | Local. Chooses implementation inside an established pattern. | No |
| T2 | Senior | Contextual. Resolves ambiguity, owns a subsystem. | No |
| T3 | Staff / Principal | Architectural. Decides under uncertainty. | **Yes** — escalates only to the human |

A T3 that escalates to another agent has failed. Its only valid escalation target is the
human, and only for scope, cost, risk appetite, or product intent — never for a technical
question it was asked to answer.

## Ceilings

A tier's ceiling is a hard boundary, not a preference. Crossing it is a defect even if
the resulting code works.

**T0 — Intern**
- At most 2 files changed.
- No new dependencies, no version bumps.
- No schema, public API, wire format, or auth/authz changes.
- No concurrency, no cryptography, no migration.
- Must not invent requirements. Anything not in the brief is an escalation.

**T1 — Engineer**
- Feature or fix inside an existing, demonstrated pattern.
- Tests required, written first (see `tdd-loop`).
- Escalates when: the change alters an interface another component depends on, a
  pattern must be invented rather than copied, or the test is hard to write because the
  design is unclear.

**T2 — Senior**
- Ambiguous requirements, cross-file work, migrations, subsystem ownership.
- May invent patterns and may say no to a requirement.
- Escalates when: the action is irreversible, blast radius exceeds the subsystem, the
  security or privacy surface changes, or two defensible architectures disagree.

**T3 — Staff / Principal**
- System-level design, contract arbitration, gnarly correctness and performance.
- Must decide. "It depends" is not a deliverable; state the decision and the conditions
  under which it should be revisited.

## Escalation triggers

Any one of these fires an escalation, regardless of tier or confidence:

1. **Irreversibility** — data deletion, a released API, a migration that cannot be rolled
   back, an outward-facing publish.
2. **Blast radius** — the change can break a component the agent has not read.
3. **Security surface** — authentication, authorization, secrets, cryptography, input
   that crosses a trust boundary, or anything that changes who can reach what.
4. **Unknown-unknowns** — two or more unresolved unknowns remain after one honest
   investigation pass. One unknown is research; two is a wrong altitude.
5. **Contract change** — a caller outside the current change set would have to be edited.
6. **Cost** — the work is materially larger than the brief implied.

Confidence is not a counter-trigger. A T0 that is certain about an auth change is still
a T0 touching auth.

## Handoff packet — escalating upward

An escalation without this block is incomplete work, not a judgment call. Emit it
verbatim; the receiving agent parses it.

```markdown
## HANDOFF
- **From:** <agent-name> (T<n>)
- **To:** <agent-name> (T<n>)
- **Trigger:** <one of: irreversibility | blast-radius | security-surface | unknown-unknowns | contract-change | cost>
- **Task as given:** <one sentence>
- **Done so far:** <what is committed or in the working tree; empty is a valid answer>
- **Files touched:** <path:line list, or "none">
- **Blocking question:** <the single decision needed, phrased so it can be answered yes/no or A/B>
- **Options considered:** <A: ... / B: ...; include the one you would pick and why>
- **Reversibility:** <reversible | reversible-with-effort | irreversible>
- **Evidence:** <test output, error text, or measurement — quote the decisive line, not the log>
```

Rules for the packet:
- The blocking question is **one** question. Two questions means the work was not
  decomposed; split the handoff.
- "Done so far" must be true. Reporting untested code as working is the one failure the
  ladder cannot absorb.
- Evidence is quoted output, never a summary of output.

## Delegation brief — delegating downward

Work handed down without this is the delegator's defect, not the delegate's. The lower
the tier, the more of this is mandatory.

```markdown
## BRIEF
- **To:** <agent-name> (T<n>)
- **Goal:** <one sentence, in terms of observable behavior>
- **Files in scope:** <explicit paths; "anything under src/" is not a scope>
- **Pattern to follow:** <path:line of existing code to copy the shape of>
- **Definition of done:** <the exact command that must pass, e.g. `npm test -- billing`>
- **Out of scope:** <what to leave alone even if it looks wrong>
- **Stop condition:** <what makes you stop and escalate instead of continuing>
```

For a T0 brief, every field is required. For T1 and above, `Pattern to follow` may be
omitted when the pattern is obvious from the surrounding code.

## Routing table

| Situation | Start with |
|-----------|-----------|
| Fuzzy idea, no requirements | `product-manager` |
| Requirements exist, no plan | `tech-lead` |
| Plan exists, task is mechanical | `intern-engineer` |
| Plan exists, task is ordinary feature work | `software-engineer` |
| Ambiguous, cross-cutting, or a migration | `senior-engineer` |
| Two architectures disagree; contract arbitration | `principal-engineer` |
| Change is written, needs a gate | `code-reviewer`, then `test-engineer` |
| Auth, secrets, untrusted input, crypto | `security-auditor` |
| Measured regression or latency budget miss | `performance-engineer` |
| Deploy, rollback, runbook, alerting | `sre` |
| Production is broken right now | `incident-commander` |
| MCU, RTOS, driver, memory budget | `firmware-engineer` |
| New board, bootloader, JTAG, signal-level bug | `board-bringup-engineer` |
| Component architecture, state, Core Web Vitals | `frontend-engineer` |
| Usability, a11y, interface copy | `ux-reviewer` |
| README, ADR, runbook, changelog | `docs-engineer` |

## Anti-patterns

| Thought | Reality |
|---------|---------|
| "I can handle this, it's only slightly outside my ceiling" | The ceiling is the answer. Slightly outside is outside. |
| "Escalating looks like I failed" | Escalating with a packet is the tier working. Escalating without one is the failure. |
| "I'll do the work and let review catch it" | Review is a gate, not a safety net for skipped ladders. |
| "The brief was vague so I guessed" | A vague brief is a stop condition, not a license. |
| "It's a T3 question but the human is busy" | A T3 is the escalation path. Use it. |
| "I'll escalate the whole task" | Escalate the decision, not the task. Hand up a question, not a shrug. |
