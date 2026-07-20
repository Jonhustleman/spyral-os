# ADR-0026: Execution Produces Evidence

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

Completion alone is insufficient for validation. Without evidence, there is no way to verify that execution actually achieved its intended effect. This creates a blind spot between "work is done" and "reality has changed."

## Decision

Every completed task should optionally produce:

- **Notes** — free-form observations about what was learned during execution
- **Attachments** — files, screenshots, references, or artifacts produced
- **Metric Changes** — measurable impact on existing Reality metrics

Evidence feeds the Validation Engine, which feeds the Learning Engine.

```
Execution → Evidence → Validation → Learning
```

Evidence is not required for every task — only for tasks where the impact is non-obvious or where verification is important.

## Consequences

- Task contract includes an optional `evidence` field.
- Evidence is a first-class entity in the kernel contracts.
- Validation Engine will consume Evidence as its primary input.
- Evidence provides the raw material for the Learning Engine to generalize from.
