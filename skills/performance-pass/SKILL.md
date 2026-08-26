---
name: performance-pass
description: Fixes measured slowness by setting a budget, profiling to find where time actually goes, changing one thing, and measuring again. Use for a latency regression, an N+1 query, memory growth, a slow build or test suite, or a Core Web Vitals miss. Refuses to optimize anything without a baseline number.
license: MIT
metadata:
  phase: review
  owners: [performance-engineer]
  version: "0.1.0"
---

# Performance Pass

Measure, change one thing, measure again, keep the number. Without a baseline you are
guessing, and guessing usually makes the code worse and the program no faster.

Standing reference: `references/performance-checklist.md`.

## Process

1. **State the budget.** Which metric, at which percentile, under what load. "p95 search
   latency under 200 ms at 50 requests per second." Without a target there is no way to
   know when to stop, and optimisation has no natural end.

2. **Measure the baseline.** Warm up, discard the first runs, report p50 and p95. Save the
   command; it goes in the report and in the repository.

3. **Find where time actually goes.** A profile, a query log, a trace, a counter. Not
   intuition. The bottleneck is almost never where it feels like it is, which is why this
   step exists.

4. **Work the order.** Most real wins are in the first two:

   1. Work it does not need to do at all: redundant calls, work inside a loop that belongs
      outside it, recomputation of a stable value, over-fetching.
   2. Work done N times: N+1 queries and N+1 requests dominate real regressions. Count the
      queries in a test to prove it.
   3. Waiting: serial I/O that could be concurrent, a lock held across I/O, a missing
      timeout.
   4. The algorithm: a quadratic scan over a growing collection.
   5. Constant factors: allocation, copying, serialization.

5. **Change one thing. Measure again.** Two changes at once and you have learned nothing
   about either.

6. **Name what you traded.** Faster usually costs memory, complexity, or freshness. A cache
   without a stated invalidation rule is a bug that has not fired yet.

7. **Commit the benchmark** so the claim is reproducible and the regression is caught
   rather than rediscovered.

## Frontend specifics

Targets at the 75th percentile on real devices: LCP under 2.5 s, INP under 200 ms, CLS
under 0.1. Measure on a throttled connection and a mid-tier device profile, not on your
machine.

The usual causes: an unoptimized hero image or render-blocking resources for LCP; long
tasks and heavy handlers for INP; images without dimensions and late-loading fonts for CLS.

## Output

```markdown
## Performance: <target>
- **Budget:** <metric, percentile, load>
- **Baseline:** p50 <n> / p95 <n> — command: `<cmd>`
- **Profile said:** <quoted, the top cost>
- **Change:** <one sentence>
- **After:** p50 <n> / p95 <n> — same command, same data
- **Traded away:** <memory, complexity, staleness>
- **Benchmark committed at:** <path>
```

## Verification

- Before and after come from the same command, on the same data, on the same hardware.
- Numbers are absolute and include a percentile. A percentage alone hides that the
  baseline was 3 ms.
- The full test suite still passes. A faster wrong answer is not a win.
- The benchmark is in the repository.

## Red flags

| Thought | Reality |
|---------|---------|
| "This loop is obviously the problem" | Profile it. It usually is not. |
| "It feels faster" | Feels is not a percentile. |
| "I made five improvements" | You now know the effect of none of them. |
| "3x faster on my fixture" | A twelve-row fixture proves nothing about a twelve-million-row table. |
| "Caching fixed it" | What invalidates it? |
| "The average improved" | Averages hide the tail, and the tail is the user complaining. |
| "I'll optimize this while I'm in here" | Without a budget and a baseline, that is churn. |
