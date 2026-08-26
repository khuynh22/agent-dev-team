# agent-dev-team

A tiered engineering team for AI coding tools. Seventeen role agents across four seniority
tiers, twenty portable workflow skills, and an escalation protocol that keeps work at the
right level instead of letting one undifferentiated assistant attempt everything.

Works in Claude Code, Codex, Gemini CLI, Cursor, Windsurf, opencode, GitHub Copilot, and
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
| T1 | `software-engineer`, `docs-engineer` | Inside an existing pattern. Escalates on interface changes. |
| T2 | `senior-engineer`, `code-reviewer`, `sre`, `firmware-engineer` | Ambiguity, subsystems, migrations. Escalates on irreversible work. |
| T3 | `principal-engineer`, `tech-lead`, `security-auditor`, `incident-commander` | Must decide. Escalates only to the human, and only on intent, cost, or risk. |

Confidence never raises a ceiling. A T0 that is *sure* about an auth change is still a T0
touching auth.

## Install

### Claude Code

```bash
git clone https://github.com/OWNER/agent-dev-team.git
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
**Support** — `docs-engineer`

## Skills

**Define** `requirements-interview` · `spec-writing`
**Plan** `work-breakdown` · `architecture-decision` · `api-design`
**Build** `tdd-loop` · `incremental-delivery` · `frontend-build` · `firmware-build`
**Verify** `systematic-debugging` · `browser-verification`
**Review** `code-review-pass` · `simplification-pass` · `security-hardening` · `performance-pass`
**Ship** `release-and-rollback` · `incident-response` · `documentation`
**Meta** `using-agent-dev-team` · `team-escalation`

Checklists in `references/` load only when a workflow points at one, so they cost nothing
until they are needed.

## Testing

```bash
npm test                                     # static validation + routing evals, free
node scripts/run-evals.js --behavioral       # list behavioral cases
node scripts/run-evals.js --behavioral intern-ceiling
```

Four tiers, described in [`docs/test-plan.md`](docs/test-plan.md): static validation,
routing evals, behavioral evals with planted traps, and a twelve-scenario manual pass with
a per-tool scorecard.

The routing evals are worth a look even if you never change anything — they are what keeps
twenty skill descriptions distinguishable, and they caught four real description defects
during initial development.

## Portability, concretely

The Agent Skills spec permits exactly six frontmatter fields: `name`, `description`,
`license`, `compatibility`, `metadata`, `allowed-tools`. Any other key is a hard error on
claude.ai upload and the Skills API. So:

- `skills/` stays spec-pure. Tier and ownership data lives in `metadata`, which the spec
  allows and hosts ignore. `scripts/validate.js` enforces this.
- `agents/` carries Claude Code fields (`model`, `effort`, `tools`, `color`), because it is
  a Claude Code file format, not a spec file. The **body** of each agent file is plain
  markdown that any tool can use.
- `AGENTS.md` carries everything a tool needs with no file format at all.

The one thing Claude Code does that others cannot is spawn subagents automatically.
Everywhere else, a tier is a persona the model adopts and a protocol it follows — which is
text, and text travels.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). The short version: add routing eval cases before
the skill, and when an eval fails, fix the description rather than the case.

## Prior art

The lifecycle structure, the anti-rationalization tables, and the tiered eval approach
follow [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills). The tier
ladder, the handoff and brief contracts, and the firmware and hardware tracks are this
project's additions.

## License

MIT.
