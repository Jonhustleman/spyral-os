# ADR-0040: Intelligence Is Read-Only

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

If the Intelligence Engine can modify Reality, Decisions, Execution, or Validation data, the system loses its trustworthiness. Users must be confident that the foundation layers are not being silently altered by the layer above them.

## Decision

The Intelligence Engine never modifies:

- **Reality** — current state observations
- **Decisions** — immutable historical choices
- **Execution** — work that was performed
- **Validation** — measurements that were taken

It only **synthesizes**.

The Intelligence Engine reads from these layers and produces:
- Patterns
- Insights
- Recommendations

It never writes back to them.

## Consequences

- Intelligence Engine has read-only access to all lower layers.
- The kernel enforces this at the capability permission level.
- Users can trust that Reality, Decisions, Execution, and Validation data are never silently altered.
- Corrections to lower layers must be made through their respective engines, not through Intelligence.
