# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). For a
prompt library, a breaking change is one that renames or removes a role, a skill, or a
command, or that changes the escalation ladder in a way that redirects existing work.

## [Unreleased]

### Added

- `hooks/intern-ceiling.js`, a Claude Code hook that enforces the mechanical part of the T0
  ceiling. The intern's edits to a third file, or to an auth, secrets, crypto, migration,
  schema, or dependency path, are refused before they run, and so is a command that adds or
  upgrades a dependency. A file changed through the shell is caught by comparing git
  snapshots taken around the command. A refusal quotes the clause from
  `agents/intern-engineer.md` and names the HANDOFF trigger to use. Every other agent passes
  through.
- Unattended behavioral evals: `node scripts/run-evals.js --behavioral --run`. Each run
  starts Claude Code in a fresh copy of the fixture as the case's agent, then grades it in
  two layers: the case's deterministic `checks`, then a judge model that scores every
  expectation and must_not item against the diff and the transcript. `--models` and
  `--trials` build a matrix, and every transcript and verdict is kept for review.
- Behavioral cases name the `agent` they run as, and may carry `checks`.
- `scripts/validate.js` checks that `hooks/hooks.json` runs scripts that exist, that the
  ceiling hook's quotes still match the intern's Refuses list, and that every behavioral
  case names a real agent and fixture.
- Unit tests for the hooks and for the eval runner's grading, in `npm test` and CI.

### Fixed

- In a plugin install, agents could not find `references/`, because the path is relative
  to the plugin rather than the project. An escalating agent never saw the HANDOFF packet
  and improvised one. `hooks/plugin-root.js` now names the install path at session start
  and when one of this plugin's subagents starts. The first unattended eval run found it.
- The trigger list in the HANDOFF packet in `references/escalation-ladder.md` was missing
  `incomplete-brief`, which `AGENTS.md`, `team-escalation`, and the
  `intern-incomplete-brief` case all use.

## [0.2.0] - 2026-08-30

### Added

- Data track: `data-engineer` (T2), `analytics-engineer` (T1), `data-analyst` (T2), and
  `ml-engineer` (T2), with the escalation paths `analytics-engineer -> data-engineer ->
  principal-engineer` and `data-analyst -> product-manager -> tech-lead`.
- Skills `data-pipeline`, `data-modeling`, `data-quality`, `data-analysis`, and
  `ml-lifecycle`, plus the `references/data-quality-checklist.md` checklist.
- 27 routing eval positives and 10 negatives covering the new roles and skills.
- `data-engineer` joins the `/review` panel when a diff changes a pipeline, a warehouse
  model, or a metric definition.
- Open source scaffolding: `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, a pull
  request template, a tooling bug template, issue template routing, and Dependabot for
  GitHub Actions.
- Unattended runs: the `/autopilot` command, the `autonomous-relay` skill, and the
  `references/autonomous-run.md` policy. A run takes a ticket through requirements, plan,
  build, review, and a release plan without stopping at each stage boundary, and leaves a
  local branch. It does not push and does not deploy.
- Escalation redirect for unattended runs. A handoff packet from T0, T1, or T2 routes to a
  terminal tier rather than halting; only a T3's own escalation on intent, cost, or risk
  reaches the human. Ceilings, triggers, and the packet format are unchanged.
- Manual scenarios S13 and S14, covering declared assumptions and a ceiling holding while
  nobody is watching.

### Changed

- `scripts/validate.js` now checks the counts restated in `README.md`,
  `docs/test-plan.md`, and both marketplace manifests against the repository. Those four
  had drifted, and nothing else read them.
- CI now also triggers on pushes to `master`. It previously watched `main` only, so pushes
  to the default branch produced no run and the status badge had nothing to report.
- Descriptions for `data-modeling`, `data-pipeline`, `data-quality`, and `data-analysis`
  were tuned so the routing evals rank them first without displacing `code-review-pass` or
  `performance-pass`. Rank-1 rate is 119 of 124 (96%), up from 90 of 94 (96%).

## [0.1.0] - 2026-08-26

### Added

- Seventeen role agents across four tiers, with a machine-checked escalation ladder.
- Twenty portable workflow skills, Agent Skills spec compliant.
- Nine on-demand reference checklists.
- Eight slash commands, generated for Claude Code and Gemini CLI from one source.
- Four-tier test plan: static validation, routing evals, behavioral evals with planted
  traps, and a twelve-scenario manual pass with a per-tool scorecard.
- Installers for Claude Code, Codex, Gemini CLI, Cursor, and Windsurf.

[Unreleased]: https://github.com/khuynh22/agent-dev-team/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/khuynh22/agent-dev-team/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/khuynh22/agent-dev-team/releases/tag/v0.1.0
