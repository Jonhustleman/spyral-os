/**
 * SPYRAL OS — Kernel Contract
 * Workspace — the entry point into the operating system.
 * Every workspace represents a separate operating environment.
 *
 * Rule #004: The kernel never knows concrete workspace types.
 * Concrete types (Business, Medical, etc.) are defined by plugins via WorkspaceRegistry.
 */

import type { Entity } from "./identity/Entity";

/**
 * Lifecycle status for a workspace.
 * Future-proof: supports active, paused, and archived states.
 */
export enum WorkspaceStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  ARCHIVED = "archived",
}

export interface WorkspaceDNA {
  industry: string;
  mission: string;
  planningHorizon: "short" | "medium" | "long";
  riskAppetite: "conservative" | "moderate" | "aggressive";
  growthStyle: "steady" | "balanced" | "rapid";
  successMetric: string;
}

/**
 * Workspace — the core domain entity.
 * The kernel only knows that every workspace has these fields.
 * Concrete workspace types (e.g. Business, Medical) are unknown to the kernel.
 */
export interface Workspace extends Entity {
  /** Human-readable display name. */
  name: string;

  /** Workspace type identifier — a string key resolved by WorkspaceRegistry. */
  type: string;

  /** Short summary of what this workspace is for. */
  description: string;

  /** The primary objective this workspace is organized around. */
  goal: string;

  /** DNA profile defining strategic orientation. */
  dna: WorkspaceDNA;

  /** Current lifecycle status. */
  status: WorkspaceStatus;

  /** Optional sort/priority order. */
  pinned?: boolean;
}
