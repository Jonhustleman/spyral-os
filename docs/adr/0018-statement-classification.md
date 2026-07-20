# ADR-0018: Statement Classification

**Status:** Accepted  
**Date:** 2026-07-19  
**Author:** Chief Architect (ChatGPT)  
**Type:** Contract  

## Context

Rule #008 mandated that all statements in the kernel be classified as Fact, Assumption, Inference, or Recommendation. This classification has been implicit in contracts like `RealityMetric`. We now promote it to a first-class, shared type.

## Decision

Create a standalone `StatementType` enum in the kernel contracts layer.

```typescript
export enum StatementType {
  FACT = "fact",
  ASSUMPTION = "assumption",
  INFERENCE = "inference",
  RECOMMENDATION = "recommendation",
}
```

Every metric, note, observation, and report should reference this type rather than storing free-form strings.

## Consequences

- Consistent classification across all kernel contracts
- Enables filtering, aggregation, and analysis by statement type
- Simplifies the implementation of Rule #008 in all layers
- Existing contracts (RealityMetric, RealityGap) should be updated to use this shared enum
