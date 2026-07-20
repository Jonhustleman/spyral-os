/**
 * SPYRAL OS — Kernel Contract
 * Capability — the unit of composition for SPYRAL OS.
 *
 * Rule #007: Capabilities are the unit of composition.
 * Everything else assembles around them.
 *
 * Screens belong to Capabilities.
 * Capabilities belong to Workspaces.
 * Workspaces never own pages.
 *
 * This contract is FROZEN — do not modify after Sprint 3.
 */

import type { CapabilityManifest } from "./CapabilityManifest";

/**
 * A Capability is a self-contained unit of functionality.
 * It represents a reusable, installable module that a workspace can enable.
 *
 * The kernel knows what a capability IS, not how it behaves.
 * Behavior belongs in the features layer.
 */
export interface Capability {
  /** Unique identifier (e.g. "command", "reality", "business.vendor"). */
  readonly id: string;

  /** Human-readable display name. */
  readonly name: string;

  /** SemVer version string. */
  readonly version: string;

  /** Optional icon identifier for UI rendering. */
  readonly icon?: string;

  /** Route paths this capability provides (e.g. ["/command", "/command/ai"]). */
  readonly routes: string[];

  /** Permission keys this capability requires (e.g. ["metrics", "reports"]). */
  readonly permissions: string[];

  /** Structured manifest metadata. */
  readonly manifest: CapabilityManifest;
}
