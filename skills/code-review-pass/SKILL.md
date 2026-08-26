---
name: code-review-pass
description: Reviews a diff, branch, or pull request across correctness, security, architecture, readability, and performance, returning ranked findings with file and line references and a concrete fix for each. Use before merging, when checking code written by someone or something else, or when a change needs a quality gate.
license: MIT
metadata:
  phase: review
  owners: [code-reviewer, senior-engineer]
  version: "0.1.0"
---

# Code Review Pass

A review is finished when a person can act on every finding without asking you a follow-up
question.

## Process

1. **Get the actual diff.** Reviewing from a description reviews the description. If you
   cannot see the change, ask for it.

2. **Read the tests first.** They state the intended behavior. If they do not tell you
   what the change is supposed to do, that is finding number one.

3. **Read enough context around each change** to know what the surrounding code assumes. A
   changed line is not reviewable alone.

4. **Review along five axes, in this order.** Order matters because it determines what you
   still have attention for.

   **Correctness** — Does it do what it claims? Empty, one, many, boundary, error path,
   concurrent, and the retry. Do the tests assert the behavior, or do they assert that the
   implementation is the implementation?

   **Security** — Untrusted input, server-side authorization, injection sinks, secrets,
   error messages that leak. See `references/security-checklist.md`. Anything on a trust
   boundary routes to `security-hardening` for depth.

   **Architecture** — Does it fit the patterns already here? Is the dependency direction
   right? Is a boundary being punched through for convenience?

   **Readability** — Naming, control flow, function size. A comment explaining what the
   code does is usually a name that should have been better.

   **Performance** — N+1, work in a loop that belongs outside it, an unbounded query, a
   missing timeout.

5. **Rank by leverage.** Lead with what would hurt in production. A style note above a
   missing authorization check makes the whole review skimmable.

6. **Name one specific thing done well.** Not flattery: it shows you read the change.

7. **Give a fix with every finding.** "This is fragile" is not actionable.

## Severity

| Severity | Meaning | Merge |
|----------|---------|-------|
| Critical | Data loss, auth bypass, remote code execution, corruption | Blocks |
| Important | Missing test for new behavior, wrong error handling, architectural violation | Fix before merge |
| Suggestion | Readability, naming, optional simplification | Author's call |

Do not inflate severity to be heard. Do not pad with suggestions to look thorough.

## What to look for that tools do not catch

- A test that asserts the implementation rather than the behavior.
- Error handling that catches and continues, leaving the system in a half-state.
- A new code path with no test, hidden inside a diff that has many tests.
- An interface change with a caller in the repository that was not updated.
- A comment that no longer matches the code beneath it.
- A migration with no rollback.
- Authorization checked in the handler for one path and not for the sibling path added in
  the same diff.

## Output

```markdown
## Review: <target>

**Verdict:** approve | approve with changes | request changes
**Strength:** <one specific thing done well>

### Critical
- `path:line` — <problem>. <fix>.

### Important
### Suggestions

### Not reviewed
<what you could not see, and why it matters>
```

## Verification

- Every finding has a `file:line` and a concrete fix.
- Findings cover more than one axis, or you say why the others did not apply.
- The verdict matches the findings: an open Critical means request changes.
- You state what you did not review. A silent gap reads as coverage.

## Red flags

| Thought | Reality |
|---------|---------|
| "Looks good to me" | Say what you checked and what you could not. LGTM is not a review. |
| "I'll fix it while I'm here" | Then nobody reviewed it. Report, do not edit. |
| "Twenty findings" | Rank them, or the Critical gets skimmed past. |
| "Tests pass, so correctness is covered" | Passing tests prove the tests pass. Read the assertions. |
| "Big diff, I'll spot-check" | Say you spot-checked and which parts. An implied full review is worse than an honest partial one. |
| "The author is senior, it is probably fine" | Then the review is quick. It is not optional. |
