---
name: requirements-interview
description: Extracts what someone actually needs by asking one question at a time, separating the problem from the solution they proposed. Use when a request is vague, when you are about to guess at intent, when scope keeps shifting, or when nobody has said what done means. Ends with written requirements and acceptance criteria.
license: MIT
metadata:
  phase: define
  owners: [product-manager]
  version: "0.1.0"
---

# Requirements Interview

People describe solutions, not problems. "Add an export button" is a solution; the problem
is that someone rebuilds a report by hand every Monday. Interview until you have the
problem, because the problem often has a better solution than the one proposed.

## Rules of the interview

1. **One question per message.** A list of five questions gets one answer, usually to the
   easiest one.
2. **Only ask questions where different answers change what gets built.** Everything else
   gets a stated default. "I'll assume X unless you say otherwise" moves faster than a
   question and captures the same information.
3. **Prefer a choice over an open question.** "A or B, and here is the trade-off" is
   easier to answer than "what do you want?" and produces a decision instead of a
   paragraph.
4. **Play back what you heard** before moving on. Misunderstandings are cheap now.
5. **Stop when the next answer would not change the build.** Over-interviewing is its own
   failure; you are spending someone's attention.

## The questions that pay

Roughly in order. Skip any whose answer is already clear.

- **Problem:** What happens today without this? Walk me through the last time it hurt.
- **Who:** Who has this problem, and how many of them are there?
- **Frequency and cost:** How often, and what does each occurrence cost in time, money, or
  trust?
- **Current workaround:** What do they do instead now? A workaround tells you the real
  requirement better than any wish list.
- **Success:** How will you know this worked? What number moves, in which direction?
- **Boundaries:** What is explicitly not part of this?
- **Constraints:** What cannot change? Existing data, an external contract, a compliance
  rule, a deadline.
- **Failure:** What happens when it does not work? Who notices, and what should they see?
- **Scale:** How much data, how many users, how fast, on what devices?

## Detecting a solution masquerading as a requirement

When the request names a mechanism (a button, a table, a queue, a specific library), ask
what it would let the person do, and why they cannot do that now. Two rounds of this
usually surfaces the actual problem. Then check whether the proposed mechanism is still
the best answer; often it is not.

## Handling "everything is important"

Force a trade: "If you could only have one of these next week, which one?" Ranking is
information the person has and will not volunteer.

## Output

```markdown
# <Feature>

## Problem
<the situation today, concretely, with the cost>

## Users and context

## Requirements
### Must
### Should
### Later

## Non-goals
<the adjacent things explicitly out, and why>

## Acceptance criteria
- Given <state>, when <action>, then <observable result>

## Assumptions
<defaults you took instead of asking; each is a place to be corrected>

## Open questions
| Question | Who answers | Blocking? |

## Success measure
<the number, and its direction>
```

## Verification

- Every requirement is observable from outside the system.
- Every acceptance criterion could be turned into a test by someone who has not read the
  code.
- Non-goals are non-empty. An empty non-goals section means scope was never bounded.
- Assumptions are listed, so silence is not mistaken for agreement.
- No requirement names a library, a table, or an endpoint.

## Red flags

| Thought | Reality |
|---------|---------|
| "I understand enough to start" | Then write the acceptance criteria. If you cannot, you do not. |
| "I'll ask all my questions at once" | You will get one answer. One question per message. |
| "They said they want X, so the requirement is X" | X is a solution. Find the problem underneath it. |
| "Everything is a must" | Then nothing is ranked, and the team will build the easy half. |
| "I'll leave scope open for flexibility" | Open scope is an unbounded estimate, not flexibility. |
| "It is obvious what done means" | Write it down anyway. Obvious requirements produce the most rework. |
