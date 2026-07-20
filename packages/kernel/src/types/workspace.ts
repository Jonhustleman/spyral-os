/**
 * @spyral/kernel — Workspace Domain Types
 *
 * Workspace is the aggregate root in SPYRAL.
 * Every decision, execution, reality map, learning, and validation
 * belongs to exactly one workspace.
 *
 * Per Rule #004: The kernel never knows concrete workspace types.
 * Concrete types (Business, Medical, etc.) are defined by plugins.
 */

import type { DomainEntity } from "./common.js";

export type WorkspaceStatus = "active" | "paused" | "archived";

export interface WorkspaceDNA {
  industry: string;
  mission: string;
  planningHorizon: "short" | "medium" | "long";
  riskAppetite: "conservative" | "moderate" | "aggressive";
  growthStyle: "steady" | "balanced" | "rapid";
  successMetric: string;
}

export interface Workspace extends DomainEntity {
  ownerId: string;
  orgId: string;
  name: string;
  type: string;
  description: string;
  goal: string;
  status: WorkspaceStatus;
  dna: WorkspaceDNA;
  tags: string[];
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  type: string;
  status: WorkspaceStatus;
  goal: string;
  decisionCount: number;
  executionCount: number;
  learningCount: number;
  createdAt: string;
}

/**
 * Workspace aggregate — the root entity that owns all child objects.
 * This represents the conceptual aggregate boundary.
 * The kernel defines the structure; capabilities manage persistence.
 */
export interface WorkspaceAggregate {
  workspace: Workspace;
  decisions: string[]; // decision IDs
  executionPlans: string[]; // execution plan IDs
  realitySnapshots: string[]; // reality snapshot IDs
  learningRecords: string[]; // learning record IDs
  validationReports: string[]; // validation report IDs
}
