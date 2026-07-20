# SPYRAL OS — Engineering Principles

## 1. Conversations, Not Forms
Navigation is a dialogue. Every interaction should feel like a conversation with a capable strategist, not filling out a form.

## 2. Questions, Not Instructions
The system asks clarifying questions before making assumptions. A single prompt rarely contains enough context for a good decision.

## 3. Always Have an Answer
If the system cannot produce a confident recommendation, it should explain *why* and offer alternatives — never leave the user without a path forward.

## 4. Progressive Disclosure
Reveal complexity gradually. Start with simple questions, then dive deeper based on user answers.

## 5. State Is Immutable History
Every session transition is written immutably to history. The past cannot be rewritten, only analysed.

## 6. Decisions Are Explainable
Every recommendation must be traceable to the user's stated intent, constraints, and selected criteria.

## 7. Tests Are Contracts
Automated tests are not a luxury — they are the executable specification of the system's behaviour. A change that breaks a test is a contradiction in terms.

## 8. Fail Fast, Fail Visibly
Errors should be caught at the nearest boundary and displayed with clear recovery options. Silent failures erode trust.

## 9. Every Significant Bug Becomes a Permanent Test
When a bug is discovered and fixed, a test must be added that reproduces the bug. This test becomes a permanent part of the suite, ensuring the bug never resurfaces.

## 10. Measure What Matters
If it affects the user experience, it must be measured. Bundle size, render time, navigation latency, and error rates are first-class metrics.

## 11. Trust Is Earned Incrementally
The system must prove its reliability through consistent behaviour, transparent reasoning, and graceful error recovery — every single session.
