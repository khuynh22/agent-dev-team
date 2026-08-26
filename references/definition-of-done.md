# Definition of Done

A change is done when every applicable line is true and you have the output to prove it.
"I believe it works" is not on this list.

## Always

- [ ] The behavior the task asked for is observable, not just implemented.
- [ ] A test fails without the change and passes with it. Quote both runs.
- [ ] The full test suite passes. Quote the summary line.
- [ ] The build or type check passes. Quote the summary line.
- [ ] Lint and formatter are clean, using the project's config, not yours.
- [ ] No debugging residue: stray logs, commented-out code, focused or skipped tests.
- [ ] The diff contains nothing the task did not ask for.
- [ ] Errors are handled at the layer that can do something about them; nothing is
      swallowed silently.

## When the change touches an interface

- [ ] Every caller in the repo is updated, found by search and not by memory.
- [ ] The change is additive, or the removal has a deprecation path.
- [ ] Docs and examples that show the old shape are updated.

## When the change touches data

- [ ] The migration runs forward on a copy of realistic data.
- [ ] The rollback path is written down and, where possible, executed.
- [ ] Read and write paths are compatible during the window when both versions run.

## When the change touches security surface

- [ ] Input crossing a trust boundary is validated at the boundary.
- [ ] No secret is in source, logs, error messages, or a URL.
- [ ] Authorization is checked on the server for every new path, not only in the UI.
- [ ] See `references/security-checklist.md`.

## When the change ships to production

- [ ] Rollback is a single documented action, and you know how long it takes.
- [ ] The change is observable: a log line, metric, or trace that shows it working.
- [ ] Someone other than the author can tell whether it is healthy.
- [ ] See `references/observability-checklist.md`.

## Evidence rule

Every box above is checked by pasting output, not by asserting. The three sentences that
end a task are:

1. What you ran.
2. What it printed, quoting the decisive line rather than the whole log.
3. What that proves.

If a box does not apply, say which one and why. Silence is read as skipped.
