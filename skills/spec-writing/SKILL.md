---
name: spec-writing
description: Turns gathered requirements into a written specification that an implementer can build from without asking follow-up questions. Use when requirements are known but not written down, before starting a feature that spans several tasks, or when a spec needs reviewing for gaps and contradictions. Produces a committed document, not a chat message.
license: MIT
metadata:
  phase: define
  owners: [product-manager, tech-lead]
  version: "0.1.0"
---

# Spec Writing

A spec exists so that implementation does not require the author to be available. The test
of a spec is not whether it is complete; it is whether someone else can build from it and
arrive at the same thing.

If requirements are not yet gathered, use `requirements-interview` first.

## Scope check before you write

If the request contains several independent subsystems, do not write one spec. Decompose
it, state the pieces and their dependency order, and spec the first piece. A spec spanning
four subsystems produces a plan nobody can execute and a review nobody can do.

Test: can one implementer, working alone, take this from start to verifiable in a
bounded amount of work? If not, split.

## Structure

```markdown
# <Feature>

## Problem
<why this exists; the cost of not doing it>

## Goals
## Non-goals
<the adjacent things explicitly out of scope, and why>

## Requirements
<numbered, each observable from outside the system>

## Design
<the shape of the solution: components, responsibilities, boundaries, data flow>

## Interfaces
<each contract this creates or changes, with its shape and its compatibility story>

## Data
<what is stored, in what shape, what migrates, what is retained and for how long>

## Error handling
<what fails, what the caller sees, what is retried, what is logged>

## Security
<trust boundaries, authorization, what is untrusted>

## Testing
<what gets tested, at what level, what the acceptance test is>

## Rollout
<flags, sequencing, rollback, and how you will know it is working>

## Acceptance criteria
<Given / when / then, each verifiable by someone who has not read the code>

## Open questions
| Question | Who answers | Blocking? |
```

Scale each section to its risk. A section that says "nothing special" is a real answer and
better than three paragraphs of filler; delete the section instead if truly nothing
applies, and say so in one line.

## Writing rules

- **Observable, not internal.** A requirement that can only be checked with a debugger is
  not a requirement.
- **Decide, do not survey.** A spec that lists three options has deferred the work to the
  implementer, who has less context.
- **Name the boundaries.** Each component: what it does, how it is used, what it depends
  on. If you cannot say what a component does in one sentence, it does too much.
- **Write the error paths.** Most specs describe only success, and most implementation
  time goes to the rest.
- **Prefer smaller units.** A design where each piece can be understood and tested alone
  survives contact with implementation; a design that must be held whole does not.

## Self-review before handing it over

Read it fresh and fix inline:

1. **Placeholders.** Any TBD, TODO, or vague requirement. Resolve or mark it blocking.
2. **Contradictions.** Does the design section match the requirements section? Does the
   data model support every stated requirement?
3. **Ambiguity.** Could any requirement be read two ways? Pick one and say it explicitly.
4. **Scope.** Still one implementable unit?
5. **Verifiability.** Could an implementer tell, from this document alone, when they are
   done?

## Verification

- Every requirement has an acceptance criterion.
- Every interface states its compatibility story.
- Error handling is present and specific.
- No TBD remains, or each remaining one is listed as blocking with an owner.
- Committed to the repository, not left in a chat message.

## Red flags

| Thought | Reality |
|---------|---------|
| "The implementer can figure out the details" | The implementer has less context than you. Decide now. |
| "I'll list the options and let them choose" | That is deferring the decision downhill. |
| "This spec covers the whole platform" | Then it covers nothing implementable. Decompose. |
| "Error handling is standard" | Write what the caller sees. Standard means different things in different modules. |
| "It is written, we are done" | Read it again cold. Half the contradictions are only visible on the second pass. |
