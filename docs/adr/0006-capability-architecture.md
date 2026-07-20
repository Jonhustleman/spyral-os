# ADR-0006: Capability Architecture

**Status:** Frozen (Sprint 3)  
**Rules:** #006, #007

## Decision

Screens never belong to Workspaces. Screens belong to Capabilities.
Capabilities belong to Workspaces.

Capabilities are the unit of composition. Everything else assembles around them.

## Architecture Flow

```
Workspace → Enabled Capabilities → Capability Routes → Sidebar
```

## Contracts Created

- `kernel/contracts/Capability.ts` — Capability interface
- `kernel/contracts/CapabilityState.ts` — Lifecycle state enum

## Rationale

This keeps the platform modular. Deleting a capability doesn't break the kernel,
the workspace, or other capabilities. Navigation is generated dynamically from
enabled capabilities rather than being hardcoded.
