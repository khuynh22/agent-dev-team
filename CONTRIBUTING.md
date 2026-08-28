# Contributing

## Before you open a pull request

```bash
npm test                              # validation + routing evals
node scripts/build-commands.js --check
```

Both must pass. CI runs the same two commands.

## The rules that keep this portable

**Skill frontmatter uses only the six Agent Skills spec fields:** `name`, `description`,
`license`, `compatibility`, `metadata`, `allowed-tools`. Any other key is a hard error on
claude.ai upload and the Skills API — not a warning. Tier, phase, and ownership data go in
`metadata`, which the spec allows and hosts ignore. `scripts/validate.js` enforces it.

**Claude Code-only fields belong in `agents/`,** which is a Claude Code file format rather
than a spec file. `model`, `effort`, `tools`, `color` are fine there.

**A skill body must not assume a Claude-specific capability.** No "spawn a subagent", no
tool names that only exist in one harness. Write the process; let each tool execute it its
own way.

**Command shims are generated.** Edit `.claude/commands/*.md` and run
`node scripts/build-commands.js`. Do not hand-edit `.gemini/commands/` or `commands/`.

## Adding a skill

1. `skills/<name>/SKILL.md`, directory name matching `name`, under 500 lines.
2. Write the description **for routing**. It must contain the words a user would actually
   type, and must not contain the words that belong to a neighbouring skill. This is the
   single highest-leverage thing in the file.
3. Add routing cases to `evals/cases/routing.json` **before** you consider it done: two or
   three positives in a user's words, one negative pointing at the nearest neighbour.
4. `node scripts/run-evals.js`. If it fails, fix the description, not the case.
5. Add it to the routing table in `AGENTS.md` and the list in `README.md`. Validation
   fails if you forget.

Structure that works, though it is a pattern rather than a template: Overview, When to
Use, Process, Output format, Verification, Red flags.

The red-flag table is not decoration. It names the specific rationalization someone will
reach for and answers it. "This is too small to test" → "Small changes break things. The
test costs a minute." Generic advice does not change behaviour; a rebuttal to the excuse
being made right now sometimes does.

## Adding an agent

1. `agents/<name>.md` with Claude Code frontmatter.
2. Include the tier line exactly, since `scripts/validate.js` parses it:

   ```
   **Tier:** T2 · **Escalates to:** principal-engineer · **Terminal:** no
   ```

   Only a T3 may be terminal, and terminal means `Escalates to: human`. The validator
   checks that the ladder has no cycles and no dead ends.

3. Required sections: `## Accepts`, `## Refuses`, `## Escalates to`.
4. Choose the **lowest** model and effort that can do the job. Over-provisioning a role is
   how a team of agents becomes expensive without becoming better.
5. Add routing cases, and add the role to the `AGENTS.md` roster.

## Changing the escalation ladder

`references/escalation-ladder.md` is the contract. If you change the handoff packet or the
brief, update every place that reproduces them: the ladder, `skills/team-escalation`,
`AGENTS.md`, and `README.md`. Then run the `intern-ceiling` and `intern-incomplete-brief`
behavioral cases, which grade against the exact field list.

## Adding a behavioral eval

Put the trap in. A case where the right answer is the obvious answer tests nothing.

1. Build a fixture under `evals/fixtures/` that makes the wrong behaviour tempting: the
   suggested retry in the notes, the migration that looks routine, the task a T0 could
   plausibly attempt.
2. Add `evals/cases/behavioral/<id>.json` with `expectations` (all must hold) and
   `must_not` (any one is an automatic fail).
3. Verify the fixture's baseline state is what you think it is. Run the suite.
4. Check it end to end: `node scripts/run-evals.js --behavioral <id>`.

## Pull requests

Open one against `master`. The template lists the checks; the one that trips people up is
that counts appear in three places — the `README.md` opening paragraph, the roster and
routing tables in `AGENTS.md`, and the expected output in `docs/test-plan.md`. Adding a
skill or agent means updating all three, and `scripts/validate.js` only catches the second.

Add an entry under **Unreleased** in [`CHANGELOG.md`](CHANGELOG.md) for anything a user
would notice: a new role, a renamed skill, a changed escalation path. Not for typos.

Participation is covered by [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Arguing that a
design is wrong is fine and expected; attacking the person is not. Security issues go
through the private flow in [`SECURITY.md`](SECURITY.md), never a public issue.

## Style

Prose is for working engineers. Cut anything that restates what the reader can see. Length
is a cost the reader pays, and a skill that is skimmed is a skill that does nothing.

Comments in `scripts/`: default to none. Write one only where a competent reader would
otherwise be stuck, or where a constraint needs citing.

## What gets rejected

- A skill that is reference documentation rather than a process.
- A description written for a human browsing a list rather than for a router matching a
  prompt.
- A new agent whose description overlaps an existing one. Check with the evals; the
  collision detector will tell you before a reviewer does.
- Behaviour changes with no eval case covering them.
- Hand-edited generated files.
