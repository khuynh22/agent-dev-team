# Observability Checklist

The test: someone who did not write this code should be able to tell, from the outside,
whether it is healthy and where it is failing. If the answer requires reading source or
attaching a debugger to production, the change is not observable.

## Logs

- [ ] Structured, one event per line, machine-parseable. Not a sentence with values
      interpolated into it.
- [ ] Every log carries correlation: request id, trace id, or job id, propagated across
      service boundaries.
- [ ] Levels used deliberately: `error` means someone should look, `warn` means it
      degraded but recovered, `info` marks a state change, `debug` is off in production.
- [ ] Log at the boundary of a unit of work, not inside every function.
- [ ] Errors log the cause chain, not only the top message.
- [ ] No secrets, tokens, full payment data, or unnecessary personal data.
- [ ] Volume is bounded. A log line inside a per-item loop becomes an outage during a
      bulk job.

## Metrics

Instrument the RED trio for every service surface, and USE for every resource:

- **Rate** — requests per second, by endpoint and status class.
- **Errors** — failures per second, separated from rejections a client caused.
- **Duration** — a histogram, so percentiles are real rather than an average of averages.
- **Utilisation, Saturation, Errors** — for CPU, memory, connection pools, queues, disks.

- [ ] Queue depth and consumer lag exposed for anything asynchronous.
- [ ] Business-level counters exist for the things that matter: orders placed, messages
      delivered, jobs completed.
- [ ] Cardinality is bounded. A user id as a metric label will take down the metrics
      backend before it helps.

## Traces

- [ ] Spans wrap outbound calls, database queries, and queue operations.
- [ ] Context propagates across service and queue boundaries, including retries.
- [ ] Span attributes record the identifiers needed to find the record later.
- [ ] Sampling keeps all errors and slow requests, and samples the rest.

## Alerts

- [ ] Alerts fire on user-visible symptoms, not on causes. High CPU is not an alert;
      a rising error rate is.
- [ ] Every alert links to a runbook that says what to check and what to do.
- [ ] Every alert has an owner and a stated urgency. If nobody would wake up for it, it
      is a dashboard, not an alert.
- [ ] Thresholds come from measured baselines, not from round numbers.
- [ ] An alert that has fired three times without action is deleted or fixed.

## Health and readiness

- [ ] Liveness answers "should this process be restarted", and nothing else.
- [ ] Readiness answers "can this instance serve traffic", including dependency checks.
- [ ] Version, build, and commit are exposed so you can tell what is running.

## Before shipping

- [ ] You can answer, from telemetry alone: is the new code path being taken, is it
      succeeding, and how long does it take?
- [ ] The dashboard panel or query that answers those three questions is written down in
      the change description.
