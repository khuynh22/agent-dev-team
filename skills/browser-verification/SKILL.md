---
name: browser-verification
description: Confirms a user-interface change actually works by loading it in a real browser and checking rendering, interaction, keyboard access, console output, network calls, and responsive behavior. Use after any visual or interactive change, when a test passes but the page might not, or before claiming a UI change is done.
license: MIT
metadata:
  phase: verify
  owners: [frontend-engineer, ux-reviewer]
  version: "0.1.0"
---

# Browser Verification

A passing test says the test passes. It does not say the element is visible, that focus is
where the user can see it, or that the console is full of errors. Load the page.

## Sequence

1. **Load it.** Note anything that appears wrong before you touch anything.

2. **Console.** Read every error and warning, including the ones that were already there.
   A pre-existing error is still your finding; report it even if it is not yours to fix.

3. **Network.** Check for a failed request, a duplicated request, a request that fires on
   every keystroke, and a payload much larger than the page uses.

4. **Interact.** Walk the actual path a user walks. Click the primary action. Submit the
   form with valid input, then with invalid input, then with nothing.

5. **Keyboard only.** Stop using the mouse. Tab through every control. Confirm:
   - every interactive element is reachable,
   - focus is visible at every step,
   - focus order follows visual order,
   - a modal traps focus, closes on `Escape`, and returns focus where it came from.

6. **States.** Force each one and look at it: empty, loading, error, partial, long content.
   Throttle the network to see loading; block the request to see the error. A state you
   never rendered is a state you have not verified.

7. **Responsive.** 320 pixels wide, then 200% zoom. Nothing may scroll horizontally, and
   nothing may be clipped or overlap.

8. **Theme.** Light and dark, if the product has both.

## Evidence

Report what you observed, not what you expect:

```markdown
## Browser verification: <page or component>
- **Loaded:** <url> — <viewport>
- **Console:** clean | <the errors, quoted>
- **Network:** <failed, duplicated, or oversized requests; or "clean">
- **Interaction:** <path walked, result>
- **Keyboard:** <reachable / focus visible / trap behavior>
- **States checked:** empty | loading | error | partial | long-content
- **Responsive:** 320px <result> · 200% zoom <result>
- **Findings:** <each with what a user experiences>
```

"It renders" is not evidence. Say what you did and what happened.

## When something looks wrong

Do not immediately edit. Check in this order, because the first two are free:

1. Is it a stale build or a cached asset? Hard reload.
2. Is the console already telling you? Read the error before reading the code.
3. Is the element present but hidden, or absent? Inspect it. Those are different bugs.
4. Is the data wrong, or is the rendering wrong? Check the network response.

Then, if the cause is still unknown, use `systematic-debugging`.

## Red flags

| Thought | Reality |
|---------|---------|
| "The test passes, so the page works" | Tests do not catch invisible focus, a console full of errors, or an element behind a modal. |
| "I'll check the console if something looks broken" | Read it every time. It usually reports the bug before you see it. |
| "That console error was already there" | Report it. Pre-existing is not the same as acceptable. |
| "It looks fine on my screen" | 320 pixels, 200% zoom, long content. |
| "Keyboard access is a separate task" | It is one minute of tabbing, and it finds real bugs. |
| "I could not reproduce the loading state" | Throttle the network. Every state is forceable. |
