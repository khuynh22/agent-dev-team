# Autopilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `/autopilot` command that runs a ticket through spec, plan, build, review, and ship without stopping at each stage boundary.

**Architecture:** A new skill holds the workflow, a new reference holds the long-form policy, and a thin command shim dispatches to both. No new agent and no change to any existing skill; the relay composes the roster that already exists. The one behavioural override — stating assumptions instead of interviewing — is written in the new skill rather than by editing `requirements-interview`.

**Tech Stack:** Markdown with YAML frontmatter, Node 18 validation scripts, no runtime dependencies.

**Spec:** `docs/specs/2026-08-29-autopilot.md`

## Global Constraints

- Skill frontmatter accepts exactly six keys: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`. Any other key is a hard validation error.
- `metadata.phase` is required on every skill. `metadata.owners` must list names that exist in `agents/`.
- A skill's `name` must equal its directory name. Body capped at 500 lines. Description capped at 1024 characters.
- In a command body, every backticked token matching `[a-z][a-z0-9-]{3,}` must be an existing skill or agent name. Tokens containing `/` or `.` are exempt.
- Every path written as `` `references/<name>.md` `` in a skill or agent body must exist on disk.
- `AGENTS.md` must contain every agent name and every skill name in backticks, or validation fails.
- Routing evals require: no two descriptions in a corpus more than 0.75 similar, every positive within its `top_k`, every negative won by the stated owner, and a rank-1 rate at or above 80%.
- Files under `commands/` and `.gemini/commands/` are generated. Never hand-edit; run `node scripts/build-commands.js`.
- Line width in this repository's markdown is 90 characters.
- Every task ends with `npm test` green before its commit.

---

### Task 1: The autonomous-run policy reference

**Files:**
- Create: `references/autonomous-run.md`
- Test: `node scripts/validate.js`

**Interfaces:**
- Consumes: nothing.
- Produces: the path `references/autonomous-run.md`, cited by Task 2's skill body and Task 3's command body. The document defines three named rules that later tasks refer to by name: **escalation redirect**, **assumption ledger**, **run report**.

- [ ] **Step 1: Establish the baseline**

Run: `npm test`
Expected: PASS. Record the counts line, for example `PASS — 21 agents · 25 skills · 10 references · 8 commands`.

- [ ] **Step 2: Write the reference**

Create `references/autonomous-run.md` with these five sections and nothing else:

1. `# Autonomous Runs` — one paragraph stating that this file changes only who receives an escalation, never the ceilings, the triggers, or the packet format, and that `references/escalation-ladder.md` remains authoritative for all three.

2. `## Escalation redirect` — a table mapping trigger to recipient:

```
| Trigger | Recipient under an autonomous run |
|---------|-----------------------------------|
| irreversibility | principal-engineer |
| blast-radius | principal-engineer |
| unknown-unknowns | principal-engineer |
| contract-change | principal-engineer |
| cost | principal-engineer |
| incomplete-brief | principal-engineer |
| security-surface | security-auditor |
| a measured regression | performance-engineer |
| a release concern | sre |
```

Followed by three rules stated as prose: the packet format is unchanged; the recipient is
terminal and must decide; a decision is recorded in the run report with the trigger that
caused it.

3. `## What reaches the human` — only a T3's own escalation, and only on product intent,
cost materially above the brief, or risk appetite. State that this pauses the run and does
not unwind completed work, and that the branch is left in place.

4. `## Assumption ledger` — every value the run derived rather than received is tagged
`[ASSUMED]` at the point it is written and reprinted at the top of the run report. Show the
worked example:

```
1. [GIVEN]   Export includes a header row
2. [ASSUMED] Export finishes within 30s for 10k rows
3. [ASSUMED] A failure emails the requester
```

State that the tag applies to acceptance criteria and to any definition-of-done command the
ticket did not name.

5. `## Run report` — the exact block the run must emit, given verbatim so the shape is not
left to the agent:

```markdown
## RUN REPORT
- **Ticket:** <id or first line of the body>
- **Branch:** <branch name>
- **Outcome:** completed | aborted | paused
- **Assumptions:** <every [ASSUMED] line, or "none">
- **T3 decisions:** <trigger -> decision, one per line, or "none">
- **Commits:** <count and one-line subjects>
- **Verification:** <the command run, and the decisive output line>
- **Review verdict:** <approve | request-changes, with counts by severity>
- **Release plan:** <path, or why none>
- **Not done:** <what was skipped or left open, or "nothing">
```

Close with the rule that `Not done` is never omitted and never left empty when something
was skipped, citing non-negotiable 5 in `AGENTS.md`.

- [ ] **Step 3: Verify the reference is well-formed and reachable**

Run: `node scripts/validate.js`
Expected: PASS, with the references count one higher than the Step 1 baseline.

- [ ] **Step 4: Run the whole suite**

Run: `npm test`
Expected: PASS. Nothing points at the new file yet, so evals and shims are unchanged.

- [ ] **Step 5: Commit**

```bash
git add references/autonomous-run.md
git commit -m "feat: add the autonomous run policy reference"
```

---

### Task 2: The autonomous-relay skill and its roster entry

**Files:**
- Create: `skills/autonomous-relay/SKILL.md`
- Modify: `AGENTS.md` — routing table, plus a new autonomy section
- Modify: `evals/cases/routing.json` — one skill group case
- Test: `npm test`

**Interfaces:**
- Consumes: `references/autonomous-run.md` from Task 1, cited by that exact path.
- Produces: the skill name `autonomous-relay`, which Task 3's command body and Task 5's
  documentation both refer to. The name must equal the directory name exactly.

The `AGENTS.md` edit must be in this task, not a later one: `scripts/validate.js` fails
when a skill exists that `AGENTS.md` does not mention, so splitting them leaves the tree
red between commits.

- [ ] **Step 1: Write the failing check first**

Add the routing case to `evals/cases/routing.json`, inside the group whose `kind` is
`skill`, before writing the skill itself:

```json
{
  "owner": "autonomous-relay",
  "top_k": 3,
  "positive": [
    "run this ticket end to end without stopping to ask me",
    "take this issue from ticket to reviewed branch unattended",
    "no human in the loop, just work the whole ticket and report back"
  ],
  "negative": [
    { "prompt": "which team member should own this request", "owner": "using-agent-dev-team" },
    { "prompt": "work through the task list one commit at a time", "owner": "incremental-delivery" }
  ]
}
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `node scripts/run-evals.js`
Expected: FAIL, naming `autonomous-relay` as an owner that does not exist in the skill
corpus. This proves the case is actually being read.

- [ ] **Step 3: Write the skill**

Create `skills/autonomous-relay/SKILL.md`. Frontmatter exactly:

```yaml
---
name: autonomous-relay
description: Runs a tracker ticket through the full lifecycle without stopping at each stage boundary: requirements, plan, build, review, and release plan, with escalations routed to a terminal tier instead of to a waiting human. Use when a ticket already carries enough intent to work unattended, when nobody is available to answer stage-by-stage questions, or when the request is to work an issue end to end and report back. Refuses to deploy, to push, and to resolve product intent on the human's behalf.
license: MIT
metadata:
  phase: build
  owners: [tech-lead, principal-engineer]
  version: "0.1.0"
---
```

The description is the highest-risk line in this task. It must stay under 1024 characters
and under 0.75 cosine similarity to every other skill description — the nearest neighbours
are `using-agent-dev-team`, `incremental-delivery`, and `work-breakdown`. The words that
separate it are *unattended*, *ticket*, *without stopping*, and *no human*. If the
similarity check fails in Step 5, rewrite toward those words rather than editing the eval
case.

Body sections, in order:

- `# Autonomous Relay` — two sentences: what the run produces, and the boundary it will not
  cross.
- `## Before you start` — the run refuses to begin unless it has a ticket, either fetched by
  issue key where a tracker connector exists or supplied as the body text. Neither present
  means stop and name the missing input.
- `## The relay` — the six stages as a numbered list. Each names the role, the skill, and
  the artifact. Stage 1 carries the interview override: state assumptions rather than asking
  one question per message, and tag each derived value per the assumption ledger in
  `references/autonomous-run.md`.
- `## Escalation while unattended` — one paragraph and a pointer to
  `references/autonomous-run.md`. Do not restate the trigger table; a second copy will drift
  from the first.
- `## Abort` — one condition. An open Critical from the review panel stops the run. State
  plainly that there is no task ceiling and no consult ceiling, and that the run report
  prints the counts so a ceiling can be set later from evidence.
- `## Git` — branch from the default branch as `adt/<ticket-id>-<topic>`, one commit per
  task, structural and behavioural changes never mixed, no push and no pull request.
- `## Report` — point at the run report block in `references/autonomous-run.md`. Do not
  restate it.
- `## Red flags` — an anti-rationalisation table matching the house style used by
  `skills/incremental-delivery/SKILL.md`. At minimum these four rows:

```
| Thought | Reality |
|---------|---------|
| "Nobody is watching, so I can decide this" | Unattended changes the recipient, not the ceiling. Route it. |
| "The ticket implies the criteria, close enough" | Implied is derived. Tag it and move on. |
| "Review found a Critical but I can fix it quickly" | A Critical aborts the run. Report it. |
| "I finished, so a push would be helpful" | Push is outward-facing. It is trigger one. |
```

- [ ] **Step 4: Add the routing row and the autonomy section to AGENTS.md**

In the routing table, add one row directly above the `Task exceeded the current ceiling`
row:

```
| A ticket to work end to end, unattended | `tech-lead` | `autonomous-relay` |
```

Then add a section titled `## Autonomous runs`, placed between `## Escalation protocol` and
`## Non-negotiables`, holding four sentences: what an autonomous run is, that escalations
redirect to a terminal tier rather than halting, that only a T3's own escalation reaches the
human, and a pointer to `references/autonomous-run.md` for the policy.

- [ ] **Step 5: Run the evals to verify they now pass**

Run: `node scripts/run-evals.js`
Expected: PASS. If a similarity or rank-1 failure appears, edit the skill description toward
the distinguishing words named in Step 3 and rerun. Do not weaken the eval case.

- [ ] **Step 6: Run the whole suite**

Run: `npm test`
Expected: PASS, with the skills count one higher than Task 1's baseline.

- [ ] **Step 7: Commit**

```bash
git add skills/autonomous-relay/SKILL.md AGENTS.md evals/cases/routing.json
git commit -m "feat: add the autonomous-relay skill"
```

---

### Task 3: The autopilot command and its generated shims

**Files:**
- Create: `.claude/commands/autopilot.md`
- Create (generated): `commands/autopilot.toml`, `.gemini/commands/autopilot.toml`
- Test: `npm test`

**Interfaces:**
- Consumes: the skill name `autonomous-relay` from Task 2, and the agent names already in
  `agents/`.
- Produces: the command `/autopilot`, named in Task 5's documentation.

- [ ] **Step 1: Write the command**

Create `.claude/commands/autopilot.md`. Frontmatter:

```yaml
---
description: Run a ticket end to end unattended, from requirements to a reviewed branch and a release plan
argument-hint: [ticket id or ticket body]
---
```

Body requirements:

- Opens with `Run this ticket unattended: $ARGUMENTS`.
- Names the skill as `` `autonomous-relay` `` and the policy as
  `` `references/autonomous-run.md` ``.
- States the ingestion rule: fetch by issue key when a tracker connector is available,
  otherwise treat the argument as the ticket body, and stop before the first stage when
  neither is possible.
- Lists the six stages with the role that owns each, using only backticked names that exist
  in `agents/`: `product-manager`, `tech-lead`, `software-engineer`, `senior-engineer`,
  `code-reviewer`, `test-engineer`, `sre`.
- States the abort condition and the git rule in one line each.
- Ends by requiring the run report from `references/autonomous-run.md`.

The validator scans this body for backticked lowercase-hyphen tokens of four or more
characters and fails on any that is not a known skill or agent. Write `autopilot`,
`unattended`, and `ticket` as plain words, never in backticks. Names containing a slash or a
dot, such as `references/autonomous-run.md`, are exempt and safe to backtick.

- [ ] **Step 2: Verify the token check passes before generating shims**

Run: `node scripts/validate.js`
Expected: PASS with the commands count at 9. A failure reading
`references \`<token>\`, which is neither a skill nor an agent` means an invented term is
backticked in the body; unbacktick it.

- [ ] **Step 3: Generate the shims**

Run: `node scripts/build-commands.js`
Expected: `commands: wrote 9 x 2 shims`

- [ ] **Step 4: Confirm the shims are in sync**

Run: `npm test`
Expected: PASS, ending with `commands: 9 in sync`.

- [ ] **Step 5: Commit**

```bash
git add .claude/commands/autopilot.md commands/autopilot.toml .gemini/commands/autopilot.toml
git commit -m "feat: add the autopilot command"
```

---

### Task 4: Documentation

**Files:**
- Modify: `README.md` — skill count, command table, skills list
- Modify: `CLAUDE.md`, `GEMINI.md` — command mention
- Modify: `docs/anatomy.md`, `docs/getting-started.md`, `docs/test-plan.md`
- Modify: `CHANGELOG.md`
- Test: `npm test`

**Interfaces:**
- Consumes: the command name from Task 3 and the skill name from Task 2. No new identifiers.

- [ ] **Step 1: Update README.md**

Three edits. First, the opening paragraph says `25 portable workflow skills`; change it to
`26`. Second, add a row to the command table, directly below the `/team` row:

```
| `/autopilot` | Run a ticket end to end unattended, then report |
```

Third, in the Skills section, append `` · `autonomous-relay` `` to the `**Meta**` line.

- [ ] **Step 2: Update CLAUDE.md and GEMINI.md**

Both files point at `AGENTS.md` as the entry point and need no structural change. Add one
sentence to each noting that `/autopilot` runs the lifecycle unattended and that the policy
governing it is in `references/autonomous-run.md`.

- [ ] **Step 3: Update the docs directory**

Read each file before editing and match its existing structure.

- `docs/anatomy.md` — add the new skill, reference, and command wherever that file
  enumerates them.
- `docs/getting-started.md` — add a short worked example showing the command invoked with an
  issue key and with a pasted body, and state plainly that it does not push or deploy.
- `docs/test-plan.md` — add a manual scenario: run the command against a ticket with no
  acceptance criteria and confirm the run report lists the derived criteria as assumptions
  rather than presenting them as given.

- [ ] **Step 4: Update CHANGELOG.md**

Read the file first and match its existing heading convention. Add one entry naming the
command, the skill, and the reference, in the same voice as the surrounding entries.

- [ ] **Step 5: Verify**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add README.md CLAUDE.md GEMINI.md docs/ CHANGELOG.md
git commit -m "docs: document the autopilot command"
```

---

### Task 5: Verify and open the pull request

**Files:**
- No source changes. This task produces evidence and a pull request.

**Interfaces:**
- Consumes: everything from Tasks 1 through 4.
- Produces: a pull request URL.

- [ ] **Step 1: Run the full suite and quote the output**

Run: `npm test`
Expected: PASS on all three stages. Record the decisive lines verbatim: the validator counts
line, the eval summary, and `commands: 9 in sync`.

- [ ] **Step 2: Confirm the generated shims have no drift**

Run: `node scripts/build-commands.js --check`
Expected: `commands: 9 in sync`, exit 0. A non-zero exit means a shim was hand-edited.

- [ ] **Step 3: Read the diff before publishing it**

Run: `git diff master...adt/autopilot --stat`
Expected: only the files this plan names. Anything else is scope creep and must be removed
before the branch is pushed.

- [ ] **Step 4: Push the branch**

```bash
git push -u origin adt/autopilot
```

- [ ] **Step 5: Open the pull request**

```bash
gh pr create --base master --head adt/autopilot \
  --title "Add /autopilot: unattended ticket-to-branch relay" \
  --body-file <path to a body written from the spec's decisions and the Step 1 output>
```

The body must state what was verified with quoted output, and must name the two limits
accepted deliberately: no budget ceiling, and a single abort condition.

- [ ] **Step 6: Report the pull request URL**

---

## Self-review

**Spec coverage.** D1 is Task 1 step 2 section 2 and Task 2 step 3. D2 is Task 2 step 3.
D3 is Task 1 step 2 section 4 and Task 2 step 3. D4 is Task 2 step 3. D5 is Task 2 step 3.
D6 is Task 2 step 3 and Task 3 step 1. D7 is the split across Tasks 1, 2, and 3. The spec's
four eval cases are covered by the positives and negatives in Task 2 step 1, except the T3
product-intent case, which has no free-tier home — routing evals rank descriptions and
cannot exercise a runtime decision. It belongs in `docs/test-plan.md` and is added there in
Task 4 step 3.

**Placeholders.** None. Every step names a command and its expected output.

**Consistency.** The skill name `autonomous-relay`, the reference path
`references/autonomous-run.md`, the command `/autopilot`, and the branch `adt/autopilot`
are spelled identically in every task.
