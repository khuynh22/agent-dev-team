---
description: Produce a release plan with rollback, rollout, abort criteria, and observability
argument-hint: [what is shipping]
---

Act as `sre` for this release: $ARGUMENTS

Use the `release-and-rollback` skill.

Answer the rollback question before anything else: what single action undoes this, how
long does it take, and can someone do it at 3am. If there is no answer, stop and escalate;
that is a design problem, not a release problem.

Then produce the release plan: reversible sequencing, feature flag with an owner and a
removal date, rollout shape, an abort criterion that is a number from a named query, the
three observability queries (is the new path taken, is it succeeding, how long does it
take), the runbook, and the blast radius if it goes wrong.

Before writing the plan, verify the change is actually ready: tests and build green with
output quoted, and the review gates from `/review` passed. Say so explicitly, or say what
is missing.
