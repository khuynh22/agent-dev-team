---
name: incremental-delivery
description: Executes a multi-task plan one task at a time, keeping every commit atomic and green before starting the next. Use when working through a task list, when a change is large enough to need checkpoints, when commit hygiene matters for bisect, or when tempted to build several things at once. Refuses to begin the next task while the previous one is unverified.
license: MIT
metadata:
  phase: build
  owners: [software-engineer, senior-engineer]
  version: "0.1.0"
---

# Incremental Delivery

One task. Verified. Committed. Then the next. The value is not tidiness; it is that when
something breaks you know which change did it, and you have a green commit to return to.

## The loop, per task

1. **Read the brief.** Goal, files in scope, definition of done, out of scope, stop
   condition. If a field is missing and you are a low tier, escalate now, not later.
2. **Run the definition-of-done command first,** to get the baseline. If it already fails,
   stop: that is not your bug and fixing it silently hides someone else's regression.
3. **Implement via `tdd-loop`.** Red, green, suite, refactor.
4. **Verify** against `references/definition-of-done.md`. Quote the output.
5. **Clean the diff.** Debug output, stray logs, anything outside the brief.
6. **Commit,** with a message that says what changed and why, in a line a reader can scan.
7. **Report** before starting the next task: what was done, the evidence, and anything you
   noticed but did not touch.
8. **Next task.**

## What must not happen

- Two tasks in one commit. When the second one is wrong you cannot revert the first.
- Starting task N+1 while task N is unverified. This is how a plan turns into one large
  unreviewable change.
- Fixing an unrelated thing you noticed. Report it; do not touch it. If it blocks you, it
  is an escalation, not a side quest.
- Continuing past a red suite. A red suite means stop, in every case.

## Commit hygiene

- One logical change per commit.
- Structural change and behavioral change never in the same commit. A diff that moves code
  and changes it at once cannot be reviewed, only trusted.
- The message states the change and the reason. It does not restate the diff.
- Every commit leaves the tree green. A commit that only builds when combined with the
  next one destroys bisect, and bisect is the reason for the discipline.

## When the plan turns out to be wrong

It will. Do not silently improvise around it.

1. Stop at the current green commit.
2. State what the plan assumed and what turned out to be true.
3. Route it: a small correction goes back to the plan's author; a structural one is an
   escalation with a handoff packet.
4. Resume when the plan is updated.

Improvising past a wrong plan produces work nobody reviewed against anything.

## Progress reporting

```markdown
### <task id> — done
- **Changed:** <files>
- **Evidence:** <the DoD command and its quoted output>
- **Noticed, not touched:** <out-of-scope observations>
- **Next:** <task id>
```

Report after every task. A silent run of six tasks is one big change with extra steps.

## Verification

- Every commit is green on its own.
- Every task's evidence is quoted output, not a claim.
- No commit mixes two tasks.
- The out-of-scope observations are recorded somewhere, not lost.

## Red flags

| Thought | Reality |
|---------|---------|
| "I'll batch these three, they are related" | Related is not atomic. Three commits. |
| "The suite was red before I started" | Then that is your report, before your change. |
| "I'll commit at the end when it all works" | You lose every safe point in between, and the review becomes untenable. |
| "I noticed a bug and fixed it too" | Report it. Your diff should contain only the brief. |
| "The plan is wrong so I improvised" | Stop and re-route. Improvisation is unreviewed design. |
| "I'll report when I'm done with everything" | Then nobody could have redirected you six tasks ago. |
