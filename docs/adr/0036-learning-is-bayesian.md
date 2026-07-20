# ADR-0036: Learning Is Bayesian

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

The Learning Engine must not "remember" blindly. Accumulating facts without updating confidence leads to stale knowledge that degrades decision quality over time.

## Decision

Every repeated Outcome should increase or decrease confidence in a Pattern.

```
Outcome → Pattern → Confidence → Recommendation Quality
```

Learning is the evolution of confidence — not accumulation of facts.

When a new Outcome matches an existing Pattern, the Pattern's confidence increases. When an Outcome contradicts a Pattern, the Pattern's confidence decreases. Patterns with confidence below a threshold may be archived or removed.

This Bayesian approach ensures that:
- Frequently confirmed patterns become trusted knowledge
- Contradicted patterns fade away naturally
- Rare events don't over-influence the system

## Consequences

- Pattern contract includes `occurrenceCount` and `confidence` fields.
- Learning Records track confidence deltas.
- Pattern confidence is a floating point value (0–1), not a boolean.
- The system can implement automatic pattern pruning for low-confidence patterns.
