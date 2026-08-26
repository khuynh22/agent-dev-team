---
name: tdd-loop
description: Writes the failing test first, watches it fail for the right reason, then makes it pass with the smallest change. Use before implementing any feature or bug fix, when adding a regression test, or when a change needs proof it works. Refuses to write implementation code before a red test exists.
license: MIT
metadata:
  phase: build
  owners: [software-engineer, senior-engineer, test-engineer]
  version: "0.1.0"
---

# TDD Loop

The discipline is not "have tests". It is **watch the test fail before you make it pass**.
A test you never saw red proves only that it passes, which is also true of a test that
asserts nothing.

## The loop

1. **Red.** Write one failing test for the next smallest piece of behavior.
2. **Run it.** Read the failure message. Confirm it fails for the reason you expect. A
   test failing on an import error or a typo is not red, it is broken.
3. **Green.** Write the smallest change that makes it pass. Not the general version. Not
   the version you can already see you will need.
4. **Run the whole suite.** A green new test with a red suite is a broken build.
5. **Refactor.** With the suite green, improve the shape. Tests do not change during a
   refactor; if they must, it was not a refactor.
6. **Repeat.**

Commit at each green. A green commit is a safe point to return to.

## Writing the first test

Start from the acceptance criterion, not from the function you plan to write. The test
names the behavior a caller cares about:

```
Bad:   sumLines returns 0 for []
Good:  an empty cart totals zero
```

If you cannot write the test because you do not know what the behavior should be, that is
a requirements problem. Stop and ask, or escalate. It is not a reason to write the code
first and infer the behavior from it.

If you cannot write the test because the code is hard to reach, that is a design problem.
The seam is missing. Escalate to `senior-engineer` rather than mocking around it.

## For a bug fix

1. Reproduce the bug in a test. The test fails with the same symptom the user reported.
2. Name the test after the bug, not the fix: "rejects a refund larger than the original
   charge".
3. Fix it.
4. The test now passes, and it stays in the suite forever as the guard.

A bug fix without a reproducing test will be reintroduced.

## Choosing the level

The cheapest level that would actually catch the failure. Unit for logic and boundaries;
integration for wiring, serialization, and queries; end to end for the one critical path
a user walks. See `references/testing-patterns.md`.

## When the test is written after the code

Sometimes it is. Then you must manufacture red: break the implementation deliberately,
run the test, confirm it fails, restore the implementation, confirm it passes. Skipping
this leaves you with a test that passes for reasons you have not verified.

## Verification

Report all four, quoted:

```
Red:    <the failing run, with the assertion message>
Green:  <the passing run>
Suite:  <the full-suite summary line>
Build:  <type check or build summary line>
```

Then check `references/definition-of-done.md`.

## Red flags

| Thought | Reality |
|---------|---------|
| "It is too small to test" | Small changes break things. The test costs a minute. |
| "I'll write the tests at the end" | Then they are written to fit the code, and they test your implementation rather than the requirement. |
| "The test passed the first time I ran it" | Then you have not seen it fail. Break the code and watch. |
| "It fails, that is enough" | Read *why* it fails. An import error is not a red test. |
| "I'll make it general while I'm here" | Smallest change. The general version is usually the wrong general version. |
| "Refactoring broke a test so I updated the test" | Then it was a behavior change. Separate the commits. |
| "Six mocks were needed but it works" | Six mocks is a design finding. Escalate it. |
