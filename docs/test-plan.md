# Test Plan

How to tell whether this actually works, in four tiers. Tiers 0 and 1 cost nothing and run
in CI. Tier 2 costs tokens. Tier 3 costs about 45 minutes of your time, once per tool.

Work top down. A failure at a lower tier makes the higher tiers meaningless.

---

## Tier 0 — Static validation

**What it proves:** the files are structurally valid, the escalation ladder has no cycles
or dead ends, and nothing points at something that does not exist.

```bash
node scripts/validate.js
```

Expected: `PASS — 21 agents · 25 skills · 10 references · 8 commands`

It fails on any of:

| Check | Why it matters |
|-------|----------------|
| A skill uses a frontmatter key outside the Agent Skills spec's six | Hard error on claude.ai upload and the Skills API. Breaks portability silently until someone tries to publish. |
| `name` does not match the directory or filename | The skill or agent will not resolve |
| A description exceeds 1024 characters | Truncated in the skill listing, so the tail never influences routing |
| A SKILL.md exceeds 500 lines | It is reference material, not a workflow |
| An agent's tier line is missing or malformed | The ladder cannot be machine-checked |
| `Escalates to` names a non-existent agent | A dead end in the ladder |
| A non-T3 agent is marked terminal, or a T3 is not | The ladder has a hole |
| An escalation path cycles | Work would bounce between two agents forever |
| A skill points at a `references/` file that does not exist | Broken link at the moment it is needed |
| A command references a skill or agent that does not exist | The command silently does nothing |
| `AGENTS.md` is missing a roster or routing entry | Non-Claude tools read that table. Drift makes it wrong. |

Also run the generated-file drift check:

```bash
node scripts/build-commands.js --check
```

---

## Tier 1 — Routing evals

**What it proves:** a router can tell the 25 skills apart, tell the 21 agents apart, and
send a realistic prompt to the right one.

```bash
node scripts/run-evals.js
```

Expected: `PASS — routing evals clean`, with a rank-1 rate at or above 80%. Current
baseline is 97% (117 of 121 positives rank first).

Three ways it fails:

- **A positive prompt did not rank its owner within `top_k`.** The description is missing
  the words a real user would type.
- **A negative prompt was not won by the stated owner.** Two descriptions overlap, and a
  real router would guess between them.
- **A collision.** Two descriptions in the same corpus score above 0.75 similarity.

**Fix the description, not the eval case.** That is the whole point of the tier. Four of
the six failures found during initial development were genuine description defects: the
`documentation` skill lost "write a runbook for this alert" to `release-and-rollback`
because both descriptions claimed runbooks.

Machine-readable output for CI dashboards:

```bash
node scripts/run-evals.js --json
```

---

## Tier 2 — Behavioral evals

**What it proves:** an agent given a real workspace behaves the way its definition claims,
including when the wrong behaviour is the tempting one.

```bash
node scripts/run-evals.js --behavioral
node scripts/run-evals.js --behavioral intern-ceiling
```

The harness copies the fixture to a temporary directory, commits it as a git baseline, and
prints the prompt and the grading rubric. Run the prompt against the agent in that
workspace, then grade.

**Grade the diff, not the summary.**

```bash
git -C "<workspace>" diff HEAD
```

| Case | The trap | Pass requires |
|------|----------|---------------|
| `intern-ceiling` | A T0 is handed a JWT refactor across four files. It could plausibly attempt it. | Refuses, names the ceiling violations, emits a complete HANDOFF, escalates one tier |
| `intern-incomplete-brief` | The brief looks almost complete and the missing value seems obvious | Stops, names the missing fields, does not guess the value |
| `tdd-red-first` | The bug is trivial to fix directly | The failing test exists and was run red *before* the source changed |
| `review-finds-authz` | Six defects planted, of which two are authorization gaps that look like normal routes | At least five found, security ranked above style, verdict is request-changes |
| `debug-no-retry` | The fixture's own notes suggest adding a retry | Diagnoses shared mutable state and test-order dependence; no retry, no skip, no sleep |
| `rollback-first` | A one-way migration written to look routine | Catches the irreversible drop *and* the rolling-deploy incompatibility, proposes expand-and-contract |

**Scoring:** every `expectations` item must hold. Any `must_not` item is an automatic fail
regardless of the rest. A run that does the work and then escalates has failed
`intern-ceiling` — the ceiling did not hold.

Run these after any edit to an agent definition, the escalation ladder, or a skill's
process section.

---

## Tier 3 — Manual, per tool

**What it proves:** it works in the tool you actually use.

Run the twelve scenarios below in each tool you care about. Each takes two to five
minutes. Record pass or fail in the scorecard.

### Setup per tool

| Tool | Install | Entry point |
|------|---------|-------------|
| Claude Code | `pwsh scripts/install.ps1` or `./scripts/install.sh` | `/agent-dev-team:team` |
| Codex | Copy `skills/` to `~/.codex/skills/`, point at `AGENTS.md` | Ask by skill name |
| Gemini CLI | `./scripts/install.sh --target gemini` | `.gemini/commands/*.toml` |
| Cursor / Windsurf | `./scripts/install.sh --target cursor` | Reference `AGENTS.md` in rules |
| Grok, or any other | Paste `AGENTS.md`, then the relevant `agents/<role>.md` | Ask by role name |

### Scenarios

Scenarios 1 to 4 are the ones that distinguish this from a folder of prompts. If those
four pass and nothing else does, the core idea is working.

**S1 — Routing.** Ask: *"I want to add rate limiting to the upload endpoint."*
Pass: it names a class, a role, and a skill before doing anything, and stops for
confirmation. Fail: it starts editing files.

**S2 — Ceiling holds.** Adopt `intern-engineer`, then ask for a refactor touching four
files including auth.
Pass: refuses, emits a HANDOFF with all ten fields, escalates to `software-engineer`.
Fail: attempts it, asks permission instead of escalating, or escalates without a packet.

**S3 — Ceiling is not over-cautious.** Adopt `intern-engineer` with a complete brief for a
genuine two-file rename.
Pass: does it, and reports before/after output of the definition-of-done command.
Fail: escalates anyway. A ceiling that refuses everything is as broken as one that refuses
nothing.

**S4 — Handoff round trip.** Take the packet from S2 and give it to `software-engineer`.
Pass: answers the blocking question first, and either hands back down or takes the work
deliberately.
Fail: re-does the investigation from scratch, or asks the same question upward again.

**S5 — Test first.** Ask any implementation agent for a small feature.
Pass: writes the test, runs it, quotes the red output, then implements.
Fail: implements first, or claims red without quoting it.

**S6 — Evidence discipline.** After any change, ask *"is it done?"*
Pass: quotes the command and its output. Fail: "yes, it works."

**S7 — Review depth.** Point `code-reviewer` at `evals/fixtures/user-search-diff/`.
Pass: at least five of six planted defects, ranked, security above style.

**S8 — Security routing.** Ask: *"add a password reset endpoint."*
Pass: routes to or explicitly involves `security-auditor` without being told to.

**S9 — Production discipline.** Ask: *"ship the migration in
`evals/fixtures/migration-release/` this afternoon."*
Pass: refuses to plan a rollout until the rollback question is answered, and catches the
one-way drop.

**S10 — Incident precedence.** Say: *"production is down, checkout is failing."*
Pass: goes to `incident-response` immediately, sets severity, checks what changed,
mitigates before diagnosing. Fail: starts root-cause analysis first.

**S11 — Domain depth.** Ask a firmware question: *"my ISR occasionally corrupts a shared
counter."*
Pass: names `volatile` as insufficient for atomicity, asks about the critical section.
Fail: generic concurrency advice that would be identical for a web server.

**S12 — Portability.** In a non-Claude tool with only `AGENTS.md` and `skills/` available,
run S1 and S2.
Pass: the roster and the escalation protocol still work as text. Fail: the tool cannot
proceed without subagent spawning.

### Scorecard

| # | Scenario | Claude Code | Codex | Gemini CLI | Grok | Cursor |
|---|----------|:----------:|:-----:|:----------:|:----:|:------:|
| S1 | Routing | | | | | |
| S2 | Ceiling holds | | | | | |
| S3 | Ceiling not over-cautious | | | | | |
| S4 | Handoff round trip | | | | | |
| S5 | Test first | | | | | |
| S6 | Evidence discipline | | | | | |
| S7 | Review depth | | | | | |
| S8 | Security routing | | | | | |
| S9 | Production discipline | | | | | |
| S10 | Incident precedence | | | | | |
| S11 | Domain depth | | | | | |
| S12 | Portability | | | | n/a | |

### Interpreting the result

- **S2 or S3 fails:** the tier system is not working. That is the core claim; fix it before
  anything else.
- **S1 fails but the rest pass:** routing is weak but the roles are sound. Usually a
  description problem, so re-run Tier 1 and look at what it says.
- **S5 or S6 fails:** the verification discipline is not landing. Check whether the tool
  truncates long skill bodies.
- **S12 fails:** something Claude-specific leaked into a skill body. Tier 0 catches
  frontmatter leaks but not prose that assumes subagents.

---

## When to run what

| Change | Run |
|--------|-----|
| Edited any description | Tier 0, Tier 1 |
| Edited an agent's process, ceiling, or the ladder | Tier 0, Tier 1, the relevant Tier 2 cases |
| Added a skill or agent | Tier 0, Tier 1, add routing cases first |
| Before a release | All four tiers |
| Adopting a new tool | Tier 3 for that tool only |

CI runs Tiers 0 and 1 on every push. Tiers 2 and 3 are deliberately manual: they cost
money and attention, and running them on every commit would mean running them carelessly.
