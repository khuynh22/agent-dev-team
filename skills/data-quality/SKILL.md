---
name: data-quality
description: Adds the checks that catch a silently broken table: freshness, volume against a trailing band, uniqueness on the grain, completeness, validity, and reconciliation against an upstream total, each alerting a named owner. Use when a table has no tests, when a wrong number reached a dashboard, when a scheduled job exited successfully but wrote zero rows, or before trusting data enough to act on it.
license: MIT
metadata:
  phase: review
  owners: [data-engineer, analytics-engineer, data-analyst]
  version: "0.1.0"
---

# Data Quality

The expensive failure is not the job that crashes. It is the run that succeeds and writes
plausible garbage, which is then queried, charted, and acted on. Every check here answers
one question: if this broke silently, what would tell us?

Standing reference: `references/data-quality-checklist.md`.

## Process

1. **Start with freshness and volume.** They are cheap and they catch most real incidents.
   Max timestamp against a stated SLA, row count against a trailing median band. Add them
   before anything more sophisticated, even to a table that has no other tests.

2. **Alert on data, not on task exit.** A green pipeline that produced zero rows is the
   failure that costs a week, and task-failure alerting is blind to it by construction.

3. **Test the grain.** Count against count-distinct on the declared key. If the table has no
   declared key, that is the first finding, not a reason to stop testing.

4. **Then completeness and validity.** Null rate on the columns people filter by, accepted
   values on enums, ranges on numerics, referential integrity on join keys.

5. **Reconcile against an independent source.** The upstream total, the billing system, a
   hand count for one day. Two systems agreeing is worth more than any single check.

6. **Place tests at ownership boundaries.** Where data enters your ownership and where it
   leaves it. Tests on every intermediate step become noise, and noise trains people to
   ignore the channel that matters.

7. **Prove each check fails.** Feed it deliberately bad data: hold the pipeline back, drop
   rows, inject a duplicate, and watch the check go red. A quality check never seen red is
   decoration.

8. **Give every check an owner and a threshold in the alert text.** Which table, which
   check, observed value, threshold. An alert that says "data quality issue" gets muted.

## Triage: a number looks wrong

Work in this order. Most wrong numbers resolve in the first two steps.

1. Is the source table fresh for the period? A pipeline gap looks exactly like a real drop.
2. Is row volume for the period in the normal band? A metric that fell in step with row
   count is an incident, not a business event.
3. Did the definition change? Check the model, the dashboard filter, the deploy history.
4. Did the grain change? Count against count-distinct on the key for that period.
5. Did the upstream change? A new enum value, a renamed column, a source-side backfill.
6. Only then look for a real change in behaviour.

## Output

```markdown
## Quality: <table or model>

- **Freshness:** SLA <target>, observed <value>, alert <name> to <owner>
- **Volume:** band <range> from trailing <n> periods, observed <value>
- **Uniqueness:** key <cols>, count <n> vs distinct <n>
- **Completeness:** <col> null rate <n>% (threshold <n>%)
- **Validity:** <accepted values / ranges / referential checks>
- **Reconciliation:** <this> <n> vs <independent source> <n>, delta <n>
- **Negative test:** <what was corrupted>, check <name> went red — output quoted
```

## Verification

- Every check was run against corrupted input and failed as designed; quote one.
- Freshness alerting was triggered by withholding data, not assumed to work.
- Each check names an owner expected to act, not only a channel.
- Checks that fire routinely were fixed or deleted before this was called done.

## Red flags

| Thought | Reality |
|---------|---------|
| "The job succeeded" | Succeeded is not correct, and zero rows also exits zero. |
| "The number looks plausible" | Plausible is how a wrong number survives to the dashboard. |
| "We will notice if it breaks" | You will notice when somebody acts on it. Later, and more expensive. |
| "I will test every model" | Then the alerts are noise and the real one is muted with the rest. |
| "The check has never fired" | Prove it can. Corrupt the input and watch it go red. |
| "Alerts go to the data channel" | Channels do not act. Name a person. |
