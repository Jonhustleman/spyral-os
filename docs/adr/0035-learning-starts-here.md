# ADR-0035: Learning Starts Here

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

Validation and Learning were at risk of being conflated. Without a clear boundary, validation might attempt to learn and learning might attempt to validate, creating a tangled dependency that violates Rule #010 (No engine may directly modify another engine's state).

## Decision

Validation does not learn. Validation produces Outcomes. Learning consumes Outcomes.

The explicit dependency chain:

```
Validation
   ↓
Outcome
   ↓
Learning
```

- **Validation** compares expected vs observed and produces an Outcome.
- **Outcome** is a first-class entity that accumulates over time.
- **Learning** consumes multiple Outcomes to identify patterns, generalize, and improve.

This keeps responsibilities clean. Validation is a pure comparison engine. Learning is a pattern recognition engine. They communicate through Outcomes.

## Consequences

- The Outcome contract is the boundary between Validation and Learning.
- Multiple validation runs can produce multiple outcomes for the same decision.
- Learning Engine depends on the Outcome contract, not on ValidationRun directly.
- This boundary enables independent testing and evolution of both engines.
