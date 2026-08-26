---
name: systematic-debugging
description: Finds the actual cause of a defect by reproducing it, narrowing the search space by bisection, and proving the diagnosis before changing code. Use for a crash, a stack trace, a flaky or intermittently failing suite, or behaviour that differs from expectation and resists an obvious fix. Refuses to change code before the cause is proven.
license: MIT
metadata:
  phase: verify
  owners: [senior-engineer, software-engineer, principal-engineer]
  version: "0.1.0"
---

# Systematic Debugging

The expensive failure mode is changing code before understanding the bug. It sometimes
makes the symptom go away, which is worse than not fixing it, because now nobody will look
again.

**No code changes until you can state the cause and predict the fix's effect.**

## Process

### 1. Reproduce

A bug you cannot reproduce is a bug you cannot prove you fixed. Get to a single command,
or a written sequence of steps, that produces the failure reliably.

If it is intermittent, make it deterministic: pin the seed, freeze the clock, force the
interleaving, inject the fault, shrink the data. The work to make it reproducible is
almost always less than the work of debugging it while it flickers.

If you truly cannot reproduce it, say so explicitly and switch to adding observability so
the next occurrence is diagnosable. That is a legitimate outcome; a speculative fix is not.

### 2. Read the evidence you already have

The stack trace, the assertion message, the log line, the error text. Read all of it, in
order, including the parts that look like boilerplate. The cause chain of an error names
the real failure more often than the top message does.

Quote the decisive line. Do not paraphrase an error.

### 3. State what you expected and what happened

In one sentence each. The gap between them is the search space. Most of the time this step
alone reveals a wrong assumption.

### 4. Narrow

Bisect the space, do not sweep it.

- **In time:** when did it last work? `git bisect` on a reliable reproduction is the
  fastest tool available and is chronically underused.
- **In the stack:** is the input to this layer correct? Check the middle first, then halve
  again. Three checks beat twenty guesses.
- **In the data:** which input triggers it? Shrink the failing case to the smallest one
  that still fails.
- **In the environment:** does it fail in a clean checkout, another machine, another
  version?

Change one thing at a time. Two changes and you have learned nothing about either.

### 5. Form a hypothesis that predicts something

A useful hypothesis says: "if this is the cause, then X will be true." Then check X. A
hypothesis that explains the failure but predicts nothing new cannot be tested, only
believed.

### 6. Prove it

Confirm the cause before fixing: add a temporary assertion, log the value, break at the
line, or construct the input that must fail if you are right.

### 7. Fix the cause

Then re-run the reproduction. Then run the full suite. Then write the regression test that
would have caught this, named after the bug.

## Signals you have not found it

- The fix is a retry, a sleep, a lock added because it helped, or a try/catch around the
  symptom.
- You cannot explain why the bug appeared when it did.
- The fix works but you do not know why.
- You changed three things and it started working.

Every one of these means the bug is still there, in a form that will return later and be
harder to find.

## Output

```markdown
## Diagnosis: <symptom>
- **Reproduction:** <the command or steps>
- **Expected / actual:** <one sentence each>
- **Narrowed by:** <what you bisected and how>
- **Cause:** `path:line` — <the mechanism, not the symptom>
- **Proof:** <what you observed that confirms it>
- **Fix:** <the change>
- **Regression test:** <path, and the run>
- **Why it was not caught:** <the gap>
```

## Red flags

| Thought | Reality |
|---------|---------|
| "I'll try changing this and see" | That is guessing. Narrow first. |
| "It works now" | Why? If you cannot say, it will return. |
| "It is probably a race" | Probably is not a diagnosis. Name the two operations and the order. |
| "I cannot reproduce it, but I know the fix" | You know a fix for a bug you have not seen. |
| "Adding a delay fixed it" | You moved the timing. The race is still there. |
| "The stack trace is just framework noise" | Read it. The cause chain is usually below the noise. |
| "I'll add a try/catch for now" | You have hidden the evidence for the next person, who is you. |
