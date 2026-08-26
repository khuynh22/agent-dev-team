# Getting Started

## Install

```bash
git clone https://github.com/OWNER/agent-dev-team.git
cd agent-dev-team
./scripts/install.sh          # pwsh scripts/install.ps1 on Windows
```

Verify it landed:

```bash
node scripts/validate.js
```

Then start a new session in your tool. Per-tool details: [`tool-setup.md`](tool-setup.md).

## The first five minutes

Ask for routing before anything else:

```
/agent-dev-team:team    add rate limiting to the upload endpoint
```

You should get four lines — class, role, skill, first action — and then a stop. That stop
is the point. It is cheap to redirect there and expensive to redirect after six files have
changed.

Now try the thing that makes this different from a folder of prompts. Ask an
`intern-engineer` to do something it should refuse:

```
Act as the intern-engineer agent. Replace our session tokens with JWTs across the service.
```

It should refuse, name the ceiling it would have crossed, and emit a handoff packet. If it
starts editing files, the ladder is not loading — check `docs/tool-setup.md` for your tool.

## Two ways to work

**Full lifecycle** — for something new, or something that will outlive the week:

```
/spec    what you want            -> requirements with acceptance criteria
/plan    the spec                 -> ordered tasks, each with a tier and a brief
/build   the plan                 -> one verified commit per task
/review                           -> the pre-merge panel
/ship                             -> rollback first, then rollout
```

**Verification first** — for an existing codebase you did not write. Start at the end and
work backwards. Run `/review` on a diff you already trust, and see whether the findings
match your instinct. Then add `/debug` for the next real bug. Then `/build` when you
believe the gates.

Adopting the whole lifecycle on an established codebase on day one usually means adopting
none of it by day three.

## Reading the tiers

The number in a role's tier line is a ceiling, not a quality rating. `intern-engineer` is
not a worse engineer; it is a cheaper one with a hard boundary, and its most valuable
behaviour is stopping. Assign the lowest tier that clears the ceiling. Routing everything
to `principal-engineer` costs more and, because it hides vague briefs, produces worse work.

Full definitions: [`references/escalation-ladder.md`](../references/escalation-ladder.md).

## What to expect it not to do

- It will not make product decisions. `product-manager` will ask you.
- It will not decide your risk appetite. T3 roles escalate that to you by design.
- It will not skip the rollback question to ship faster.
- It will not tell you tests pass without quoting the run.

If any of those happen, that is a bug worth filing.

## Next

- [`test-plan.md`](test-plan.md) — how to verify it works in your tool
- [`anatomy.md`](anatomy.md) — how a skill and an agent are put together
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — adding your own
