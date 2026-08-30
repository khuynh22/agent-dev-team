# agent-dev-team

Read `AGENTS.md` in this repository. It is the entry point: roster, tiers, routing table,
escalation protocol, and the non-negotiables that apply to every role.

Role definitions are in `agents/`. Workflows are in `skills/<name>/SKILL.md`. Checklists
in `references/` load on demand — read one when a workflow points at it, not before.

Slash commands for Gemini CLI are in `.gemini/commands/`.

`/autopilot` runs the whole lifecycle unattended for a single ticket. The policy governing
an unattended run — where escalations go, what gets tagged as an assumption, and the report
it must emit — is `references/autonomous-run.md`.
