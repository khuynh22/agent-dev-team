---
name: data-modeling
description: Designs the warehouse tables analysts read: grain declared before any column, staging and mart layers kept apart, one home per metric definition, slowly changing dimensions that keep their history, a uniqueness test on every key, and reconciliation against a total somebody already believes. Use when building or refactoring a dbt or SQL transformation, when a join fans out, or when one metric is computed three different ways.
license: MIT
metadata:
  phase: build
  owners: [analytics-engineer, data-engineer]
  version: "0.1.0"
---

# Data Modeling

A model is a claim about shape: one row per this, keyed by that, meaning exactly this. Most
modelling bugs are a grain nobody wrote down, discovered later as a number that is quietly
double what it should be.

Standing reference: `references/data-quality-checklist.md`.

## Process

1. **Declare the grain in the first line of the model.** "One row per subscription per
   billing period." Every column decision follows from it, and the uniqueness test that
   guards it comes free once it is written.

2. **Search for the metric before defining it.** Grep the transformation project, then the
   dashboards. If "active user" already exists, use it or replace it. Forking it produces
   two numbers that both cite the warehouse and disagree in a meeting.

3. **Keep the layers honest.**
   - *Staging*: rename, cast, deduplicate. One staging model per source table. No joins, no
     business logic, because logic here leaks into every consumer that follows.
   - *Intermediate*: the joins and the reshaping, where fan-out is possible and therefore
     tested.
   - *Mart*: what people query, named in their language, documented.

4. **Choose the history behaviour deliberately.** Type 1 overwrites, and silently rewrites
   every historical report that reads the dimension by date. Type 2 keeps a row per version
   with valid-from and valid-to. Pick one, write which, and be able to say why.

5. **Test the key before anything else.** Uniqueness and not-null on the declared grain.
   Then referential integrity on every join key, accepted values on every enum, and a
   not-null on the columns people filter by.

6. **Check fan-out at every join.** Row count before and after, with the expected
   relationship stated. A join that silently multiplies rows is the most common way a
   correct-looking model doubles revenue.

7. **Reconcile against something already believed.** The source table total, the previous
   dashboard, the billing system. Quote both numbers. An unreconciled model is a hypothesis
   with a schedule.

8. **Document the columns that will be misread.** Not all of them: the ones whose name
   promises something the definition does not deliver.

## Metric definitions

One definition, one place, and it includes the denominator and the exclusions. A metric
definition is a contract with everyone who quotes the number, so:

- Write the numerator, the denominator, the time grain, the time zone, and what is excluded:
  internal accounts, bots, refunds, test records.
- Changing a published definition is a breaking change. Version it, announce it, and give
  the old number a name rather than silently rewriting history.
- If two teams need different definitions, they need two names. Never one name and a
  footnote.

## Output

```markdown
## Model: <name>

- **Grain:** one row per <X>
- **Key:** <cols> — uniqueness test result quoted
- **Layer:** staging | intermediate | mart · depends on <models>
- **Metrics defined:** <name> = <numerator> / <denominator>, excluding <list>
- **History:** type 1 | type 2 on <cols>, valid-from/valid-to <cols>
- **Fan-out check:** <n> rows in, <n> rows out, expected <relationship>
- **Reconciled against:** <source> — <both totals>
- **Tests:** <list>, output quoted
```

## Verification

- The uniqueness test on the declared grain ran and passed; quote it.
- Row count and one summed measure reconcile with the source; both numbers quoted.
- Every join key has a referential integrity test.
- The whole project builds, not only the changed model.
- No metric defined here exists elsewhere under a different definition. Say where you looked.

## Red flags

| Thought | Reality |
|---------|---------|
| "The grain is obvious" | Then it costs one line to write, and it prevents the duplicate nobody catches. |
| "I will add my own version of the metric" | Two dashboards now disagree and both cite the warehouse. |
| "The join looked right in the preview" | Twenty rows preview fine and fan out at scale. Test the key. |
| "It matches roughly" | Roughly means it does not match. Find the difference first. |
| "I will just overwrite the dimension" | Every historical report that reads it by date has now changed. |
| "Logic in the dashboard ships faster" | And is invisible to everyone who queries the model instead. |
| "Tests slow the build" | Less than explaining a wrong number to whoever acted on it. |
