/**
 * @spyral/kernel — Reality Cycle Types
 *
 * Phase E.0 — SPYRAL ChatGPT App Pilot Experience
 *
 * The Reality Cycle is SPYRAL's primary user-facing flow.
 * It transforms a human intention into a structured reality assessment,
 * strategy, execution plan, and learning loop.
 *
 * Architecture:
 *   ChatGPT → spyral_begin_reality_cycle (MCP tool) → RealityCycleService → Capabilities
 */

import type { Decision } from "./decision.js";
import type { ExecutionPlan } from "./execution.js";
import type { Workspace } from "./workspace.js";
import type { LearningRecord } from "./learning.js";

// ─── Input ───────────────────────────────────────────────────────────────────

export interface BeginRealityCycleRequest {
  /** The user's stated intention or goal */
  goal: string;
  /** Optional workspace ID to resume an existing cycle */
  workspaceId?: string;
}

// ─── Orchestration Stages ────────────────────────────────────────────────────

export type RealityStage =
  | "observe"
  | "organize"
  | "predict"
  | "validate"
  | "adapt"
  | "complete";

export interface StageResult {
  stage: RealityStage;
  label: string;
  status: "running" | "complete" | "skipped";
  summary: string;
  detail?: string;
}

// ─── SOP — Structured Observation Protocol ───────────────────────────────────

export interface SOPResult {
  desiredReality: string;
  currentReality: CurrentRealityAssessment;
  problemStatement: string;
  assumptions: string[];
  observations: string[];
  conclusions: string[];
}

export interface CurrentRealityAssessment {
  known: string[];
  unknown: string[];
  constraints: string[];
}

// ─── LDE — Latent Detection Engine ───────────────────────────────────────────

export interface LDEResult {
  hiddenPatterns: string[];
  deeperStructures: string[];
  organizationalDynamics: string[];
}

// ─── STE — Strategy Trajectory Engine ────────────────────────────────────────

export interface STEResult {
  possibleTrajectories: Trajectory[];
  recommendedStrategy: Strategy;
  strategyOptions: StrategyOption[];
}

export interface Trajectory {
  title: string;
  description: string;
  likelihood: "high" | "medium" | "low";
}

export interface StrategyOption {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  confidence: number;
}

export interface Strategy {
  approach: string;
  rationale: string;
  keyActivities: string[];
  milestones: Milestone[];
}

export interface Milestone {
  title: string;
  description: string;
  timeframe: string;
  successCriteria: string;
}

// ─── SVE — Strategy Validation Engine ────────────────────────────────────────

export interface SVEResult {
  validatedAssumptions: string[];
  invalidatedAssumptions: string[];
  evidenceEvaluated: string[];
  confidenceScore: number;
  confidenceFactors: {
    increasesConfidence: string[];
    decreasesConfidence: string[];
  };
  risks: Risk[];
}

export interface Risk {
  description: string;
  likelihood: "high" | "medium" | "low";
  impact: "high" | "medium" | "low";
  mitigation: string;
}

// ─── SAE — Strategy Adaptation Engine ────────────────────────────────────────

export interface SAEResult {
  improvements: string[];
  learningPathway: LearningPathway;
  adaptationSuggestions: string[];
}

export interface LearningPathway {
  feedbackLoops: string[];
  measurementPlan: MeasurementPlan;
  iterationCadence: string;
}

export interface MeasurementPlan {
  metrics: string[];
  reviewCadence: string;
  successThresholds: string[];
}

// ─── Full Response ───────────────────────────────────────────────────────────

export interface RealityCycleResponse {
  /** The workspace created or used for this cycle */
  workspace: Workspace;

  /** The decision created from this cycle */
  decision: Decision;

  /** The execution plan created */
  executionPlan: ExecutionPlan;

  /** The learning record created */
  learningRecord: LearningRecord;

  /** Human-readable stages with progress */
  stages: StageResult[];

  // ─── Phase E.2 — Cycle Identity ────────────────────────────────────────

  cycleId: string;
  cycleNumber: number;
  cycleIdentity: CycleIdentity;

  // ─── SOP Output ──────────────────────────────────────────────────────────

  desiredReality: string;
  currentReality: CurrentRealityAssessment;

  // ─── STE Output ──────────────────────────────────────────────────────────

  strategy: Strategy;
  strategyOptions: StrategyOption[];

  // ─── SVE Output ──────────────────────────────────────────────────────────

  confidence: {
    score: number;
    increasesConfidence: string[];
    decreasesConfidence: string[];
  };
  risks: Risk[];

  // ─── SAE Output ──────────────────────────────────────────────────────────

  immediateTasks: string[];
  learningLoop: {
    howItWorks: string;
    feedbackLoops: string[];
    measurementPlan: MeasurementPlan;
  };

  // ─── Explainability ──────────────────────────────────────────────────────

  reasoning: {
    observation: string;
    organization: string;
    prediction: string;
    validation: string;
    adaptation: string;
    learning: string;
  };

  // ─── Phase E.1.3 — "Why This Strategy?" Reasoning Chain ────────────────

  whyThisStrategy: {
    observed: string;
    detectedPattern: string;
    prediction: string;
    recommendation: string;
    chain: string[];
  };

  // ─── Phase E.1.4 — SPYRAL Reality Report (formatted text) ─────────────

  spyralReport: string;

  // ─── Phase E.1.5 — Pilot Mode ─────────────────────────────────────────

  pilotMode: PilotModeState;

  // ─── Phase E.2 — Cycle Quality ────────────────────────────────────────

  quality: CycleQuality;

  // ─── Phase E.2 — Pilot Profile ───────────────────────────────────────

  pilotProfile: PilotProfile;
}

export interface BeginRealityCycleResponse {
  success: boolean;
  cycle: RealityCycleResponse;
}

// ─── Phase E.1.1 — Reality Cycle Feedback ─────────────────────────────────

export type UserRating = "yes" | "partial" | "no";

export interface RealityCycleFeedback {
  cycleId: string;
  workspaceId: string;
  userRating: UserRating;
  expectedReality: string;
  observedReality: string;
  gaps: string[];
  corrections: string[];
  timestamp: string;
}

export interface SubmitFeedbackRequest {
  cycleId: string;
  userRating: UserRating;
  expectedReality?: string;
  observedReality?: string;
  gaps?: string[];
  corrections?: string[];
}

// ─── Phase E.1.2 — Prediction Tracking ────────────────────────────────────

export interface Prediction {
  id: string;
  cycleId: string;
  statement: string;
  expectedOutcome: string;
  timeframe: string;
  confidence: number;
  status: "active" | "confirmed" | "refuted" | "inconclusive";
  observedOutcome?: string;
  variance?: number;
  completedAt?: string;
}

export interface CreatePredictionRequest {
  cycleId: string;
  statement: string;
  expectedOutcome: string;
  timeframe: string;
  confidence: number;
}

export interface ResolvePredictionRequest {
  predictionId: string;
  observedOutcome: string;
  variance: number;
  status: "confirmed" | "refuted" | "inconclusive";
}

// ─── Phase E.1.5 — Pilot Mode ─────────────────────────────────────────────

export interface PilotModeState {
  active: boolean;
  cycleCount: number;
  simulationBenchmark: number;
  realWorldValidationStatus: "collecting" | "partial" | "established";
  learningCycles: number;
}

// ─── Phase E.2 — Pilot Reliability & Measurement Layer ─────────────────────

/** Unique cycle identity with human-readable formatting */
export interface CycleIdentity {
  cycleNumber: number;
  formattedId: string;
  createdAt: string;
  status: "active" | "awaiting_feedback" | "completed" | "archived";
}

/** Reality Gap Analysis — the bridge between prediction and adaptation */
export interface RealityGapAnalysis {
  predictionId: string;
  expectedOutcome: string;
  observedOutcome: string;
  difference: string;
  differenceMagnitude: number;
  possibleCauses: string[];
  recommendedAction: string;
}

/** Cycle Quality Scoring — measures whether SPYRAL produces useful cycles */
export interface CycleQuality {
  understanding: number;
  strategy: number;
  actionability: number;
  confidence: number;
  userTrust: number;
  overall: number;
}

/** Professional Tester / Pilot Participant Profile */
export interface PilotProfile {
  participantId: string;
  domain: string;
  cyclesCompleted: number;
  predictionsTested: number;
  learningContributions: number;
  joinDate: string;
}

/** Feedback response with gap analysis (Phase E.2) */
export interface SubmitFeedbackResponse {
  success: boolean;
  feedback: RealityCycleFeedback;
  gapAnalysis?: RealityGapAnalysis;
  quality?: CycleQuality;
  message: string;
}
