# Testing Patterns

## The order that works

1. Write the test that fails for the right reason.
2. Run it. Read the failure. If it fails for the wrong reason, the test is wrong.
3. Write the smallest change that makes it pass.
4. Run the whole suite.
5. Refactor with the suite green.

A test you never watched fail is not a test; it is a decoration.

## What to test

Test observable behavior through the seam a real caller uses. Test the module's public
surface, not its private helpers. Private helpers change; behavior is the contract.

| Test this | Not this |
|-----------|----------|
| An empty cart totals zero | A private sum helper returns 0 for an empty list |
| An expired token is rejected | An internal predicate compares timestamps |
| The error a caller sees | The internal exception type |

## Coverage that means something

Cover the boundaries, not the lines:

- Empty, one, many.
- The boundary value and the one on each side of it.
- The error path, including the error message a human will read.
- Concurrency: the interleaving you are relying on not happening.
- Time: the change at a boundary such as midnight, a DST shift, or month end, if time is
  part of the logic.
- Encoding: non-ASCII input, and the empty string that is not null.

## Test doubles

Prefer the real thing. Reach for a double only when the real thing is slow,
non-deterministic, costly, or not yours.

- **Stub** a dependency you are not testing, to return a fixed value.
- **Fake** a dependency you use heavily. An in-memory store beats twenty stubs.
- **Mock**, meaning assert on calls, only when the call is itself the behavior under test,
  such as "an email is sent".

Mocking your own code usually means the seam is in the wrong place.

## Flake

A flaky test is a failing test. Do not retry it away.

Common causes, in order of frequency: shared mutable state between tests, real time or
real sleeps, unordered collections compared as ordered, network access, and test-order
dependence. Running the suite in reverse order once finds the third and the fifth.

## Regression tests

Every bug fix starts with a test that reproduces the bug. The test name states the bug,
not the fix: "rejects a refund larger than the original charge", not "fixes issue 412".

## Embedded and firmware

- Test pure logic on the host with a native toolchain; it is orders of magnitude faster.
- Put hardware behind a HAL interface so the logic layer stays host-testable.
- On-target tests cover timing, interrupt behavior, and peripheral quirks only.
- Assert on stack high-water mark and heap usage as tests, not as a manual glance.

See `references/firmware-constraints.md`.

## Frontend

- Query by role and accessible name rather than by CSS class or test id. If the
  accessible name is missing, that is a bug the test just found.
- Assert on what the user perceives: text, state, focus, announced messages.
- One browser-level end-to-end test per critical path; unit tests for everything else.

## Reading a failure

When a test fails, read the assertion before reading the code. The gap between expected
and actual usually names the bug. If the message does not, the assertion is too coarse:
fix the assertion first, then the code.
