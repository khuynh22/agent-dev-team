---
name: incident-response
description: Runs a live production failure: set severity, check what changed, mitigate before diagnosing, communicate on a clock, then write a blameless postmortem. Use when production is broken right now, when an outage or degradation needs coordinating, or when writing the postmortem afterwards.
license: MIT
metadata:
  phase: ship
  owners: [incident-commander, sre]
  version: "0.1.0"
---

# Incident Response

Your objective is a shorter outage, not a correct theory. Mitigation comes before
diagnosis, every time.

## 1. Declare and set severity

Say it out loud so everyone shares one picture.

| Sev | Meaning |
|-----|---------|
| 1 | Total outage, data loss, or a security breach. All hands. |
| 2 | Major function broken for many users, no workaround. |
| 3 | Degraded, or broken for a subset; a workaround exists. |
| 4 | Minor, cosmetic, or internal only. |

Unsure between two levels? Take the higher one. Downgrading is cheap; upgrading late is
not.

Escalate to a human immediately for suspected data loss, a suspected security breach,
customer data exposure, legal or regulatory exposure, or a decision to accept prolonged
downtime. Those are not technical calls.

## 2. What changed

Before theorising, check the ten minutes before the first alert: a deploy, a feature flag,
a config push, a certificate, a dependency, a traffic shift, a scheduled job. This explains
most incidents and takes two minutes to check.

## 3. Mitigate

Roll back, flip the flag, shed load, fail over, or degrade the feature. You do not need to
know why in order to stop the bleeding.

Announce every action before taking it: what you are doing, what it should do, and the
signal that will confirm it. An untracked change during an incident creates a second
incident inside the first.

Then verify with telemetry, quoting the metric before and after. Not with hope.

## 4. Communicate on a clock

Every 30 minutes for Sev 1 and 2, even with no news. "Still investigating, next update at
14:30" is a valid update and prevents six people from interrupting the responders.

```
[SEV<n>] <one-line impact: who cannot do what>
Started: <time> · Status: investigating | mitigating | monitoring | resolved
Impact: <scope, number of users if known>
Current action: <what is happening right now>
Next update: <time>
```

## 5. Preserve evidence, then diagnose

Only after impact has stopped. Before anything is cleaned up or restarted, capture: logs
for the window, a metrics snapshot, the exact deployed version, and a copy of any bad
state. Then use `systematic-debugging`.

## 6. Postmortem, within 48 hours

```markdown
# Postmortem: <title>
- **Impact:** <who, what they could not do, how long, how many>
- **Severity:** <n>
- **Detected by:** <alert / customer / engineer> — <how long after onset>

## Timeline
<UTC: change, onset, detection, mitigation, resolution>

## What happened
<the mechanism, in plain language>

## Why it was not caught
<the gap in tests, review, staging, or alerting>

## Why detection took <n> minutes
<a separate question from the cause, and usually the higher-leverage one>

## Action items
| Action | Owner | Due | Prevents recurrence / reduces detection time |
```

Rules:

- **No names as causes.** "Someone made a mistake" is never a root cause; the system that
  let the mistake reach production is.
- **Detection time gets its own section.** Reducing it usually pays more than preventing
  one specific cause, and it is almost always skipped.
- **Every action item has an owner and a date**, or it is not an action item.

## Verification

- Impact stopped before diagnosis started, or you state why mitigation was impossible.
- Every mitigation has a quoted before-and-after metric.
- Updates went out on the clock.
- Evidence was preserved before cleanup.
- The postmortem separates cause from detection and names no person as a cause.

## Red flags

| Thought | Reality |
|---------|---------|
| "Let me find the root cause first" | Users are down. Mitigate. |
| "I'll try this and see if it helps" | State the expected effect and the confirming signal first. |
| "No news, so no update" | "No news, next update at 14:30" is the update. |
| "It resolved itself" | Then you do not know it will not return. Find what changed. |
| "Restart it and move on" | You just destroyed the evidence. Capture first. |
| "It is probably a Sev 3" | Unsure between two? Take the higher. |
| "The person who deployed caused this" | The system that let an untested change reach production caused it. |
