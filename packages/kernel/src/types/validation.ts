/**
 * @spyral/kernel — Validation Engine Types
 *
 * Core types for the Validation Engine (Phase C.1).
 * Defines the pipeline stages, results, and scoring mechanisms
 * that SPYRAL uses to judge the quality of its own decisions.
 *
 * Pipeline:
 *   Input ↓ Schema Validation ↓ Business Rules ↓ Evidence Check ↓ Risk Assessment ↓ Confidence Score ↓ Recommendations
 */

import type { Decision } from "./decision.js";

// ─── Validation Pipeline Stages ──────────────────────────────────────────────

export type ValidationStage =
  | "schema"
  | "business_rules"
  | "evidence_check"
  | "risk_assessment"
  | "confidence_score"
  | "recommendations";

// ─── Risk Levels ─────────────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "critical";

// ─── Individual Validation Check ─────────────────────────────────────────────

export interface ValidationCheck {
  stage: ValidationStage;
  name: string;
  passed: boolean;
  severity: "info" | "warning" | "error";
  message: string;
  details?: string;
}

// ─── Risk Assessment ─────────────────────────────────────────────────────────

export interface RiskAssessment {
  level: RiskLevel;
  score: number; // 0–1
  factors: string[];
  mitigations: string[];
}

// ─── Validation Recommendation ───────────────────────────────────────────────

export interface ValidationRecommendation {
  priority: "high" | "medium" | "low";
  category: string;
  suggestion: string;
  impact: string;
}

// ─── Full Validation Result ─────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  overallScore: number; // 0–1
  confidence: number; // 0–1
  risk: RiskAssessment;
  checks: ValidationCheck[];
  recommendations: ValidationRecommendation[];
  summary: string;
  decisionId: string;
  timestamp: string;
  duration: number; // ms
}

// ─── Validation Engine Configuration ─────────────────────────────────────────

export interface ValidationEngineConfig {
  minTitleLength: number;
  minIntentLength: number;
  minOptionsRequired: number;
  minConfidenceThreshold: number;
  maxRiskThreshold: RiskLevel;
  enableEvidenceCheck: boolean;
  enableRiskAssessment: boolean;
  customRules?: Array<{
    name: string;
    description: string;
    check: (decision: Decision) => ValidationCheck;
  }>;
}

// ─── Default Configuration ──────────────────────────────────────────────────

export const DEFAULT_VALIDATION_CONFIG: ValidationEngineConfig = {
  minTitleLength: 3,
  minIntentLength: 10,
  minOptionsRequired: 1,
  minConfidenceThreshold: 0.1,
  maxRiskThreshold: "high",
  enableEvidenceCheck: true,
  enableRiskAssessment: true,
};
