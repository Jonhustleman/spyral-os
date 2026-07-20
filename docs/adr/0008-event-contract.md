# ADR-0008: Event Contract

**Status:** Ratified (Sprint 3)

## Decision

Events must exist before plugins start talking to each other. This ADR
introduces the event contract only — the event bus will be built later.

## Contracts Created

- `kernel/contracts/KernelEvent.ts`

## Rationale

Capabilities need a standard way to communicate. Defining the contract first
ensures all future event-driven features share a common shape without
requiring retroactive changes.
