# ADR-0019: Explainability

**Status:** Accepted  
**Date:** 2026-07-19  
**Author:** Chief Architect (ChatGPT)  
**Type:** Principle  

## Context

As SPYRAL OS begins making recommendations and surfacing trade-offs, the user must be able to understand the reasoning behind every output.

## Decision

Every recommendation must answer:

1. **Why?** — What reasoning produced this output?
2. **Based on what?** — What data or evidence supports it?
3. **Confidence?** — How certain is the system?
4. **Alternatives?** — What other options were considered?
5. **Missing information?** — What would improve the recommendation?

This ADR is **non-negotiable**. If the platform cannot explain a recommendation, it should not present it as authoritative.

## Consequences

- All Decision Engine outputs must include an explanation record
- UI components must display explanation alongside recommendations
- Explanation data model must be part of the Decision contract
- Increases output size but is essential for trust and transparency
