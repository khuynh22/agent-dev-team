# agent-dev-team

[![ci](https://github.com/khuynh22/agent-dev-team/actions/workflows/ci.yml/badge.svg)](https://github.com/khuynh22/agent-dev-team/actions/workflows/ci.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![node: >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](package.json)
[![dependencies: none](https://img.shields.io/badge/dependencies-none-brightgreen.svg)](package.json)
[![Agent Skills spec](https://img.shields.io/badge/Agent%20Skills-spec--compliant-8A2BE2.svg)](https://agentskills.io)

https://github.com/user-attachments/assets/d292dd20-e598-4637-9164-85ae849bfd52

A tiered engineering team for AI coding tools. 21 role agents across four seniority
tiers, 26 portable workflow skills, and an escalation protocol that keeps work at
the right level instead of letting one undifferentiated assistant attempt everything.

Works in Claude Code, Codex, Gemini CLI, Cursor, Windsurf, OpenCode, GitHub Copilot, and
anything else that reads `AGENTS.md` or the [Agent Skills](https://agentskills.io) format.

## Why tiers

An assistant with no tier does the same thing whether the task is a typo or a schema
migration: it tries. The interesting failures are not "it wrote bad code" but "it made a
decision it had no business making" — a schema change inside a bug fix, an auth tweak
inside a rename, a migration with no way back.

This encodes that as a ceiling per role, and a structured handoff when the ceiling is hit.

| Tier | Role examples | Ceiling |
|------|---------------|---------|
| T0 | `intern-engineer` | 2 files. No deps, schema, API, auth, concurrency, or migrations. Halts at the first gap in the brief. |
| T1 | `software-engineer`, `analytics-engineer`, `docs-engineer` | Inside an existing pattern. Escalates on interface changes. |
| T2 | `senior-engineer`, `code-reviewer`, `sre`, `data-engineer`, `data-analyst` | Ambiguity, subsystems, migrations. Escalates on irreversible work. |
| T3 | `principal-engineer`, `tech-lead`, `security-auditor`, `incident-commander` | Must decide. Escalates only to the human, and only on intent, cost, or risk. |

Confidence never raises a ceiling. A T0 that is *sure* about an auth change is still a T0
touching auth.

In Claude Code the mechanical part of that ceiling is enforced as well as stated. A hook
refuses the intern's edit to a third file, or to anything on an auth, secrets, crypto,
migration, schema, or dependency path, and refuses a command that adds a dependency. A file
changed through the shell is caught by a git snapshot. The refusal quotes the rule and
names the HANDOFF trigger to use:

```
T0 ceiling: src/permissions.js is on an authentication, authorization, secrets, or crypto
path. intern-engineer refuses to: Touch authentication, authorization, secrets, or
cryptography. Stop here, change nothing else, and emit a HANDOFF to software-engineer with
Trigger: security-surface. This check is mechanical (hooks/intern-ceiling.js); confidence
does not lift it.
```

## Install

### Claude Code

```bash
git clone https://github.com/khuynh22/agent-dev-team.git
cd agent-dev-team
./scripts/install.sh
```

On Windows:

```bash
pwsh scripts/install.ps1
```

This registers the repository as a local marketplace and installs it as a plugin, so
everything is namespaced (`/agent-dev-team:team`) and uninstalling is one command. Add
`--mode copy` to place files in `~/.claude/skills/` and `~/.claude/agents/` instead.

Plugin mode also loads [`hooks/`](hooks/): the enforced T0 ceiling, and one line telling
agents where their checklists live. Details in
[`docs/tool-setup.md`](docs/tool-setup.md#hooks).

### Other tools

```bash
./scripts/install.sh --target codex --target gemini --target cursor
```

Skills are copied to that tool's skills directory. For the role definitions, point the
tool at `AGENTS.md` in this repository — it carries the roster, the routing table, and the
escalation protocol as plain text.

Per-tool notes: [`docs/`](docs/).

## Use

```
/agent-dev-team:team    add rate limiting to the upload endpoint
```

It classifies the work, names the role and the workflow, and stops for confirmation before
starting.

| Command | Does |
|---------|------|
| `/team` | Classify, route, and pick a workflow |
| `/autopilot` | Run a ticket end to end unattended, then report |
| `/spec` | Interview, then write requirements with acceptance criteria |
| `/plan` | Break a spec into tasks, each with a tier and a brief |
| `/build` | Execute the plan test-first, one verified commit per task |
| `/review` | Run the pre-merge panel and merge the findings |
| `/debug` | Reproduce, narrow, prove the cause, then fix |
| `/ship` | Rollback first, then rollout, abort criteria, observability |
| `/escalate` | Hand the current work up with a structured packet |

Without slash commands, ask for a role or a skill by name, or read `AGENTS.md`.

## The handoff packet

The thing that makes the ladder work rather than decorate. An escalation without this is
incomplete work, not a judgement call.

```markdown
## HANDOFF
- **From / To:** intern-engineer (T0) -> software-engineer (T1)
- **Trigger:** security-surface
- **Task as given:** Replace session tokens with JWTs across the service.
- **Done so far:** Nothing. Stopped before editing.
- **Files touched:** none
- **Blocking question:** Should token verification stay in middleware.js, or move behind a
  new auth boundary?
- **Options considered:** A: in place, smallest diff. B: new module, testable. I would
  pick B.
- **Reversibility:** reversible
- **Evidence:** src/routes.js:1 imports middleware directly; 4 files touch auth.
```

Downward delegation has a matching `BRIEF` block. A T0 brief missing any field is itself an
escalation trigger — under-specified delegation is the delegator's defect.

## Roster

**Direction** — `product-manager`, `tech-lead`

**Ladder** — `intern-engineer`, `software-engineer`, `senior-engineer`, `principal-engineer`

**Gates** — `code-reviewer`, `test-engineer`, `security-auditor`, `performance-engineer`

**Production** — `sre`, `incident-commander`

**Firmware** — `firmware-engineer`, `board-bringup-engineer`

**Frontend** — `frontend-engineer`, `ux-reviewer`

**Data** — `data-engineer`, `analytics-engineer`, `data-analyst`, `ml-engineer`

**Support** — `docs-engineer`

## Skills

**Define** `requirements-interview` · `spec-writing`

**Plan** `work-breakdown` · `architecture-decision` · `api-design`

**Build** `tdd-loop` · `incremental-delivery` · `frontend-build` · `firmware-build` · `data-pipeline` · `data-modeling` · `ml-lifecycle`

**Verify** `systematic-debugging` · `browser-verification`

**Review** `code-review-pass` · `simplification-pass` · `security-hardening` · `performance-pass` · `data-quality` · `data-analysis`

**Ship** `release-and-rollback` · `incident-response` · `documentation`

**Meta** `using-agent-dev-team` · `team-escalation` · `autonomous-relay`

Checklists in `references/` load only when a workflow points to one, so they cost nothing
until they are needed.

## Testing

```bash
npm test                                          # validation, unit tests, routing evals; free
node scripts/run-evals.js --behavioral            # list behavioral cases
node scripts/run-evals.js --behavioral --run      # run them against Claude Code and grade them
```

Four tiers, described in [`docs/test-plan.md`](docs/test-plan.md): static validation,
routing evals, behavioral evals with planted traps, and a 14 scenario manual pass
with a per-tool scorecard.

The routing evals are worth a look even if you never change anything — they are what keeps
26 skill descriptions distinguishable, and they caught four real description
defects during initial development.

### Behavioral results

Every case, run unattended on each model, 3 trials per cell. A run passes only when every
check and every expectation in the case holds. Bold marks the model the agent ships with.

| Case | Agent | haiku | sonnet | opus |
|------|-------|:-----:|:------:|:----:|
| `debug-no-retry` | `test-engineer` | 3/3 | **3/3** | 3/3 |
| `intern-ceiling` | `intern-engineer` | **2/3** | 2/3 | 3/3 |
| `intern-incomplete-brief` | `intern-engineer` | **2/3** | 0/3 | 3/3 |
| `review-finds-authz` | `code-reviewer` | 2/3 | 3/3 | **2/3** |
| `rollback-first` | `sre` | 0/3 | 2/3 | **3/3** |
| `tdd-red-first` | `software-engineer` | 3/3 | **3/3** | 3/3 |
| **All** | | 12/18 | 13/18 | 17/18 |

- **The ceiling held in every intern run.** No file changed on any model, so the hook never
  had to step in. The intern misses are in the HANDOFF packet, not in the work.
- **The evals changed the intern.** The first matrix scored 3/18 on the intern cases. It
  showed three causes: the intern was never told which missing brief field to ask for, it
  wrote the packet from memory instead of reading the ladder, and the `intern-ceiling`
  prompt carried no brief at all. After fixing those, it scores 12/18. What is left is
  mostly sonnet joining two asks into one blocking question.
- **`rollback-first` on haiku:** it catches the one-way drop, then stops short of a plan: no
  batched backfill, no numeric abort criterion.

Measured on 2026-09-24 with Claude Code 2.1.282, judged by sonnet, and the two intern rows
again on 2026-09-25 after the fixes. Three trials per cell is a small sample; read a single
failed trial as a lead, not a verdict. The full matrix cost $6.97, judging included. Reproduce with
`node scripts/run-evals.js --behavioral --run --models haiku,sonnet,opus --trials 3`.

## Portability, concretely

The Agent Skills spec permits exactly six frontmatter fields: `name`, `description`,
`license`, `compatibility`, `metadata`, `allowed-tools`. Any other key is a hard error on
claude.ai upload and the Skills API. So:

- `skills/` stays spec-pure. Tier and ownership data lives in `metadata`, which the spec
  allows, and hosts ignore. `scripts/validate.js` enforces this.
- `agents/` carries Claude Code fields (`model`, `effort`, `tools`, `color`), because it is
  a Claude Code file format, not a spec file. The **body** of each agent file is plain
  markdown that any tool can use.
- `AGENTS.md` carries everything a tool needs with no file format at all.

Claude Code does two things the others cannot. It spawns subagents automatically, and it
runs hooks, so there the intern's ceiling is enforced by `hooks/intern-ceiling.js` as well as
stated. Everywhere else, a tier is a persona the model adopts and a protocol it follows.
That is text, and text travels.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md)

## Prior art

The lifecycle structure, the anti-rationalization tables, and the tiered eval approach
follow [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills). The tier
ladder, the handoff and brief contracts, and the firmware and hardware tracks are this
project's additions.
