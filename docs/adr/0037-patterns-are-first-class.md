# ADR-0037: Patterns Are First-Class

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Contract  

## Context

Without a formal representation of Patterns, the Learning Engine has no way to communicate what it has learned. Insights and Recommendations would have no foundation, making the entire Intelligence pipeline unreliable.

## Decision

Patterns, LearningRecords, Insights, and Recommendations are first-class kernel contracts.

```typescript
interface Pattern extends Entity {
  title: string;
  description?: string;
  evidenceIds: string[];
  occurrenceCount: number;
  confidence: number;
  lastObserved: Date;
  category?: string;
}
```

Patterns are **discovered**. Not authored. The Learning Engine identifies them from repeated Outcomes.

```typescript
interface LearningRecord extends Entity {
  outcomeIds: string[];
  patternIds: string[];
  confidenceDelta: number;
  description?: string;
  confidence: number;
}
```

LearningRecords are **immutable**. They capture the moment of learning.

```typescript
interface Insight extends Entity {
  patternIds: string[];
  description: string;
  category?: string;
  confidence: number;
  evidence?: string;
  tags: string[];
}
```

Insights are **human-readable observations** generated from Patterns.
Example: "Marketing campaigns launched within 48 hours of product release showed 22% higher success."
This is an observation. Not advice.

```typescript
interface Recommendation extends Entity {
  insightIds: string[];
  title: string;
  description?: string;
  explanation: Explainability;
  priority: "critical" | "high" | "medium" | "low";
  status: "active" | "implemented" | "dismissed" | "superseded";
}
```

Recommendations derive from Insights. Every recommendation must contain explanation, confidence, supporting evidence, and alternative interpretations — continuing ADR-0019 (Explainability).

## Consequences

- These four contracts are Core APIs — they define how the system communicates learned knowledge.
- The Learning Engine discovers Patterns; it does not create them manually.
- Recommendations are the output of the full Intelligence pipeline.
- These contracts enable the traceability chain defined in ADR-0039.
