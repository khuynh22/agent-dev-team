---
name: work-breakdown
description: Splits a spec into an ordered list of tasks, each with a single verifiable outcome, an assigned tier, and a delegation brief. Use when a spec exists but there is no plan, when work must be divided across agents or people, or when a task is too large to verify in one step. Produces a plan file, not code.
license: MIT
metadata:
  phase: plan
  owners: [tech-lead]
  version: "0.1.0"
---

# Work Breakdown

A plan is right when each task has one outcome you can check with one command, and the
order puts the riskiest thing first.

If there is no spec, use `spec-writing` first. Planning against unwritten requirements
produces a plan that changes every day.

## Process

1. **Read the repository before planning.** Existing patterns constrain the plan more than
   preferences do. Note the conventions you found, with paths, and plan inside them or
   state the deliberate deviation.

2. **Cut along seams that already exist.** A task spanning three modules is either three
   tasks or one badly-drawn boundary. Prefer boundaries the code already has.

3. **Order by risk, not by ease.** The task that could invalidate the rest of the plan goes
   first. If an unknown could do that, task one is a spike whose output is an answer, not
   code you keep.

4. **Size to one verifiable outcome.** A task is right-sized when its definition of done is
   a single command whose output you can read. Three commands means three tasks.

5. **Assign the lowest tier that clears the ceiling** (`references/escalation-ladder.md`).
   Over-assignment hides a vague brief.

6. **Write a brief per task.** A task without one comes back wrong, and that is the
   planner's defect.

7. **State dependencies explicitly.** Tasks with no dependency between them can run in
   parallel, but two tasks that edit the same file are one task.

## Task format

```markdown
- [ ] **<id> · <title>** — `<agent>`
  - Goal: <one sentence in observable behavior>
  - Files in scope: <explicit paths>
  - Pattern to follow: <path:line>
  - Definition of done: `<the single command that must pass>`
  - Out of scope: <what to leave alone>
  - Stop condition: <what triggers an escalation>
  - Depends on: <ids, or none>
```

## Sizing heuristics

| Symptom | Fix |
|---------|-----|
| The definition of done needs three commands | Split into three tasks |
| The task title contains "and" | Split at the "and" |
| You cannot name the files in scope | You do not understand it yet. Investigate first, as its own task. |
| The task touches more than one module | Either split, or the boundary is wrong |
| Estimating it feels impossible | It contains an unknown. Make removing that unknown task one. |

## Ordering

- Riskiest first. The purpose of order is to find out early that the plan is wrong.
- A task that unblocks several others outranks a task that unblocks none.
- Group tasks that touch the same file so they do not run in parallel.
- Prefer an order where each step leaves the system working. A plan with a broken middle
  cannot be paused, and plans always get paused.

## Output

```markdown
## Plan: <feature>

### Sequence rationale
<which task removes the most risk, and why this order>

### Parallelisable
<which ids can run at once, and which must not share files>

### Tasks
<the task list>

### Not in this plan
<what was deliberately left out>
```

## Verification

- Every task has a definition of done that is a runnable command.
- Every task is assigned a tier, and the assignment clears that tier's ceiling.
- The dependency graph has no cycle.
- The first task is the riskiest, or the rationale says why not.
- No two parallel tasks edit the same file.

## Red flags

| Thought | Reality |
|---------|---------|
| "I'll do the easy tasks first for momentum" | You will discover the plan is wrong at the end instead of the start. |
| "This task is obvious, no brief needed" | Obvious to you. The brief is for whoever picks it up. |
| "I'll assign it senior to be safe" | Over-assignment is a symptom of a vague brief, not caution. |
| "The order does not matter much" | Order is the plan. If it did not matter you would not need one. |
| "I'll write this task myself, it is small" | Then it is a T0 task with a brief. Your output is the plan. |
| "We can plan the rest as we go" | Plan to the next verifiable milestone at least. Beyond that, say so explicitly. |
