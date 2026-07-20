# ADR-0038: Intelligence Pipeline

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

Without a frozen pipeline, the Intelligence layer could develop ad-hoc reasoning paths that bypass validation and learning, undermining the system's traceability and trustworthiness.

## Decision

Freeze the reasoning pipeline:

```
Reality → Decision → Execution → Validation → Learning → Insight → Recommendation
```

Nothing bypasses Learning. Every recommendation must trace back through:

- **Insight** (what we observe)
- **Pattern** (what we've confirmed)
- **Outcome** (what we validated)
- **Validation** (what we measured)
- **Execution** (what we did)
- **Decision** (what we chose)
- **Reality** (what was true)

This pipeline ensures that every output from the Intelligence layer is grounded in evidence that can be traced back to a perceived reality.

## Consequences

- The Intelligence Engine never produces output that bypasses Learning.
- Direct Reality → Recommendation paths are prohibited.
- The pipeline is enforced at the contract level through required reference chains.
- Future AI modules consume this pipeline rather than raw history.
