# ADR-0020: No Single Best Option

**Status:** Accepted  
**Date:** 2026-07-19  
**Author:** Chief Architect (ChatGPT)  
**Type:** Principle  

## Context

Decision engines often default to presenting a "best" answer. This creates false certainty and undermines user agency.

## Decision

The Decision Engine must rank options without claiming certainty. It surfaces trade-offs across multiple dimensions. The user always chooses.

Key rules:
- Never mark a single option as "best" or "recommended" in absolute terms
- Always present scores across multiple dimensions (impact, cost, risk, effort, confidence)
- Allow users to weigh dimensions according to their own priorities
- If a choice is obvious, present the data that makes it obvious — don't make the choice for the user

## Consequences

- User agency is preserved
- Platform surfaces information rather than authority
- Decision UI must show comparative scores, not winner-take-all
- Prevents over-reliance on automated recommendations
- Aligns with SPYRAL's core principle: "What are my options?" not "What is the answer?"
