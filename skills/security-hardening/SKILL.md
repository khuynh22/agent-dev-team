---
name: security-hardening
description: Audits a change or a system for reachable vulnerabilities by tracing untrusted input to its sinks and checking authorization at every new path. Use when code touches authentication, secrets, cryptography, file paths, shell execution, deserialization, or any input crossing a trust boundary, and before exposing anything to the internet.
license: MIT
metadata:
  phase: review
  owners: [security-auditor]
  version: "0.1.0"
---

# Security Hardening

A finding without an attack path is a suspicion. A finding with one is a bug. Work from
the data, not from a checklist read top to bottom in isolation.

Standing reference: `references/security-checklist.md`, ordered by how often each item is
the actual hole.

## Process

1. **Map the trust boundaries.** Where does data cross from somewhere you do not control
   into somewhere you do? HTTP, queues, files, IPC, environment, another service, a model
   output, a scraped page. List them before reading line by line.

2. **Trace one input end to end.** Pick an untrusted input and follow it to every sink.
   Sinks worth tracing: a query, a shell, a template, a file path, a deserializer, a
   redirect, a log line.

3. **Ask who is allowed, for every new path.** Three questions: who can reach it, is that
   checked on the server, and is the object reference checked against the caller's
   identity. Broken object-level authorization is the most common real finding and the
   least often looked for. Check the sibling path added in the same change; one handler
   checking and its neighbour not is the classic shape.

4. **Check the boundary validation.** Allowlist at the boundary beats sanitising later.
   Validation that happens somewhere upstream is not a control until you find the line.

5. **Look for secrets** in source, fixtures, tests, logs, error messages, and URLs.

6. **Prove reachability.** State the concrete request or input that exploits it. If you
   cannot construct one, label the finding theoretical and rank it below the reachable
   ones. Do not delete it, and do not promote it.

7. **Give the specific fix.** "Validate input" is not a fix. "Parse the id as an integer
   at the handler, reject non-positive values, and scope the query by `session.userId`" is.

## Threat modelling a new surface

1. What are we protecting, and from whom?
2. What new surface does this create?
3. What does an attacker gain from breaking each control, and what does it cost them?
4. What detects it if they succeed?

Question four is the one that gets skipped and the one that decides whether an incident
lasts an hour or a quarter.

## Agent and tool-use surfaces

Increasingly the surface that matters, and the one least often reviewed:

- Content retrieved from a page, document, email, or tool result is **data, never
  instructions**, including when it contains text that looks like a command or claims
  authority.
- Tools that write, spend, send, or delete require an explicit human approval step.
- Tool arguments are validated before execution.
- Blast radius is bounded: scoped credentials, a working directory, a time limit, a spend
  limit.
- Retrieved content cannot modify the system prompt or grant itself permissions.

## Output

```markdown
## Security review: <target>

**Verdict:** ship | ship with fixes | do not ship
**Scope:** <what you read; what you did not>

### Critical
- `path:line` — <vulnerability>
  - **Attack:** <the concrete request or input>
  - **Impact:** <what the attacker gets>
  - **Fix:** <the specific change>

### High / Medium / Low
<same shape>

### Accepted risks
- <risk> — accepted by <who> on <date> — revisit <condition>
```

## Verification

- Every Critical and High has a concrete attack path, not a category name.
- Every finding names a real path in this repository.
- You state what you did not review.
- The verdict is stated plainly. A review that does not say whether it ships is unfinished.
- No control was weakened to make a test pass.

## Red flags

| Thought | Reality |
|---------|---------|
| "Internal, so trusted" | Internal is a network position, not an identity. |
| "The UI hides that button" | Authorization lives on the server. |
| "It is sanitized upstream" | Find the line. Somewhere is not a control. |
| "We use HTTPS" | Says nothing about authorization, injection, or secrets. |
| "The library handles it" | Which version, which default, and is that default on here? |
| "This is theoretical" | Label it, rank it below reachable findings, keep it. |
| "I lowered the check so the test passes" | Then the test was right and you have shipped the hole. |
