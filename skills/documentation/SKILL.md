---
name: documentation
description: Writes documentation for one reader doing one task: READMEs, quickstarts, how-to guides, API reference, runbooks, and changelogs. Use when docs are missing, stale, or unreadable, when a change made existing docs wrong, or when someone new cannot get the project running. Verifies every command and example before publishing.
license: MIT
metadata:
  phase: ship
  owners: [docs-engineer]
  version: "0.1.0"
---

# Documentation

Every document has one reader and one task. A document that serves everyone serves nobody,
and a feature tour is not documentation.

## Pick the type first

| Reader wants | Type | Shape |
|--------------|------|-------|
| To get it working now | Quickstart | Numbered steps, one path, copy-pasteable, ends in a verifiable result |
| To do a specific task | How-to | Goal, prerequisites, steps, verification |
| To look up an exact detail | Reference | Complete and uniform. Not a narrative |
| To understand why | Explanation / ADR | Prose, trade-offs, what was rejected |
| To fix production at 3am | Runbook | Symptom, first check, mitigation, escalation |

Mixing two types is the most common documentation failure. A quickstart with a paragraph
of rationale in the middle loses the reader who came to paste a command.

## Rules

1. **Name the reader and the task in the first two sentences.** If you cannot, the document
   has no scope yet.
2. **Every command is complete and copy-pasteable.** No placeholder the reader has to
   guess; if a value is required, say where to get it.
3. **Every procedure ends with how to know it worked**, with the expected output quoted.
4. **Show the common failure too.** The error someone will hit, and what it means, saves
   more time than the happy path.
5. **Link, do not duplicate.** Duplicated content goes stale in one place and stays correct
   in the other, which is worse than missing.
6. **Delete aggressively.** Wrong documentation is worse than none, because it is believed.
   If something is stale and you cannot verify it, remove it and say you did.
7. **Shortest version that works.** Length is a cost the reader pays.

## README order

Title, then one line saying what this is. Then: the problem it solves, install, a minimal
working example, links to deeper docs, how to contribute. Badges and a feature list do not
go above the example.

The example is the most-read part of any README. Make it real, small, and runnable as
written, including its imports.

## Runbook

```markdown
# Alert: <name>
**Means:** <the user-visible symptom>
**Check first:** <one dashboard or query>
**Common causes:** <ranked, each with its distinguishing signal>
**Mitigation:** <the action that stops the bleeding>
**Escalate to:** <who, and when>
```

Written for someone woken up with five minutes. No background, no history.

## Changelog

Grouped by version, newest first. Entries say what changed for a user, not what changed in
the diff. Breaking changes get their own section with one migration line each.

## Code comments and docstrings

Default to none. The bar is not "is this true" but "would a competent reader be stuck
without it".

Worth writing: a non-obvious *why* whose absence invites someone to "fix" the code and
break it; a cited constraint with its source; a deliberate deviation from convention.

Not worth writing: a restatement of the next line, a section banner, a docstring that
repeats the signature, or a note about the change you just made. Before reaching for a
comment, try a better name, a smaller function, or an earlier return.

## Verification

- Every command in the document was actually run, and the quoted output is real.
- Every code example runs as written, including imports.
- Every link resolves.
- Nothing contradicts the current code.
- The document is one type, not two.

## Red flags

| Thought | Reality |
|---------|---------|
| "I'll document what it should do" | Document what it does. Aspirational docs are wrong docs. |
| "The code is self-documenting" | Then the reference is cheap. The why is still missing. |
| "I'll leave the old section, it might still be right" | Might-be-right is believed. Verify or delete. |
| "More detail is more helpful" | Length is a cost. Cut what this reader does not need. |
| "The example is close enough" | Run it. A broken example destroys trust in the whole document. |
| "I'll add a comment explaining this function" | Try a better name first. |
