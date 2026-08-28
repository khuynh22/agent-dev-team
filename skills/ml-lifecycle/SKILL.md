---
name: ml-lifecycle
description: Takes a model to production without fooling anyone: measure a non-learned baseline first, split by time, hunt leakage, compute features once for training and serving, evaluate the worst slice, roll out behind a shadow or canary, monitor input and prediction drift, and pin a rollback to the previous version. Use when shipping, retraining, or debugging a model whose live quality has degraded.
license: MIT
metadata:
  phase: build
  owners: [ml-engineer]
  version: "0.1.0"
---

# ML Lifecycle

A model in a notebook is a claim. A model in production with a baseline, a monitor, and a
rollback is a system. Offline accuracy is not evidence of online value, and the first
suspiciously good result is usually leakage rather than skill.

Standing reference: `references/data-quality-checklist.md`.

## Process

1. **Measure a non-learned baseline first.** Last observed value, majority class, a
   three-line heuristic. Every subsequent number is a delta against it. If the model is
   within noise of the baseline, the correct deliverable is the baseline.

2. **Split by time when the data has time in it,** and hold out a period the model never
   sees. A random split on temporal data trains on the future and produces a number that
   does not survive next week.

3. **Hunt leakage before celebrating.** Any feature computed after the label exists, or read
   from a table that is updated retroactively, is leakage. Audit each feature by asking what
   its value would have been at prediction time. A first result far above the baseline is an
   alarm, not a win.

4. **Compute features once.** Training and serving read the same code path. Otherwise you
   ship a model that scores differently in production than in the notebook, and the
   investigation costs a week. If the paths must differ, measure the skew as a number.

5. **Evaluate slices, not just the aggregate.** By segment, cohort, volume tier, and on the
   tail. Report the worst slice in the headline, because the worst slice is what generates
   complaints and it is invisible in the average.

6. **Tie the offline metric to a product metric.** State the link explicitly: this ranking
   metric maps to that conversion outcome because of this mechanism. An offline win with no
   stated link is a number, not a reason to ship.

7. **Roll out behind shadow, then canary.** Score live traffic without acting on it, compare
   against the incumbent on the same requests, then take a percentage with an abort
   condition written down in advance.

8. **Monitor inputs and outputs after launch.** Feature distribution drift, prediction
   distribution drift, and the product metric. A degrading model raises no exception; the
   only signal is a monitor somebody built.

9. **Write the rollback before the launch.** Which version, how it is pinned, how long it
   takes, and what triggers it. Retraining is not a rollback: it takes hours and might not
   help.

## Output

```markdown
## Model: <name> v<n>

- **Baseline:** <what> — <metric> = <n>
- **Model:** <metric> = <n> (delta <n>), worst slice <name> = <n> (n=<n>)
- **Split:** temporal, train <range>, holdout <range>
- **Leakage audit:** <features checked, what was removed and why>
- **Train/serve parity:** <shared path | measured skew>
- **Product link:** <offline metric> to <product metric> via <mechanism>
- **Rollout:** shadow <duration>, canary <n>%, abort if <condition>
- **Monitors:** input drift <how>, prediction drift <how>, product metric <how>
- **Rollback:** to v<n-1> via <mechanism>, takes <time>, tested on <date>
```

## Verification

- Baseline and model numbers come from the same holdout; both quoted.
- Every holdout row is later in time than every training row.
- Shadow and production scores were compared on the same requests, and the skew is a number.
- Drift monitors were run against deliberately shifted input and fired.
- The rollback was executed once outside production and timed.

## Red flags

| Thought | Reality |
|---------|---------|
| "0.97 on the first attempt" | Leakage. Find it before telling anyone the number. |
| "The baseline is too trivial to measure" | Then it is cheap, and it is the bar your model has to clear. |
| "Shuffle split is standard" | Not on temporal data. You trained on the future. |
| "Serving recomputes features slightly differently" | That is skew, and it is the most common silent production failure. |
| "Accuracy is 94%" | On which slice? The worst one is the one people complain about. |
| "It is doing fine in production" | Measured how? Models degrade without raising an error. |
| "We can retrain if it drifts" | Retraining is not a rollback. What serves traffic meanwhile? |
| "The offline metric improved" | Linked to which product outcome, by what mechanism? |
