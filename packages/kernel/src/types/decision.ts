/**
 * @spyral/kernel — Decision Domain Types
 *
 * Core decision domain — the heart of SPYRAL.
 * Per ADR-0017: decisions are immutable once made.
 * Corrections are new decisions that supersede the old one.
 */

import type { DomainEntity } from "./common.js";

export interface DecisionOption {
  id: string;
  title: string;
  description: string;
  expectedBenefit: string;
  expectedCost: string;
  expectedRisk: string;
  requiredEffort: string;
  confidence: number;
}

export type DecisionStatus = "draft" | "analyzed" | "executing" | "completed" | "abandoned";

export interface Decision extends DomainEntity {
  workspaceId: string;
  ownerId: string;
  orgId: string;
  title: string;
  description?: string;
  intent: string;
  context: string;
  options: DecisionOption[];
  status: DecisionStatus;
  recommendedOptionId?: string;
  selectedOptionId?: string;
  confidence: number;
  tags: string[];
}

export interface DecisionSummary {
  id: string;
  title: string;
  status: DecisionStatus;
  optionCount: number;
  confidence: number;
  createdAt: string;
  workspaceId: string;
}
