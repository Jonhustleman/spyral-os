# ADR-0005: Manifest Pattern

**Status:** Frozen (Sprint 3)  
**Rule:** #005

## Decision

Everything installable must expose a manifest.

## Rationale

Manifests provide self-describing metadata for capabilities, workspaces,
reports, themes, and integrations. This enables dynamic discovery,
validation, and dependency resolution without hardcoding.

## Contracts Created

- `kernel/contracts/CapabilityManifest.ts`

## Consequences

- Capabilities include a manifest with title, description, author, version, category.
- Future installable modules (workspaces, experts, reports, themes) will follow the same pattern.
