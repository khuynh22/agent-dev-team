# agent-dev-team

Read `AGENTS.md` in this repository. It is the entry point: roster, tiers, routing table,
escalation protocol, and the non-negotiables that apply to every role.

When working **on** this repository rather than with it:

- `skills/*/SKILL.md` frontmatter must use only the six Agent Skills spec fields: `name`,
  `description`, `license`, `compatibility`, `metadata`, `allowed-tools`. Any other key is
  a hard error on claude.ai upload and the Skills API. Claude Code-only fields belong in
  `agents/*.md`, which is not a spec file.
- `agents/*.md` must carry the tier line: `**Tier:** T<n> · **Escalates to:** <agent> ·
  **Terminal:** yes|no`. `scripts/validate.js` parses it.
- Command shims under `.gemini/commands/` and `commands/` are generated. Edit
  `.claude/commands/*.md` and run `node scripts/build-commands.js`.
- Run `npm test` before committing. It runs static validation and the routing evals.
