# Data Quality Checklist

## The rule

Data is wrong long before anyone notices, and the first person to notice is usually acting
on the wrong number. Every test here answers one question: if this broke silently, what
would tell us?

A pipeline that fails loudly is a good day. The expensive failure is the run that succeeds
and produces plausible garbage.

## The six dimensions

Every table worth alerting on gets a test in each row that applies to it.

| Dimension | Question | Typical test |
|-----------|----------|--------------|
| Freshness | Is the newest row recent enough to act on? | max timestamp within the SLA |
| Volume | Did roughly the expected number of rows arrive? | row count within a band of the trailing median |
| Uniqueness | Is the declared grain actually the grain? | count = count distinct on the key |
| Completeness | Are the columns people filter on populated? | null rate below threshold on required columns |
| Validity | Do values fall in the allowed set or range? | accepted values, ranges, referential integrity |
| Consistency | Does this agree with the source it derives from? | reconciliation against an upstream total |

Freshness and volume catch the majority of real incidents, and both are cheap. Add them
first, even when nothing else is tested yet.

## Where tests belong

- [ ] At the boundary where data enters your ownership, so an upstream break is attributed
      upstream rather than debugged in your code.
- [ ] At the boundary where data leaves it, so you find the defect before your consumer
      does.
- [ ] Not on every intermediate step. Tests nobody reads are noise that trains people to
      ignore the channel that matters.

## Freshness and volume

- [ ] Every table with a consumer has a stated freshness SLA, in the table's documentation,
      not in someone's memory.
- [ ] The freshness alert fires on the data, not on the job. A green DAG that wrote zero
      rows must still page.
- [ ] The volume band is derived from the trailing period, not from a number typed once.
- [ ] Zero rows is an explicit case. It is legitimate for some tables and an outage for
      others; say which this one is.

## Keys and joins

- [ ] Uniqueness tested on the declared grain of every persisted model.
- [ ] Every join key tested for referential integrity against its dimension.
- [ ] Fan-out checked after every join: row count before and after, with the expected
      relationship stated.
- [ ] Late-arriving dimension rows have a defined behaviour, and the unmatched-fact case is
      counted rather than silently dropped.

## Correctness under re-run

- [ ] The job produces the same output when run twice on the same input. Prove it by
      running it twice and diffing.
- [ ] Retries cannot duplicate rows: merge on a key, or delete-and-insert a bounded
      partition.
- [ ] The watermark and lateness window are written down, and records outside the window
      have a stated fate.
- [ ] Backfilling one historical partition reproduces the full recompute for that partition.

## Semantics

- [ ] Every metric has one definition, in one place, including its denominator and its
      exclusions.
- [ ] Time zone is stated for every date column that a report groups by. Day boundaries in
      the wrong zone move revenue between quarters.
- [ ] Nullable columns document what a null means: not applicable, not collected, or not
      yet known. These three are different and get filtered differently.
- [ ] Currency, unit, and scale are in the column name or the documentation. Never inferred.
- [ ] Deleted and test records have a defined treatment, applied consistently.

## Before trusting a number

- [ ] The source table passed its freshness check for the period in question.
- [ ] Volume for the period is within the normal band. A drop in the metric that matches a
      drop in row count is a pipeline incident, not a business event.
- [ ] The number reconciles against one independent source, and both numbers are quoted.
- [ ] The denominator is stated, and so is what it excludes.
- [ ] Sample size accompanies every segment figure.

## Alerting

- [ ] Every check has an owner who is expected to act, not a channel it is posted to.
- [ ] An alert states which table, which check, the observed value, and the threshold.
- [ ] Checks that fire routinely are either fixed or deleted. A noisy check is worse than
      no check, because it teaches people that the channel is ignorable.
