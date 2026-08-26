# Security Checklist

Ordered by how often each one is actually the hole. Work top down.

## Trust boundaries

- [ ] Every input crossing a boundary (HTTP, queue, file, IPC, environment, another
      service) is validated at the boundary against an allowlist, not sanitized after
      the fact.
- [ ] Data from a model, a scraped page, a document, or a tool result is treated as data
      and never as instructions, including when it contains text that looks like a
      command or claims authority.
- [ ] Server-side authorization is checked on every path. Hiding a control in the UI is
      not authorization.
- [ ] Object references are checked against the caller's identity, so one user cannot
      read another user's record by changing an id.

## Injection

- [ ] SQL uses parameterized queries. String interpolation into SQL is a finding even
      when the input is described as trusted.
- [ ] Shell commands avoid a shell entirely, or pass an argument array. Never interpolate
      user data into a command string.
- [ ] Templates escape by default; any raw or unescaped rendering carries a justification.
- [ ] Path handling resolves the path and then verifies the result is inside the intended
      root.
- [ ] Deserialization does not instantiate arbitrary types.

## Secrets

- [ ] No credential, token, or key in source, fixtures, tests, logs, error messages,
      URLs, or query strings.
- [ ] Secrets come from the environment or a secret manager, and are not echoed at start.
- [ ] Rotation is possible without a code change.
- [ ] A leaked secret is treated as leaked: rotate first, investigate second.

## Authentication and sessions

- [ ] Passwords hashed with a memory-hard function such as argon2id, scrypt, or bcrypt.
      Never a bare hash, never a fast one.
- [ ] Tokens come from a cryptographically secure generator, are compared in constant
      time, and expire.
- [ ] The session identifier rotates on privilege change, preventing session fixation.
- [ ] Logout invalidates server-side state, not only client-side state.
- [ ] Rate limiting and lockout exist on authentication paths.

## Transport and headers

- [ ] TLS enforced. Certificate validation is never disabled, including in code you ship
      for testing.
- [ ] Security headers set: `Content-Security-Policy`, `Strict-Transport-Security`,
      `X-Content-Type-Options: nosniff`, `Referrer-Policy`.
- [ ] CORS lists explicit origins. A wildcard origin combined with credentials is a
      finding.
- [ ] Cookies set `HttpOnly`, `Secure`, and an intentional `SameSite`.

## Dependencies and supply chain

- [ ] Lockfile committed; installs are reproducible.
- [ ] Advisory scan is clean, or each exception is written down with a reason and a date.
- [ ] New dependencies are justified: what it does, who maintains it, what it pulls in.
- [ ] CI does not run untrusted pull-request code with secrets in scope.

## Errors and logging

- [ ] Errors returned to a caller do not leak stack traces, queries, paths, or versions.
- [ ] Logs do not contain credentials, tokens, full payment data, or more personal data
      than needed, and retention is deliberate.
- [ ] Security-relevant events such as authentication failure, authorization denial, and
      privilege change are logged with enough context to investigate.

## Agent and tool-use surfaces

- [ ] Tools that write, spend, send, or delete require an explicit approval step.
- [ ] Tool arguments are validated before execution, not after.
- [ ] The agent's blast radius is bounded: scoped credentials, a working directory, a
      time limit, a spend limit.
- [ ] Retrieved content cannot alter the system prompt or grant itself permissions.

## Reporting a finding

State the vulnerable path with `file:line`, the concrete attack, the impact, and the fix.

Severity: **Critical** for data loss, authentication bypass, or remote code execution,
which blocks merge. **High** for exploitable with preconditions. **Medium** for defense in
depth. **Low** for hardening.

Do not pad the list with low-severity findings to look thorough. A review with two real
Criticals and nothing else is a better review than one with twenty items.
