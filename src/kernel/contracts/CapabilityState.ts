/**
 * SPYRAL OS — Kernel Contract
 * CapabilityState — lifecycle states for capabilities.
 *
 * ADR-0009: Every capability transitions through a defined lifecycle.
 * This enum represents the canonical state machine.
 *
 * FROZEN — Core API. Do not modify after Sprint 3.
 */
export enum CapabilityState {
  /** Package is installed but not yet registered with the system. */
  INSTALLED = "installed",

  /** Registered with the CapabilityRegistry but not yet validated. */
  REGISTERED = "registered",

  /** Manifest and contract validated. Ready to be enabled. */
  VALIDATED = "validated",

  /** User or system has opted to enable this capability. */
  ENABLED = "enabled",

  /** Capability assets loaded into memory. */
  LOADED = "loaded",

  /** Routes mounted, UI components available. Fully operational. */
  MOUNTED = "mounted",

  /** Capability is actively serving requests. Normal operating state. */
  RUNNING = "running",

  /** Temporarily suspended while preserving state and routes. */
  PAUSED = "paused",

  /** Disabled by user or system. Routes unmounted but registration preserved. */
  DISABLED = "disabled",

  /** Permanently removed from the registry. Cleanup complete. */
  UNINSTALLED = "uninstalled",
}
