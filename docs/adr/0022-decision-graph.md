# ADR-0022: Decision Graph

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Contract  

## Context

Decisions in complex projects do not exist in isolation. A decision to "Expand to Abuja" depends on "Secure Funding", which depends on "Increase Revenue". Today there is no way to model these relationships.

## Decision

Create a `DecisionRelationship` contract that allows decisions to reference each other.

```typescript
export interface DecisionRelationship {
  fromDecisionId: string;
  toDecisionId: string;
  relationship: DecisionRelationshipType;
}

export enum DecisionRelationshipType {
  DEPENDS_ON = "depends_on",
  BLOCKS = "blocks",
  ENABLES = "enables",
  SUPERSEDES = "supersedes",
  DUPLICATES = "duplicates",
}
```

This creates a **Decision Graph** — a directed graph of decisions that can be visualized and navigated.

## Consequences

- Complex project planning becomes structurally representable
- Users can visualize decision dependencies
- Enables impact analysis (what if this decision changes?)
- Supports future features like critical path analysis
- No breaking changes to existing Decision contracts
