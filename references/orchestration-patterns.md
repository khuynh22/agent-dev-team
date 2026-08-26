# Orchestration Patterns

How the team is actually composed on a task. Read together with
`references/escalation-ladder.md`, which defines who may do what.

## Choosing a shape

| Shape | Use when | Cost |
|-------|----------|------|
| Solo | One agent's ceiling covers the whole task | Lowest |
| Relay | Stages depend on each other: spec, then plan, then build | Linear |
| Panel | Independent perspectives on the same artifact, such as review | Parallel, high |
| Escalate | The work exceeded a ceiling mid-flight | Adds one hop |
| Delegate | A high tier decomposes and hands pieces down | Adds a brief per piece |

Default to solo. Every added agent costs a context transfer, and a context transfer is
where information is lost.

## Relay

The common lifecycle path. Each stage has a named output that the next stage consumes.

```
product-manager  -> requirements with acceptance criteria
tech-lead        -> task breakdown, each task with a definition of done
engineer of tier -> implementation with tests
code-reviewer    -> findings, severity-labelled
test-engineer    -> coverage gaps and the tests that close them
sre              -> release plan and rollback
```

A relay stage may reject its input. A `tech-lead` handed requirements with no acceptance
criteria sends them back rather than inventing them.

## Panel

Run independent reviewers over the same change, then merge. Use for pre-merge gates and
for design decisions where one perspective would miss a class of problem.

- Reviewers must not see each other's findings before producing their own. Shared context
  produces agreement, not coverage.
- Merge by severity, then de-duplicate by `file:line`.
- Disagreement between two reviewers is escalated to `principal-engineer`, not averaged.

Standard pre-merge panel: `code-reviewer`, `test-engineer`, `security-auditor`. Add
`performance-engineer` when a hot path changed, `ux-reviewer` when the interface changed.

## Delegate

A higher tier decomposes and hands work down. Each handed-down piece carries a
delegation brief (see the escalation ladder). Pieces must be independent; if two pieces
edit the same file, they are one piece.

Verification is the delegator's job. Work comes back with evidence, and the delegator
checks the evidence rather than trusting the summary.

## Fan-out limits

- Parallel agents that write must not share files. If they might, serialize them or give
  each an isolated worktree.
- More agents produce more findings, not better findings, past about three per artifact.
- Every parallel result needs a merge step that a single agent owns. Fan-out without a
  named merger produces a pile.

## Context transfer

The failure mode of every multi-agent shape is the transfer. Each handoff carries only
what the receiver needs, in writing:

- What was decided, and what is still open.
- The paths that matter, with line numbers.
- The command that verifies the work.
- What is explicitly out of scope.

Do not transfer a transcript. Transfer a conclusion.

## When not to orchestrate

- The task fits inside one agent's ceiling. Adding a reviewer to a typo fix is theatre.
- The task is exploratory and the shape is not yet known. Investigate first, then compose.
- The bottleneck is a missing decision from the human. No arrangement of agents produces
  a product decision.
