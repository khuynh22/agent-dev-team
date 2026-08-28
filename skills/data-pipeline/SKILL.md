---
name: data-pipeline
description: Builds an ingestion or ELT job that can be safely re-run: declared contract and grain, idempotent writes, an explicit rule for late and duplicate records, an incremental path proven against a full recompute, and freshness alerting on rows rather than on task exit codes. Use when building or fixing a pipeline, when planning a backfill or replay of historical rows into a warehouse table, when a schema change needs a backfill, or when a job produced duplicate rows.
license: MIT
metadata:
  phase: build
  owners: [data-engineer]
  version: "0.1.0"
---

# Data Pipeline

A pipeline is a promise about rows: this many, this fresh, at this grain, keyed like this.
Write the promise down first, then make the job keep it even when it runs twice.

Standing reference: `references/data-quality-checklist.md`.

## Process

1. **Write the contract before the job.** Source, grain ("one row per order per status
   change"), primary key, expected volume per run, freshness target, and what a null means
   in each nullable column. A pipeline with no declared grain accumulates duplicates that
   nobody notices for a quarter, and by then three dashboards depend on the inflated number.

2. **Make the write idempotent.** Re-running the same input must produce the same output.
   Two shapes work: merge on the key, or delete-and-insert a bounded partition. Append into
   a table with no dedupe key is a duplicate factory; the first retry proves it.

3. **Decide the lateness rule out loud.** What is the watermark, how late may a record
   arrive and still be processed, and what happens to one that arrives later. Dropping late
   records is a legitimate choice. Dropping them without writing that down is a defect that
   surfaces during someone else's incident.

4. **Handle duplicates at the source of truth, not downstream.** Deduplicating in every
   consuming query means every future consumer must remember to do it, and one will not.

5. **Build incremental, prove it against a full recompute.** Run the incremental logic over
   one historical partition and compare row counts and one summed measure against the
   complete rebuild of that partition. Equality is the evidence. Without it, the incremental
   path is a guess that will diverge slowly.

6. **Test at the boundaries.** Freshness, volume against a trailing band, uniqueness on the
   key, referential integrity on join keys, nullability on required columns. Tests belong
   where data enters your ownership and where it leaves it, not on every intermediate step.

7. **Alert on the data, not the task.** A DAG that exits zero while writing zero rows is the
   failure that costs a week, and a task-failure alert never fires for it. Alert on max
   timestamp and on row count.

8. **Report cost.** Bytes scanned, slot or warehouse seconds, storage delta. Correct and
   over budget is not done.

## Backfills

A backfill is a production change to historical data. Treat it like a deployment.

- Bound it: one partition first, then a range, never the whole table in one statement.
- Write it so it can be stopped and resumed. A backfill that must complete or be restarted
  from zero will be restarted from zero, at the worst time.
- Compare the backfilled partition against the old values before overwriting the rest, and
  keep the comparison.
- Never delete raw history to fix a derived error. Fix forward in the derived layer; raw is
  the audit trail.

## Schema changes

- Additive first: add the new column, populate it, migrate readers, then remove the old one.
  A rename in one step breaks every reader between deploy and deploy.
- State what happens to readers during the change, including the ones you do not own.
- A destructive change (drop, type narrowing, retention reduction) is irreversible. It
  escalates; it does not get scheduled for a Friday.

## Output

```markdown
## Pipeline: <name>

- **Contract:** grain <one row per X> · key <cols> · freshness <target> · volume <expected>
- **Idempotency:** <merge | delete-insert> — ran twice, row counts <n> and <n>
- **Late data:** watermark <n>, outside it <dropped | reprocessed>, counted as <metric>
- **Incremental proof:** partition <p>, incremental <n> rows / <sum>, full recompute <n> / <sum>
- **Tests:** <checks, where they run, what they page>
- **Cost:** <bytes scanned / slot seconds / storage delta>
- **Rollback:** <how to undo, and what is lost>
```

## Verification

- The job ran twice on identical input; both row counts are quoted and equal.
- The incremental partition matches the full recompute; both numbers quoted.
- Quality tests were run against deliberately corrupted input and failed as designed. A
  test never seen red proves nothing here either.
- The freshness alert was triggered by holding data back, not assumed to work.
- Cost is an absolute number.

## Red flags

| Thought | Reality |
|---------|---------|
| "It is fine to re-run" | Run it twice and diff before you believe that. |
| "Append is simpler" | Until the retry, and then the duplicates are indistinguishable. |
| "The DAG is green" | Green means exit zero. It says nothing about rows written. |
| "Late data is rare" | It is rare until the upstream incident, which is when the number matters most. |
| "I will backfill after launch" | Then the column has two meanings and both are in production. |
| "I will fix the number with an UPDATE" | Now the table disagrees with the pipeline and neither can be trusted. |
| "Nobody queries this table" | Verify. Nobody queried it until the exec dashboard did. |
