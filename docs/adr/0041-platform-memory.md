# ADR-0041: Platform Memory

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

Traditional platforms remember conversations or log entries. These are transient and lack structural meaning. SPYRAL needs a memory model that preserves what matters — the relationships between entities.

## Decision

SPYRAL remembers **relationships**, not conversations.

A **relationship** is durable — it connects entities in a meaningful way that persists across sessions.
A **conversation** is transient — it exists in a moment and then fades.

LearningRecords are the durable evidence of relationships. They record which Outcomes contributed to which Patterns at a specific point in time. This is SPYRAL's memory.

Example:
- A conversation asks: "What did we learn about marketing campaigns?"
- SPYRAL's memory answers: "Marketing campaigns launched within 48 hours of product release showed 22% higher success. This pattern has been observed 4 times with 85% confidence."

The conversation is forgotten. The relationship endures.

## Consequences

- LearningRecords are the primary memory units of the platform.
- The system stores relationships, not raw conversation logs.
- Memory can be queried through the Learning Studio's Pattern and Insight views.
- Future Intelligence features build on top of this memory model.
