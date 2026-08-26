---
name: frontend-build
description: Implements user interface work state by state: empty, loading, error, partial, and degenerate content, with native elements, derived state, and keyboard support. Use when building or changing a component, page, form, or flow, or when a UI change needs to hold up outside the happy path.
license: MIT
metadata:
  phase: build
  owners: [frontend-engineer]
  version: "0.1.0"
---

# Frontend Build

The happy path is the smallest part of interface work. Everything expensive lives in the
other states, and the usual failure is discovering them after the component ships.

## Process

1. **Enumerate the states before writing anything.**

   | State | Ask |
   |-------|-----|
   | Empty | First-run and after-deletion are different. What does each teach? |
   | Loading | First load, refetch, and optimistic update look different |
   | Error | What failed, what can the user do, can they retry |
   | Partial | Some data arrived, some did not |
   | Success | The happy path |
   | Degenerate | Zero items, one item, a thousand; a 200-character name; a missing image |

   Each state gets an implementation and a test. A component with no empty state is not
   finished.

2. **Decide where state lives.** Server data belongs in a data-fetching layer with
   caching, not copied into local state. Derive whatever can be derived: two pieces of
   state that must agree will eventually disagree. URL state belongs in the URL, so a
   refresh and a shared link work.

3. **Use the native element.** `button`, `a`, `label`, `dialog`, `details`, `input`. Each
   custom replacement means you now own its keyboard interaction, focus behavior, and
   accessible name. See `references/accessibility-checklist.md`.

4. **Compose small components.** One responsibility each. A component that fetches,
   transforms, and renders is three things and none of them is testable alone.

5. **Build with `tdd-loop`.** Query by role and accessible name; if the accessible name is
   missing, the test just found a bug.

6. **Handle errors where the user can act.** A top-level boundary saying "something went
   wrong" is a last resort, not a strategy.

7. **Verify in a real browser** with `browser-verification`. A visual change asserted from
   source is unverified.

## Performance while building

- Give images explicit dimensions, a modern format, lazy loading below the fold, and a
  priority hint on the LCP element.
- Split JavaScript by route. Nothing large loads for a page that does not use it.
- Virtualize lists past a few hundred rows.
- Memoize where a profile shows re-renders, not on principle. Memoization has a cost and
  hides the real cause.
- Batch DOM reads, then writes, to avoid layout thrash.

Targets and diagnosis: `references/performance-checklist.md`.

## Forms

- A `label` for every control. Placeholder text is not a label.
- Validate on submit and on blur; not on every keystroke, which fights the user.
- Errors say what to do: "Enter a date in the past", not "Invalid input".
- Associate the error with its input, mark the input invalid, and move focus to the first
  error or to a summary that links to each one.
- Disable submit while in flight, and make the in-flight state visible.

## Verification

- Every enumerated state renders, including the degenerate content cases.
- Keyboard: tab to every control, operate it, and see focus at all times.
- Console clean, including warnings about keys and controlled inputs.
- Layout survives 320 pixels wide and 200% zoom.
- Tests query by role and accessible name.
- Full suite passes, quoted.

## Red flags

| Thought | Reality |
|---------|---------|
| "The happy path works" | It is the smallest part. Enumerate the rest. |
| "I'll add loading and empty states later" | They are states, not polish. They ship with the component. |
| "A div with onClick is simpler" | Simpler for you, broken for a keyboard user. |
| "I'll memoize everything to be safe" | Profile first. Blanket memoization costs and conceals. |
| "The test passes so the UI works" | Render it. Tests miss an element behind a modal or invisible focus. |
| "I'll copy the server value into local state" | Two sources of truth diverge. Derive it. |
| "It looks fine on my screen" | Check 320 pixels, 200% zoom, and long content. |
