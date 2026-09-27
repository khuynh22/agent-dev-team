# Evals

Four tiers. The first two are free and run in CI. The third costs tokens and is run on
demand, by hand or unattended. The fourth is you, once, per tool you care about.

| Tier | What it proves | Cost | Command |
|------|----------------|------|---------|
| 0 | Files are structurally valid and the ladder has no holes | Free | `node scripts/validate.js` |
| 1 | A router can tell the roles and skills apart | Free | `node scripts/run-evals.js` |
| 2 | Agents actually behave as their definitions claim | Tokens | `node scripts/run-evals.js --behavioral --run` |
| 3 | It works in your tool, on your machine | Your time | `docs/test-plan.md` |

## Tier 1: routing

`cases/routing.json` holds trigger cases for every skill and every agent. Scoring uses a
TF-IDF ranker over stemmed tokens (`scripts/lib/rank.js`), so it is deterministic, free,
and stable across runs. It approximates how a model reads descriptions closely enough to
catch the failure that matters: two descriptions a router cannot tell apart.

### Routing schema

```jsonc
{
  "groups": [
    {
      "kind": "skill",              // "skill" or "agent" — separate corpora, ranked separately
      "cases": [
        {
          "owner": "tdd-loop",      // must exist in that corpus
          "top_k": 3,               // positives must rank within this. Use 1 for signature asks.
          "positive": [
            "write the failing test first then make it pass"
          ],
          "negative": [
            {
              "prompt": "the suite is flaky and intermittently red",
              "owner": "systematic-debugging"   // this must outrank the case owner
            }
          ]
        }
      ]
    }
  ]
}
```

**Pass** requires all three: every positive within its `top_k`, every negative won by the
stated owner, and no two descriptions in a corpus more than 0.75 similar. The rank-1 rate
must also stay at or above 80%.

**When a case fails, fix the description, not the case.** A positive that ranks fourth
means the description does not contain the words a user would use. A negative that loses
means two descriptions overlap and a real router would guess between them.

## Tier 2: behavioral

`cases/behavioral/*.json` describe scenarios where a fixture is designed so that the wrong
behaviour is the tempting one. The harness copies the fixture to a temporary directory,
commits it as a git baseline, and prints the prompt and the grading rubric:

```bash
node scripts/run-evals.js --behavioral
node scripts/run-evals.js --behavioral intern-ceiling
```

Run the printed prompt against the agent under test in that workspace, then grade against
the rubric. `git -C <workspace> diff baseline` shows what the agent actually changed, commits included, which is
what you grade — not its summary of what it did.

### Running unattended

```bash
node scripts/run-evals.js --behavioral --run                  # every case, each agent's own model
node scripts/run-evals.js --behavioral intern-ceiling --run --models haiku,sonnet,opus --trials 3
```

Each run starts Claude Code in a fresh copy of the fixture as the case's `agent`
(`claude -p --agent agent-dev-team:<agent>`), with this checkout loaded as the plugin, so
the hooks apply exactly as they do for a user. The plugin is staged without `evals/`: the
agent can find the checklists, not the rubric it is graded on. Grading has two layers.

1. **Checks.** The case's `checks` block, below, is deterministic. A failed check fails
   the run, and no model can argue it back.
2. **A judge model** (`--judge`, default `sonnet`) scores every expectation and every
   must_not item against the diff and the transcript, and quotes the decisive line. It is
   told that the agent's account of itself is a claim, not evidence.

A run passes only when every check passes, every expectation is met, and no must_not item
happened. That is the same all-or-nothing rule as grading by hand.

Everything lands in `evals/results/<stamp>/`, which is gitignored: the transcript, the
diff, the prompt the judge saw, its verdict, and a `summary.md` listing every failure with
the evidence for it. Read those before trusting a number. A judge can be wrong, and the
evidence is there so you can check it.

| Flag | Default | Meaning |
|------|---------|---------|
| `--models` | `shipped` | Comma-separated aliases. `shipped` uses each agent's own `model` |
| `--trials` | 1 | Runs per case and model |
| `--judge` | `sonnet` | Model that grades |
| `--jobs` | 2 | Runs in parallel |
| `--budget` | 3 | Dollar cap per agent run |
| `--max-turns` | 60 | Turn cap per agent run |
| `--no-hooks` | off | Run with the plugin's hooks disabled, to compare |

The agent runs with edits auto-accepted and Bash allowed, in a temporary directory. Run it
where you would let an agent run shell commands.

### Behavioral schema

| Field | Meaning |
|-------|---------|
| `title` | One line, shown in the listing |
| `under_test` | The files whose behaviour this case exercises |
| `agent` | The agent the case runs as, unattended |
| `fixture` | Directory under `evals/fixtures/` |
| `prompt` | Given to the agent verbatim |
| `expectations` | All must hold for a pass |
| `must_not` | Any one of these is an automatic fail |
| `checks` | Optional deterministic checks, scored before the judge |
| `grade` | Notes on what the case is really testing |

| Check | Passes when |
|-------|-------------|
| `unchanged` | No changed file starts with any listed prefix |
| `changed` | Every listed prefix has at least one changed file under it |
| `output_matches` | Every pattern matches the agent's text, case-insensitive and multiline |
| `after` | `{"run": "<command>", "expect": "pass"}` or `"fail"`, run in the workspace after the agent stops |

Encode only what the rubric already says. A check stricter than the expectations quietly
changes the case.

Every behavioral case includes a trap. `debug-no-retry` puts the wrong fix in the fixture's
own notes; `rollback-first` makes a one-way migration look routine; `intern-ceiling` gives
a T0 a task it could plausibly attempt. A case where the right answer is the obvious one
tests nothing.

## Adding a case

1. Add trigger cases to `cases/routing.json` for any new skill or agent. Two or three
   positives in the words a real user would type, and one negative pointing at the nearest
   neighbour.
2. Run `node scripts/run-evals.js`. If it fails, the description needs work.
3. For a behavior worth guarding, add a fixture under `evals/fixtures/` and a case under
   `cases/behavioral/`. Build the trap in. Give it an `agent`, turn anything mechanical in
   the rubric into `checks`, and run it unattended a few times before you trust it.
