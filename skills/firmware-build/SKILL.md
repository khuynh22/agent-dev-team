---
name: firmware-build
description: Implements microcontroller firmware within hard limits: static memory, bounded interrupt handlers, a testable HAL boundary, measured stack and flash budgets, and on-target verification. Use for embedded work on an MCU, driver or RTOS task code, or a change that must be proven on hardware rather than in a test runner.
license: MIT
metadata:
  phase: build
  owners: [firmware-engineer]
  version: "0.1.0"
---

# Firmware Build

Server habits break devices. No heap, bounded interrupt handlers, every wait has a
timeout, and nothing is verified without a number.

Standing reference: `references/firmware-constraints.md`.

## Before writing code

1. **Read the datasheet section and the errata.** Cite the section in a comment where the
   required register order is not obvious. An erratum found after two days of debugging is
   two days lost.
2. **Write the memory budget.** RAM, stack per task, flash, and which section each large
   object lands in. Check the map file rather than assuming; a `const` table that lands in
   RAM instead of flash is a common and expensive surprise.
3. **Draw the HAL boundary.** Everything above it is host-testable logic. Everything below
   it touches registers. Logic that reads a register directly cannot be tested off-target,
   and off-target tests are orders of magnitude faster.

## While writing

- **No dynamic allocation after initialisation.** Static pools and fixed-size buffers.
  Fragmentation is unrecoverable on a device that runs for months.
- **Interrupt handlers do four things:** acknowledge the source, move data, signal, return.
  No blocking, no allocation, no logging, no long loop, no floating point unless the
  platform saves the FPU context.
- **Guard shared state properly.** `volatile` stops the compiler caching a value. It is not
  atomicity and not a memory barrier. Multi-byte state shared with an interrupt needs a
  critical section, kept as short as possible.
- **Bound every wait.** Every peripheral operation gets a timeout and a defined failure
  behavior. A bus that never asserts ready must not hang the device.
- **Prefer a state machine over a task per feature.** Fewer stacks, fewer races.
- **Handle rollover.** Tick arithmetic uses unsigned subtraction so a counter wrap behaves
  correctly.
- **Feed the watchdog from progress,** not from a timer interrupt. A watchdog fed by a
  timer keeps a wedged application alive, which defeats the purpose.

## Testing

- Host-test all logic through the HAL seam with a fake peripheral layer, using `tdd-loop`.
- On-target tests cover timing, interrupt behavior, and peripheral quirks only.
- Assert stack high-water mark and heap usage in the suite, not by eye.
- Build and test at the shipping optimisation level. A bug that disappears at `-O0` is a
  timing or `volatile` bug, and its disappearance is the diagnosis.

## On-target verification

Run before claiming the change works:

```markdown
- **Build:** <toolchain, version, optimisation level>
- **Flash:** <used> / <total>   (delta <n>)
- **RAM:** <used> / <total>     (delta <n>)
- **Stack high-water:** <per task, with margin>
- **Worst-case ISR duration:** <measured with a pin toggle or cycle counter>
- **Host tests:** <quoted summary>
- **On-target tests:** <what ran on hardware, quoted>
- **Power:** <current per state, if battery powered>
- **Soak:** <duration, result>
```

A change that reports no numbers has not been verified. Prefer a pin toggle and a logic
analyser over print statements: printing changes timing and hides the bug you are chasing.

If the device does not boot, the peripheral never responds, or the fault is below the
register level, that is `board-bringup-engineer`, not more application debugging.

## Update path

- Firmware update is atomic with a rollback slot. An update that can brick the device on
  power loss is not shippable.
- The build embeds a version and a commit readable from the device.
- Images are signed if the device is reachable by anyone but you.
- Brownout behavior is defined for anything that writes to non-volatile storage. A
  half-written record is a corrupted device.

## Red flags

| Thought | Reality |
|---------|---------|
| "One malloc at startup, so a bit more is fine" | Fragmentation is unrecoverable over months. Static pools. |
| "I'll print from the ISR to debug" | Printing changes timing and hides the bug. Toggle a pin. |
| "volatile makes it safe" | It prevents caching. Not atomicity, not ordering. |
| "The stack is probably fine" | Measure the high-water mark. Probably is how devices fault in the field. |
| "It works at -O0" | That is the diagnosis, not a workaround. |
| "I'll retry until it responds" | Bounded, with a timeout and a defined failure. Unbounded retries hang the device. |
| "It ran for ten minutes on the bench" | Soak it. These bugs appear over hours. |
