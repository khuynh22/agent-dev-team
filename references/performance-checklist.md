# Performance Checklist

## The rule

Measure, change one thing, measure again, keep the number. An optimization without a
before-and-after is a guess with extra steps.

State the budget before optimizing: which metric, at which percentile, under what load.
"Faster" is not a target. "p95 search latency under 200 ms at 50 requests per second" is.

## Order of investigation

1. **Is it doing work it does not need to do?** Redundant calls, work inside a loop that
   belongs outside it, recomputation of a stable value, over-fetching.
2. **Is it doing that work N times?** N+1 queries and N+1 requests dominate real
   regressions.
3. **Is it waiting?** Serial I/O that could be concurrent; a lock held across I/O.
4. **Is the algorithm wrong?** A quadratic scan over a collection that grows.
5. **Only then, constant factors.** Allocation, copying, serialization.

Stopping at step 5 first is the most common way to spend a week and gain nothing.

## Backend

- [ ] Every query in a hot path has an index that it actually uses. Read the plan; do not
      assume.
- [ ] No N+1: batch, join, or preload. Confirm by counting queries in a test.
- [ ] Pagination on anything unbounded, including internal endpoints.
- [ ] Responses return the fields used, not the whole row.
- [ ] Independent outbound calls run concurrently.
- [ ] Every cache has a stated invalidation rule. A cache without one is a bug that has
      not fired yet.
- [ ] Connection pools sized deliberately; no per-request connection.
- [ ] Timeouts on every outbound call. A missing timeout is an outage waiting for a slow
      dependency.

## Frontend: Core Web Vitals

Targets at the 75th percentile on real devices:

| Metric | Good | Common cause when bad |
|--------|------|----------------------|
| LCP | under 2.5 s | Unoptimized hero image, render-blocking CSS or JS, slow server response |
| INP | under 200 ms | Long tasks, heavy event handlers, large re-render trees |
| CLS | under 0.1 | Images without dimensions, injected banners, late-loading fonts |

- [ ] Images sized, in a modern format, lazy below the fold, with a priority hint on the
      LCP element.
- [ ] Fonts preloaded with a metric-compatible fallback, and `font-display` set.
- [ ] JavaScript split by route. Nothing large loads for a page that does not use it.
- [ ] No layout thrash: batch reads, then writes.
- [ ] Lists virtualized past a few hundred rows.
- [ ] Memoization applied where a profile shows re-renders, not everywhere on principle.

## Measurement hygiene

- Warm up before timing, and discard the first runs.
- Report a distribution, not one number. p50 and p95 at minimum.
- Change one variable per measurement.
- Measure on hardware and data that resemble production. A twelve-row fixture proves
  nothing about a twelve-million-row table.
- Keep the benchmark in the repo so the next person can reproduce the claim.

## Firmware and embedded

- [ ] Interrupt latency and worst-case interrupt duration measured, not estimated.
- [ ] Stack high-water mark checked per task, with margin.
- [ ] No dynamic allocation in a hot path or an interrupt path.
- [ ] Duty cycle and sleep residency measured for battery-powered targets.
- [ ] Flash and RAM usage tracked per build. A regression fails the build.

## Reporting a result

Give the metric, the before, the after, the conditions, and the command that reproduces
it. A percentage without an absolute number hides whether the work mattered: "40% faster"
means little when the baseline was 3 ms.
