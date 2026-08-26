# Firmware and Embedded Constraints

The rules that hold on a microcontroller and do not hold on a server. Violating one of
these usually produces a fault that reproduces once a week in the field and never on a
desk.

## Memory

- No dynamic allocation after initialization. If the platform allows `malloc` at all,
  confine it to startup, and never call it from an interrupt or a hot path.
- Fragmentation is unrecoverable on a device that runs for months. Static pools and
  fixed-size buffers instead.
- Every task's stack is sized from a measured high-water mark plus margin, never from a
  guess. Instrument it and assert on it.
- Flash and RAM usage are tracked per build. A size regression fails the build the same
  way a test failure does.
- Know which section every large object lands in. A `const` table that quietly lands in
  RAM instead of flash is a common and expensive surprise.

## Interrupts

- An interrupt handler does the minimum: acknowledge the source, move data, set a flag or
  post to a queue, return.
- No blocking, no logging, no allocation, no floating point unless the platform saves the
  FPU context, and no long loops in an interrupt.
- Data shared between an interrupt and the main context is `volatile` and accessed
  atomically, or guarded by disabling the interrupt for the shortest possible window.
- `volatile` prevents the compiler from caching a value. It does not create atomicity and
  it is not a memory barrier. Multi-byte shared state needs a critical section.
- Worst-case interrupt duration and latency are measured with a pin toggle and a scope or
  a cycle counter, not estimated.

## Concurrency and timing

- Prefer a state machine over a task per feature. Fewer stacks, fewer races.
- Priority inversion is real: use a mutex with priority inheritance, or avoid sharing.
- Never busy-wait with an unbounded loop. Every wait has a timeout and a defined failure
  behavior.
- Time arithmetic uses unsigned subtraction so a tick counter rollover behaves correctly.
- A watchdog exists, is fed from a place that proves the system is making progress, and
  is not fed from a timer interrupt that keeps running while the application is wedged.

## Hardware boundary

- Peripheral access sits behind a HAL interface so the logic above it is host-testable.
  Logic that reads a register directly cannot be tested off-target.
- Register writes follow the datasheet's required order, and the code cites the datasheet
  section when the order is not obvious.
- Every peripheral operation has a timeout. A bus that never asserts ready must not hang
  the system forever.
- Errata are checked before debugging. A silicon erratum found after two days of
  debugging is two days lost.

## Power

- Measure current in each state rather than reasoning about it. Sleep residency and the
  wake-up rate determine battery life more than any single optimisation.
- Peripherals and clocks are disabled when idle, and pin states are defined in sleep so a
  floating input does not draw current.
- Brownout and power-loss behavior is defined for anything that writes to non-volatile
  storage. A half-written record is a corrupted device.

## Build, flash, and update

- The toolchain and its version are pinned. Reproducible builds matter more here than
  almost anywhere, because a field failure must be traceable to an exact binary.
- The build embeds a version and a commit that can be read back from the device.
- Firmware update is atomic with a rollback slot. An update that can brick the device on
  power loss is not shippable.
- Images are signed if the device is reachable by anyone but you.

## Debugging discipline

- Reproduce on hardware, with the same clock configuration and optimisation level as the
  shipping build. A bug that disappears at `-O0` is a timing or a `volatile` bug, and
  that disappearance is the diagnosis, not a workaround.
- Prefer a pin toggle and a logic analyser over print statements. Printing changes timing
  and hides the bug you are chasing.
- Capture the fault registers on a hard fault and decode them. A hard fault handler that
  spins in an infinite loop discards the only evidence you had.

## Testing

- Host-test all logic through the HAL seam with a fake peripheral layer.
- On-target tests cover timing, interrupt behavior, and peripheral quirks only.
- Assert stack and heap usage in the test suite.
- Soak-test before shipping. Bugs on this list show up over hours, not seconds.
