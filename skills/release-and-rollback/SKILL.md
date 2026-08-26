---
name: release-and-rollback
description: Plans a deployment so every step is independently reversible and the result is observable: rollback first, then sequencing, feature flags, canary or percentage rollout, abort criteria, and alerting. Use before shipping to production, when a release involves a migration or a flag, or when a change has no rollback path yet.
license: MIT
metadata:
  phase: ship
  owners: [sre]
  version: "0.1.0"
---

# Release and Rollback

Plan the rollback before the rollout. A change that cannot be undone or observed is not
ready, whatever its tests say.

## Process

1. **Answer the rollback question first.** What single action undoes this, how long does it
   take, and can someone do it at 3am from a phone? If there is no answer, stop here and
   escalate; that is a design problem, not a release problem.

2. **Sequence so each step is independently reversible.** The safe shape for a data change
   is four deploys, not one:

   1. Schema change that is backward compatible (add, do not rename or drop).
   2. Code that writes both shapes and reads the old one.
   3. Code that reads the new shape.
   4. Removal of the old shape, after usage is measured at zero.

   Four reversible deploys beat one irreversible one every time.

3. **Choose the rollout shape and the abort criterion together.** Canary, percentage,
   ring, or flag. The abort criterion is a number measured from a named query, decided
   before the rollout starts. Deciding it in the moment, while looking at a graph you want
   to look good, does not work.

4. **Make it observable before it ships.** You must be able to answer from telemetry alone:
   is the new path being taken, is it succeeding, how long does it take. Write the three
   queries down. See `references/observability-checklist.md`.

5. **Feature flags with a lifecycle.** A flag has an owner, a default, a removal date, and
   someone who can flip it without a deploy. A flag with no removal plan becomes permanent
   configuration and doubles the state space forever.

6. **Write the runbook for the alert, not for the service.** The reader is woken up and has
   five minutes.

7. **Check the pipeline.** Reproducible build, pinned toolchain, no secret in scope for
   untrusted pull-request code, and a green run you can point at.

## Release plan

```markdown
## Release: <change>
- **Rollback:** <single action> — takes <duration> — executed in staging: yes/no
- **Steps:** <ordered, each independently reversible>
- **Flag:** <name, default, who can flip it, removal date>
- **Rollout:** <canary %, soak duration, then next stage>
- **Abort if:** <metric crosses <threshold>, from query `<q>`>
- **Observability:** <the three queries: taken / succeeding / duration>
- **Runbook:** <path>
- **Blast radius if wrong:** <who, how many, for how long>
```

## Runbook

```markdown
# Alert: <name>
**Means:** <the user-visible symptom>
**Check first:** <one dashboard or query>
**Common causes:** <ranked, each with its distinguishing signal>
**Mitigation:** <the action that stops the bleeding, before diagnosis>
**Escalate to:** <who, and when>
```

## Migrations

- Run it forward against a copy of realistic production data, not a fixture.
- Execute the rollback at least once, somewhere real. An untested rollback is a plan, not
  a capability.
- Long-running migrations run in batches with progress and a resume point.
- Check locking on large tables. "It only adds a column" is true right up until it takes a
  lock and the site stops.

## Verification

- Rollback is a single documented action with a known duration, executed at least once.
- The abort criterion is a number from a named query.
- The three observability questions have concrete queries written down.
- Every alert added has a runbook and an owner.
- Every flag has a removal date.

## Red flags

| Thought | Reality |
|---------|---------|
| "We can roll forward if it breaks" | Roll-forward under pressure turns a small outage into a long one. |
| "The migration is safe, it only adds a column" | With a default, on a large table, with a lock. Check. |
| "We will watch it after deploy" | Watch what? Name the query before you ship. |
| "It passed CI so it is ready" | CI proves the code. It says nothing about rollback or observability. |
| "Alert on CPU" | Alert on the symptom a user feels. CPU is a dashboard. |
| "We will remove the flag later" | Give it a date now, or it is permanent. |
| "Rollback should work" | Should is not evidence. Run it. |
