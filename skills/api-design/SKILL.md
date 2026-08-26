---
name: api-design
description: Designs an interface that others will depend on: endpoints, function signatures, events, schemas, and their versioning and error contracts. Use before publishing an API, when adding a public function or endpoint, or when changing something callers already use. Treats every observable behavior as a promise.
license: MIT
metadata:
  phase: plan
  owners: [senior-engineer, principal-engineer, tech-lead]
  version: "0.1.0"
---

# API and Interface Design

Every observable behavior of an interface becomes something a caller depends on, whether
you documented it or not. That includes ordering you did not promise, an error message
someone parses, and a field that is always present by accident. Design as if all of it is
the contract, because it is.

## Design order

1. **Write the calling code first.** Before designing the interface, write the three most
   common calls as a user would make them. Awkwardness shows up immediately here and is
   almost invisible when you design from the implementation side.

2. **Name the resource or operation in the caller's language,** not your schema's. If the
   caller has to learn your internal model to use the interface, the model has leaked.

3. **Make the common case short and the rare case possible.** Required parameters are the
   ones without a sensible default. Anything with a sensible default is optional.

4. **Choose the smallest surface that solves the problem.** Every method, field, and option
   is a promise you maintain forever. Adding later is easy; removing is not.

5. **Design the error contract explicitly.** Errors are part of the interface. A caller
   must be able to distinguish, programmatically: their mistake, your fault, try again
   later, and this will never work.

6. **Make illegal states unrepresentable** where the type system allows it. A validated
   type at the boundary beats a check repeated in nine places.

## Rules

- **Consistency beats local elegance.** Match the naming, pagination, error shape, and
  casing that this codebase already uses, even when you would have chosen differently.
- **Explicit over inferred.** Magic behavior that guesses the caller's intent is
  undebuggable when it guesses wrong.
- **No boolean parameters that select behavior.** `render(true)` is unreadable at the call
  site. Two functions, or an enum.
- **Return types stay stable.** A function that returns a different shape depending on
  input forces every caller to branch.
- **Paginate anything unbounded** from the first version. Adding pagination later is a
  breaking change to every caller.
- **Idempotency for anything that mutates over an unreliable channel.** An idempotency key
  costs one field now and saves a duplicate-charge incident later.

## Versioning and change

| Change | Breaking? |
|--------|-----------|
| Adding an optional field to a response | No, unless callers validate strictly |
| Adding a required request field | Yes |
| Removing or renaming a field | Yes |
| Narrowing an accepted range | Yes |
| Changing an error code or status | Yes |
| Changing default ordering | Yes in practice, even if undocumented |
| Making a synchronous call asynchronous | Yes |

Deprecation path: announce, ship both, measure who still uses the old one, migrate them,
then remove. Removing on a date rather than on measured usage breaks callers you did not
know about.

## Error contract

```
- What went wrong, in a stable machine-readable code
- Whether the caller can fix it
- Whether a retry could succeed, and after how long
- A human-readable message that never leaks internals
- A correlation id for support
```

Do not reuse one generic error for four situations. Callers will parse the message string,
and then the message string is the contract.

## Verification

- The three most common calls read well without a comment.
- Every error case is enumerated and distinguishable programmatically.
- Every unbounded list is paginated.
- The change is classified as breaking or not, and a breaking change has a deprecation
  path.
- Naming and error shape match the rest of the codebase.

## Red flags

| Thought | Reality |
|---------|---------|
| "I'll add the option now in case someone needs it" | Every option is permanent. Add it when someone does. |
| "Callers will not depend on that" | Hyrum's law: with enough callers, every observable behavior is depended on. |
| "It is internal, so it can change freely" | Internal today, three teams tomorrow. Design the contract anyway. |
| "A boolean flag is simpler" | At the call site it is unreadable. Use two functions or an enum. |
| "We will paginate when the list gets big" | That is a breaking change to every caller. Paginate now. |
| "The error message explains it" | Then the message is the contract, and you can never change it. Use a code. |
