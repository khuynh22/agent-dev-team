---
name: simplification-pass
description: Removes complexity that is not paying for itself: dead code, needless abstraction, duplicated logic, and configuration nobody sets. Use when code is harder to read than the problem is hard, before extending a messy area, or when a diff can be made smaller without losing behavior. Never changes behavior.
license: MIT
metadata:
  phase: review
  owners: [senior-engineer, code-reviewer]
  version: "0.1.0"
---

# Simplification Pass

The goal is less code doing the same thing, verified by the same tests passing unchanged.
If the tests need editing, it was a behavior change, not a simplification.

## Preconditions

- Tests exist and pass before you start. Quote the run.
- The tests actually cover the behavior you are about to move. If they do not, write them
  first; simplification without a safety net is rewriting.
- This is its own commit, separate from any feature work.

## What to look for, in order of payoff

1. **Dead code.** Unreferenced functions, unreachable branches, a flag that is always the
   same value, a parameter every caller passes identically. Delete it; git remembers.

2. **Abstraction with one implementation.** An interface with a single implementer, a
   factory that constructs one type, a strategy pattern with one strategy. It was built for
   a second case that never arrived.

3. **Indirection that does not decide anything.** A wrapper that forwards, a config value
   nobody sets, a layer that only renames its arguments.

4. **Duplicated logic that has drifted.** Two copies that are slightly different is worse
   than two copies that are identical, because now nobody knows which is correct. Find out
   which is right before merging them; the difference may be a bug fix.

5. **Nesting.** Guard clauses and early returns flatten most deep conditionals. Three
   levels is usually one extraction away from one.

6. **Comments compensating for names.** Rename, then delete the comment.

7. **Options nobody uses.** Every flag doubles the state space. Remove the ones with one
   real value.

## Chesterton's fence

Before deleting something odd, find out why it is there. Two minutes:

- `git log -S` for the line, and read the commit message.
- Search for callers, including in tests, config, and other languages.
- Look for a comment or issue reference nearby.

If you find a reason, leave it and add the missing comment. If you find nothing after
looking, delete it and say in the commit message that you looked.

## What is not simplification

- Renaming everything to your preferred convention.
- Replacing a clear loop with a dense one-liner. Shorter is not simpler.
- Introducing a new abstraction to remove two lines of duplication. Two similar things are
  usually just two things.
- Changing behavior "because the old behavior looked wrong". That is a bug report, not a
  refactor.

Duplication is cheaper than the wrong abstraction. Wait for the third occurrence.

## Process

1. Run the tests. Quote the green run.
2. Make one kind of simplification. One commit.
3. Run the tests. They must pass **unchanged**.
4. Repeat.
5. Report the net line change and what was removed.

## Verification

- The tests are byte-for-byte unchanged and still pass.
- The diff removes more than it adds, or the addition is a name that removed a comment.
- No behavior changed. If any did, split it into its own commit with its own test.
- Anything deleted was checked against callers first.

## Red flags

| Thought | Reality |
|---------|---------|
| "I had to update a test" | Then it was a behavior change. Split it out. |
| "This abstraction will be useful later" | It has one implementation today. Delete it; adding it back is cheap. |
| "These two functions are similar, I'll merge them" | Find out why they differ first. The difference may be a fix. |
| "I do not know why this line is here, so it is dead" | Look. Two minutes of git history beats a regression. |
| "I'll simplify while adding the feature" | Separate commits, or the review is impossible. |
| "Shorter is simpler" | Not if it takes longer to read. Optimise for the reader. |
