/**
 * SPYRAL OS — Capability Registry (Features Layer)
 *
 * Manages registration, discovery, enable/disable of capabilities.
 * The kernel knows the Capability contract; this registry manages instances.
 *
 * Responsibilities:
 *   - Register / Unregister capabilities
 *   - Enable / Disable capabilities
 *   - Discover capabilities by workspace type
 */

import type { Capability } from "@/kernel/contracts/Capability";

type CapabilityEntry = {
  capability: Capability;
  enabled: boolean;
};

class CapabilityRegistryImpl {
  private entries = new Map<string, CapabilityEntry>();

  // ── Registration ──────────────────────────────────────────────────────

  /**
   * Register a capability. Throws if the ID already exists.
   */
  register(capability: Capability): void {
    if (this.entries.has(capability.id)) {
      throw new Error(`Capability "${capability.id}" is already registered.`);
    }
    this.entries.set(capability.id, { capability, enabled: true });
  }

  /**
   * Unregister a capability. Silently ignored if not found.
   */
  unregister(id: string): void {
    this.entries.delete(id);
  }

  // ── Enable / Disable ──────────────────────────────────────────────────

  /**
   * Enable a registered capability.
   */
  enable(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    entry.enabled = true;
    return true;
  }

  /**
   * Disable a registered capability without unregistering it.
   */
  disable(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    entry.enabled = false;
    return true;
  }

  /**
   * Check if a capability is enabled.
   */
  isEnabled(id: string): boolean {
    return this.entries.get(id)?.enabled ?? false;
  }

  // ── Discovery ─────────────────────────────────────────────────────────

  /**
   * Get all registered capabilities.
   */
  getAll(): Capability[] {
    return Array.from(this.entries.values()).map((e) => e.capability);
  }

  /**
   * Get all enabled capabilities.
   */
  getEnabled(): Capability[] {
    return Array.from(this.entries.values())
      .filter((e) => e.enabled)
      .map((e) => e.capability);
  }

  /**
   * Get a single capability by ID.
   */
  get(id: string): Capability | undefined {
    return this.entries.get(id)?.capability;
  }

  /**
   * Get all capabilities in a specific category.
   */
  getByCategory(category: string): Capability[] {
    return this.getEnabled().filter((c) => c.manifest.category === category);
  }

  /**
   * Get all routes contributed by enabled capabilities.
   */
  getAllRoutes(): string[] {
    const routes = new Set<string>();
    for (const entry of this.entries.values()) {
      if (entry.enabled) {
        for (const route of entry.capability.routes) {
          routes.add(route);
        }
      }
    }
    return Array.from(routes);
  }
}

/** Singleton registry instance. */
export const CapabilityRegistry = new CapabilityRegistryImpl();
