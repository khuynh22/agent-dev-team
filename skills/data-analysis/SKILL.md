---
name: data-analysis
description: Answers a question from data honestly: define the metric and its denominator up front, verify the data is fresh and complete, reconcile against a number somebody already trusts, segment before concluding, rule out the boring explanations, and ship the caveat alongside the number. Use when asked why signups, revenue, or conversion dropped last week, why a metric moved, what a number really means, or whether a dashboard can be believed.
license: MIT
metadata:
  phase: review
  owners: [data-analyst]
  version: "0.1.0"
---

# Data Analysis

The number is the smallest part of the answer. The definition, the denominator, the sanity
check, and the caveat are what make it safe for somebody to act on.

Standing reference: `references/data-quality-checklist.md`.

## Process

1. **Restate the question and the decision behind it.** "Did signups drop" and "should we
   roll back last night's release" need different analyses and different precision. Without
   the decision you cannot tell when the analysis is finished.

2. **Define the metric in writing before you query.** Numerator, denominator, time grain,
   time zone, exclusions: internal accounts, bots, refunds, test records. Most disputed
   numbers are two people using one word for two definitions, discovered an hour into an
   argument.

3. **Verify the data before trusting it.** Freshness for the period, row volume against the
   prior period, null rates on the columns you filter on. A pipeline gap is
   indistinguishable from a real drop until you check, and it is the more common cause.

4. **Reconcile against something already believed.** Billing, the previous dashboard, a hand
   count for one day. Quote both numbers. An unreconciled number is a draft.

5. **Segment before concluding.** A flat aggregate hides two populations moving in opposite
   directions, and the interesting finding is almost always inside a segment. Report sample
   size with every segment figure.

6. **Rule out the boring explanations, in this order:** a data problem, seasonality or day
   of week, a release, a tracking or instrumentation change, one large account, reporting
   lag. Name which you tested and how, including the ones that survived.

7. **Separate correlation from cause, in the sentence itself.** Observational comparisons
   between people who did and did not do something are selection effects until an experiment
   or a natural one says otherwise. Write "associated with", and say what would be needed to
   claim more.

8. **State the caveat with the number, not underneath it.** Sample size, window sensitivity,
   what would change the conclusion. A finding that only holds for one window is a finding
   about the window.

## Experiment readouts

- The metric, the exposure definition, and the analysis window are fixed before looking.
- Report the absolute effect and the interval, not only whether it cleared a threshold.
- A non-significant result is a result. Report it as "no detectable effect above <n>", never
  as "no effect".
- Check the guardrail metrics and the sample ratio before reading the headline number.

## Output

```markdown
## Question: <what was asked, and the decision it feeds>

- **Metric:** <numerator> / <denominator>, <grain>, timezone <tz>, excluding <list>
- **Answer:** <number, absolute and relative change, n>
- **Query:** `<path>` — source <table>, as of <date>
- **Data checks:** freshness <ok | stale>, volume vs prior <n>, nulls <n>
- **Reconciled against:** <trusted source> — <both numbers>
- **Segments:** <segment> <value> (n=<n>) ...
- **Ruled out:** <data | seasonality | release | tracking change | outlier account>
- **Caveats:** <sample size, window sensitivity, what this cannot show>
- **Confidence:** high | medium | low, and what would raise it
```

## Verification

- Every number traces to a saved, re-runnable query.
- Every rate has its denominator stated, and every segment has its sample size.
- The result reconciles against one independent source; both numbers are quoted.
- At least one alternative explanation was tested and reported, including when it survived.
- No causal verb appears where the design does not support one.

## Red flags

| Thought | Reality |
|---------|---------|
| "Signups dropped 30%" | Over what base, over what window, and was the pipeline fresh? |
| "The correlation is strong" | Strong correlation on observational data is still not a cause. |
| "This segment converts 4x better" | With n=11. Sample size comes before the multiple. |
| "The number looks about right" | Right against what? Reconcile it. |
| "I will start the chart in March" | If the story needs March, the start date is the story. |
| "The dashboard says so" | The dashboard has a definition. Read it before repeating it. |
| "The average is flat" | Two populations moving opposite ways average to flat. Segment. |
| "Not significant, so no effect" | It means no effect detectable at this sample size. Say that. |
