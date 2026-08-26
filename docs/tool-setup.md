# Tool Setup

Skills in this repository follow the [Agent Skills](https://agentskills.io) spec, so most
tools load them without translation. Role definitions are Claude Code subagent files whose
**bodies** are plain markdown — every tool can use the body, and only Claude Code uses the
frontmatter.

## Claude Code

```bash
./scripts/install.sh
```

Registers the repository as a local marketplace and installs the plugin. Everything is
namespaced, so nothing collides with your existing plugins:

- Commands: `/agent-dev-team:team`, `/agent-dev-team:review`, and so on
- Skills: `/agent-dev-team:tdd-loop`, or loaded automatically by description
- Agents: available to the `Agent` tool by name

Alternative, without the plugin layer:

```bash
./scripts/install.sh --mode copy
```

Skills go to `~/.claude/skills/adt-<name>/` (prefixed so they cannot shadow your own), and
agents to `~/.claude/agents/<name>.md` (**not** prefixed — an agent of yours with the same
name is overwritten).

Uninstall: `./scripts/install.sh --uninstall`, adding `--mode copy` if that is how you
installed.

Note: this repository ships a `systematic-debugging` skill, as does the Superpowers plugin.
Under plugin install they are namespaced apart. Under `--mode copy` ours is `adt-` prefixed.
Neither shadows the other.

## Codex

```bash
./scripts/install.sh --target codex
```

Copies skills to `~/.codex/skills/`. For roles, add this repository's `AGENTS.md` to your
project context, or paste the relevant `agents/<role>.md` body at the start of a session.

Codex reads `AGENTS.md` from the working directory, so a project that vendors or symlinks
this file gets the roster and the escalation protocol without any per-session setup.

## Gemini CLI

```bash
./scripts/install.sh --target gemini
```

Slash commands are already in `.gemini/commands/*.toml`, generated from the canonical
markdown. Point Gemini at `GEMINI.md`, which forwards to `AGENTS.md`.

## Cursor and Windsurf

```bash
./scripts/install.sh --target cursor     # or --target windsurf
```

Then reference `AGENTS.md` from your rules file rather than pasting its contents. Pasting
the roster into a rules file puts it in every request, which is exactly the cost that
progressive disclosure exists to avoid — a description is cheap, a body is not.

## opencode

```bash
./scripts/install.sh --target opencode
```

opencode reads `AGENTS.md` from the project root. Vendor or symlink this repository's copy.

## GitHub Copilot

Copy `.github/copilot-instructions.md` into your repository, and vendor `AGENTS.md`
alongside it. Copilot has no skill loader, so the instructions file carries the routing
rules and the non-negotiables directly, and points at the roster for depth.

## Grok, ChatGPT, and anything else

No installer. Two files get you the system:

1. Paste `AGENTS.md`. That is the roster, the tiers, the routing table, and the escalation
   protocol.
2. Paste the `agents/<role>.md` body for the role you want, and the `skills/<name>/SKILL.md`
   body for the workflow.

Everything degrades to text on purpose. The only capability that is genuinely
Claude-specific is automatic subagent spawning; everywhere else a tier is a persona the
model adopts and a protocol it follows.

## Verifying any tool

Run scenarios S1, S2, S3, and S12 from [`test-plan.md`](test-plan.md). Those four tell you
whether the tier system is loading. Record the result in the scorecard.

If S2 fails — a T0 attempts work above its ceiling — the usual cause is that the tool
truncated the agent body, or never loaded it. Check that the ceiling section is actually
present in what the model received.
