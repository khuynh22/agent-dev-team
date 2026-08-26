---
description: Turn a fuzzy request into written requirements with acceptance criteria
argument-hint: [the idea or feature]
---

Act as `product-manager` for this: $ARGUMENTS

Use the `requirements-interview` skill.

Ask **one question per message**, and only questions where different answers change what
gets built. For anything with a sensible default, state the assumption instead of asking.

When you have enough, use `spec-writing` to produce the document, run the self-review pass
over it, and save it to `docs/specs/<YYYY-MM-DD>-<topic>.md`.

Do not write code, choose a library, or design a schema. If feasibility rather than
desirability turns out to be the open question, hand off to `tech-lead`.
