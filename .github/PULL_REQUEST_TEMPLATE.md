## What this changes

<!-- One or two sentences. What is different after this merges. -->

## Why

<!-- The situation that made this necessary. If it fixes an issue, link it: Fixes #123 -->

## Evidence

```
$ npm test

```

<!-- Paste the actual output. `npm test` runs static validation, the routing evals, and the
     generated-shim drift check. A claim without output is not evidence. -->

## Checklist

- [ ] `npm test` passes, and its output is pasted above.
- [ ] If this adds or edits a **skill**: frontmatter uses only the six Agent Skills spec
      fields (`name`, `description`, `license`, `compatibility`, `metadata`,
      `allowed-tools`), and `SKILL.md` is under 500 lines.
- [ ] If this adds or edits an **agent**: the tier line is present and correct, and the
      escalation target exists.
- [ ] If this adds a skill or agent: routing eval cases were added **first**, and the
      `AGENTS.md` roster and routing tables are updated.
- [ ] If a routing eval failed, the **description** was fixed, not the eval case.
- [ ] If this touches `.claude/commands/`: `node scripts/build-commands.js` was run and the
      generated shims are committed.
- [ ] No Claude-specific capability is assumed in a skill body (no "spawn a subagent", no
      harness-only tool names).
- [ ] Counts in `README.md` and `docs/test-plan.md` updated if the number of agents,
      skills, or references changed.

## Anything a reviewer should push back on

<!-- Trade-offs you made, alternatives you rejected, parts you are unsure about. Saying
     "nothing" is a valid answer. -->
