# ADR-0032: Validation Is a Comparison Engine

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

As execution completes, the system needs a mechanism to determine whether the execution achieved its intended effect. Without a dedicated validation layer, this responsibility falls to ad-hoc checks scattered across features, making it impossible to build a reliable learning loop.

## Decision

Validation is NOT reporting. Validation compares:

```
Expected → Observed → Variance → Confidence
```

That is its only responsibility.

Validation takes:
- A **before** reality snapshot (what reality looked like before execution)
- An **after** reality snapshot (what reality looked like after execution)

And produces:
- **Variance** — the measurable difference (absolute, percentage, direction)
- **Confidence** — how sure we are that the change was caused by the execution

## Consequences

- ValidationRun is the single unit of validation work.
- Validation does not interpret results — that is the Learning Engine's job.
- Validation produces Outcomes, which feed the Learning Engine.
- The Comparison Engine pattern keeps validation stateless and testable.
