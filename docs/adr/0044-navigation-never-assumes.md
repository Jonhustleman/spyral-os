# ADR-0044: Navigation Never Assumes

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

Each engine in SPYRAL has a distinct responsibility. Navigation's role was ambiguous — was it a dashboard, a homepage, or something else? Without clear boundaries, Navigation could encroach on other engines' responsibilities.

## Decision

Navigation asks. Reality measures. Decision compares. Execution acts. Validation verifies. Learning remembers.

Each engine has exactly one responsibility:

| Engine | Responsibility |
|--------|---------------|
| Navigation | Asks where the user wants to go |
| Reality | Measures current state |
| Decision | Compares options |
| Execution | Acts on the chosen option |
| Validation | Verifies the result |
| Learning | Remembers patterns |

**Navigation Never Assumes.** It asks clarifying questions to understand the user's intent. It does not presume to know what the user needs. It orchestrates the other engines but does not perform their work.

## Consequences

- Navigation is a conversation, not a form.
- Navigation does not store Reality data, make Decisions, execute Tasks, validate Results, or learn Patterns.
- Navigation orchestrates the other engines through NavigationContext (ADR-0043).
- The symmetry of responsibilities is one of SPYRAL's greatest architectural strengths.
