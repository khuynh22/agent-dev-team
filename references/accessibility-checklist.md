# Accessibility Checklist (WCAG 2.1 AA)

Automated tools catch roughly a third of real issues. The keyboard and screen-reader
passes below catch most of the rest.

## Structure and semantics

- [ ] Native elements before ARIA. A `button` beats a `div` with a role and a key handler.
- [ ] One `h1` per page; heading levels descend without skipping.
- [ ] Landmarks present: `header`, `nav`, `main`, `footer`. One `main`.
- [ ] Lists marked up as lists; tables have `th` with `scope`, and a `caption` when the
      table needs one.
- [ ] The page has a `lang` attribute, and any passage in another language is marked.

## Names, roles, values

- [ ] Every interactive element has an accessible name that describes its action.
      "Read more" repeated eleven times is eleven identical names.
- [ ] Icon-only controls carry a name via `aria-label` or visually hidden text.
- [ ] Images have `alt`. Decorative images use `alt=""`, not a missing attribute.
- [ ] Form controls are associated with a `label`; placeholder text is not a label.
- [ ] Custom widgets implement the expected role, states, and keyboard interaction from
      the ARIA Authoring Practices, or they are rebuilt on native elements.

## Keyboard

- [ ] Every interactive element is reachable with `Tab` and operable with `Enter` or
      `Space`.
- [ ] Focus order follows visual order.
- [ ] Focus is always visible, and the indicator meets contrast against both the
      component and its background.
- [ ] No keyboard trap. A modal traps focus deliberately, restores it on close, and
      closes on `Escape`.
- [ ] A skip link reaches `main`.
- [ ] Custom scroll or drag interactions have a keyboard equivalent.

## Colour and contrast

- [ ] Body text at least 4.5:1; large text at least 3:1.
- [ ] Interactive borders, focus rings, and meaningful icons at least 3:1.
- [ ] Colour is never the only carrier of meaning. Pair it with text, shape, or a pattern.
- [ ] The design works in both light and dark, and in forced-colours mode.

## Motion, timing, and change

- [ ] `prefers-reduced-motion` respected for anything that moves more than a fade.
- [ ] Nothing flashes more than three times per second.
- [ ] Time limits are adjustable, extendable, or absent.
- [ ] Dynamic updates that matter are announced with a live region of the right
      politeness. Not everything deserves `assertive`.

## Forms and errors

- [ ] Errors identify the field and say how to fix it, in text.
- [ ] The error is associated with its input via `aria-describedby`, and the input is
      marked `aria-invalid`.
- [ ] Focus moves to the first error, or to a summary that links to each error.
- [ ] Required fields are marked in text as well as visually.

## Touch and pointer

- [ ] Targets at least 44 by 44 CSS pixels, or spaced to compensate.
- [ ] Hover-only affordances have a focus and touch equivalent.
- [ ] The layout survives 200% zoom and a 320 pixel viewport without horizontal scroll.

## Manual passes to actually run

1. **Keyboard only.** Unplug the mouse. Complete the primary task.
2. **Screen reader.** VoiceOver, NVDA, or Narrator through the same task. Listen for
   unnamed buttons and for state that is never announced.
3. **Zoom.** 200%, then a 320 pixel viewport.
4. **Reduced motion and forced colours.** Toggle both at the OS level.

Report findings as: the element, the WCAG criterion, what a user experiences, and the fix.
