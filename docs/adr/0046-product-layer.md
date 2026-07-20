# ADR-0046: Product Layer

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

Until now we have been designing platform architecture. The kernel, engines, contracts, and capabilities form a solid foundation. But a platform is not a product. Users do not experience architecture — they experience interaction.

Beginning with Sprint 9, we begin designing **product architecture**.

## Decision

From Sprint 9 onward, every feature proposal should be evaluated against one question:

> **Does this make reality easier to navigate?**

If not, it probably belongs in infrastructure, not the product.

| Question | Answers |
|----------|---------|
| Platform | How is the system built? |
| Product  | How does the human experience it? |

These are different disciplines. The platform serves the product; the product serves the user.

## Consequences

- Feature proposals must include a product impact assessment.
- Infrastructure improvements continue but are invisible to users.
- The Navigation Studio is the first product-layer capability.
- Every screen should answer: "Why am I here and what can I do next?"
