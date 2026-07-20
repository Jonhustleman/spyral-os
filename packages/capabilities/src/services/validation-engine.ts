/**
 * ValidationEngine — SPYRAL's core decision intelligence layer.
 *
 * A reusable pipeline that scores, validates, and explains decisions.
 * Every Application Service should use this engine to ensure quality.
 *
 * Phase C.1 — Validation Engine
 *
 * Pipeline:
 *   Input ↓ Schema Validation ↓ Business Rules ↓ Evidence Check ↓ Risk Assessment ↓ Confidence Score ↓ Recommendations
 */

import type {
  Decision,
  ValidationCheck,
  ValidationResult,
  RiskAssessment,
  ValidationRecommendation,
  ValidationEngineConfig,
} from "@spyral/kernel";
import { DEFAULT_VALIDATION_CONFIG } from "@spyral/kernel";

export class ValidationEngine {
  private config: ValidationEngineConfig;

  constructor(config?: Partial<ValidationEngineConfig>) {
    this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  }

  /**
   * Run the full validation pipeline against a decision.
   * Returns a comprehensive ValidationResult with scores, risks, and recommendations.
   */
  async validate(decision: Decision): Promise<ValidationResult> {
    const startTime = Date.now();
    const checks: ValidationCheck[] = [];
    const recommendations: ValidationRecommendation[] = [];

    // Stage 1: Schema Validation
    checks.push(...this.runSchemaValidation(decision));

    // Stage 2: Business Rules
    checks.push(...this.runBusinessRules(decision));

    // Stage 3: Evidence Check
    if (this.config.enableEvidenceCheck) {
      checks.push(...this.runEvidenceCheck(decision));
    }

    // Stage 4: Risk Assessment
    const risk = this.config.enableRiskAssessment
      ? this.assessRisk(decision, checks)
      : { level: "medium" as const, score: 0.5, factors: ["Risk assessment disabled"], mitigations: [] };

    // Stage 5: Confidence Score
    const overallScore = this.calculateOverallScore(checks);
    const confidence = this.calculateConfidence(overallScore, decision);

    // Stage 6: Recommendations
    recommendations.push(...this.generateRecommendations(checks, risk, overallScore));

    // Add custom rules
    if (this.config.customRules) {
      for (const rule of this.config.customRules) {
        try {
          checks.push(rule.check(decision));
        } catch {
          checks.push({
            stage: "business_rules",
            name: rule.name,
            passed: false,
            severity: "error",
            message: `Custom rule "${rule.name}" failed to execute`,
          });
        }
      }
    }

    const valid = checks.filter((c) => c.severity === "error").length === 0;
    const failedErrors = checks.filter((c) => c.severity === "error" && !c.passed);
    const allPassed = failedErrors.length === 0;

    return {
      valid: allPassed,
      overallScore,
      confidence,
      risk,
      checks,
      recommendations,
      summary: this.generateSummary(allPassed, overallScore, risk, checks),
      decisionId: decision.id,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };
  }

  // ─── Stage 1: Schema Validation ────────────────────────────────────────────

  private runSchemaValidation(decision: Decision): ValidationCheck[] {
    const checks: ValidationCheck[] = [];

    checks.push({
      stage: "schema",
      name: "Decision ID present",
      passed: !!decision.id,
      severity: "error",
      message: decision.id ? "Decision ID is present" : "Decision ID is missing",
    });

    checks.push({
      stage: "schema",
      name: "Workspace ID present",
      passed: !!decision.workspaceId,
      severity: "error",
      message: decision.workspaceId ? "Workspace ID is present" : "Workspace ID is missing",
    });

    checks.push({
      stage: "schema",
      name: "Title length",
      passed: decision.title?.length >= this.config.minTitleLength,
      severity: "error",
      message: `Title length is ${decision.title?.length ?? 0} (minimum ${this.config.minTitleLength})`,
      details: decision.title?.length >= this.config.minTitleLength ? undefined : "Title is too short to be meaningful",
    });

    checks.push({
      stage: "schema",
      name: "Intent length",
      passed: decision.intent?.length >= this.config.minIntentLength,
      severity: "error",
      message: `Intent length is ${decision.intent?.length ?? 0} (minimum ${this.config.minIntentLength})`,
      details: decision.intent?.length >= this.config.minIntentLength ? undefined : "Intent is too short to analyze",
    });

    checks.push({
      stage: "schema",
      name: "Has options",
      passed: (decision.options?.length ?? 0) >= this.config.minOptionsRequired,
      severity: "error",
      message: `Decision has ${decision.options?.length ?? 0} options (minimum ${this.config.minOptionsRequired})`,
      details: (decision.options?.length ?? 0) >= this.config.minOptionsRequired ? undefined : "Add at least one strategic option",
    });

    checks.push({
      stage: "schema",
      name: "Has status",
      passed: !!decision.status,
      severity: "warning",
      message: decision.status ? `Status is "${decision.status}"` : "Status is not set",
    });

    return checks;
  }

  // ─── Stage 2: Business Rules ───────────────────────────────────────────────

  private runBusinessRules(decision: Decision): ValidationCheck[] {
    const checks: ValidationCheck[] = [];

    // Check for option coherence
    const optionNames = decision.options?.map((o) => o.title?.toLowerCase().trim()) ?? [];
    const uniqueNames = new Set(optionNames);
    checks.push({
      stage: "business_rules",
      name: "Unique option names",
      passed: uniqueNames.size === optionNames.length,
      severity: "warning",
      message: uniqueNames.size === optionNames.length
        ? "All option names are unique"
        : `Found ${optionNames.length - uniqueNames.size} duplicate option name(s)`,
    });

    // Check confidence distribution
    const confidences = decision.options?.map((o) => o.confidence) ?? [];
    if (confidences.length > 0) {
      const maxConf = Math.max(...confidences);
      const minConf = Math.min(...confidences);
      checks.push({
        stage: "business_rules",
        name: "Confidence range",
        passed: maxConf - minConf < 0.8,
        severity: "warning",
        message: `Confidence range: ${(maxConf - minConf).toFixed(2)} (spread ${maxConf - minConf < 0.8 ? "acceptable" : "too wide"})`,
        details: maxConf - minConf >= 0.8 ? "Options have very different confidence levels — review assumptions" : undefined,
      });
    }

    // Check for very low confidence options
    const lowConfOptions = decision.options?.filter((o) => o.confidence < this.config.minConfidenceThreshold) ?? [];
    checks.push({
      stage: "business_rules",
      name: "Low confidence options",
      passed: lowConfOptions.length === 0,
      severity: "warning",
      message: lowConfOptions.length === 0
        ? "All options meet minimum confidence threshold"
        : `${lowConfOptions.length} option(s) below ${this.config.minConfidenceThreshold} confidence`,
    });

    // Check context richness
    checks.push({
      stage: "business_rules",
      name: "Context provided",
      passed: (decision.context?.length ?? 0) > 10,
      severity: "info",
      message: (decision.context?.length ?? 0) > 10
        ? "Context is provided with sufficient detail"
        : "Context is minimal — consider adding more background",
    });

    return checks;
  }

  // ─── Stage 3: Evidence Check ───────────────────────────────────────────────

  private runEvidenceCheck(decision: Decision): ValidationCheck[] {
    const checks: ValidationCheck[] = [];
    const lowerTitle = (decision.title ?? "").toLowerCase();
    const lowerIntent = (decision.intent ?? "").toLowerCase();
    const lowerContext = (decision.context ?? "").toLowerCase();
    const combined = `${lowerTitle} ${lowerIntent} ${lowerContext}`;

    // Check for numerical evidence
    const hasNumbers = /\d+/.test(combined);
    checks.push({
      stage: "evidence_check",
      name: "Quantitative evidence",
      passed: hasNumbers,
      severity: "info",
      message: hasNumbers
        ? "Decision contains quantitative data"
        : "No numerical data found — consider adding metrics",
    });

    // Check for comparison words
    const hasComparison = /\b(versus|vs|compared|alternative|option|rather than)\b/i.test(combined);
    checks.push({
      stage: "evidence_check",
      name: "Comparative analysis",
      passed: hasComparison,
      severity: "info",
      message: hasComparison
        ? "Decision includes comparative analysis"
        : "No comparison framing found — consider comparing alternatives",
    });

    // Check for risk language
    const hasRisk = /\b(risk|uncertainty|threat|opportunity|challenge|concern)\b/i.test(combined);
    checks.push({
      stage: "evidence_check",
      name: "Risk awareness",
      passed: hasRisk,
      severity: "info",
      message: hasRisk
        ? "Decision acknowledges risks or challenges"
        : "No risk language detected — consider adding risk analysis",
    });

    // Check for timeframe
    const hasTimeframe = /\b(quarter|month|year|week|day|Q[1-4]|20\d{2}|soon|immediate|long.term|short.term)\b/i.test(combined);
    checks.push({
      stage: "evidence_check",
      name: "Timeframe specified",
      passed: hasTimeframe,
      severity: "info",
      message: hasTimeframe
        ? "Decision includes timeframe references"
        : "No timeframe specified — consider adding timeline context",
    });

    return checks;
  }

  // ─── Stage 4: Risk Assessment ──────────────────────────────────────────────

  private assessRisk(decision: Decision, checks: ValidationCheck[]): RiskAssessment {
    const factors: string[] = [];
    const mitigations: string[] = [];

    // Count failed checks
    const failedChecks = checks.filter((c) => !c.passed);
    const errorChecks = failedChecks.filter((c) => c.severity === "error");

    if (errorChecks.length > 0) {
      factors.push(`${errorChecks.length} validation error(s) found`);
      mitigations.push("Address validation errors before proceeding");
    }

    // Analyze confidence
    if (decision.confidence < 0.3) {
      factors.push("Overall confidence is very low");
      mitigations.push("Gather more information to increase confidence");
    } else if (decision.confidence < 0.6) {
      factors.push("Overall confidence is moderate");
      mitigations.push("Consider additional data sources");
    }

    // Check option spread
    const confidences = decision.options?.map((o) => o.confidence) ?? [];
    if (confidences.length > 1) {
      const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      const variance = confidences.reduce((sum, c) => sum + (c - avg) ** 2, 0) / confidences.length;
      if (variance > 0.1) {
        factors.push("High variance in option confidence scores");
        mitigations.push("Review individual option assumptions");
      }
    }

    // Determine risk level
    let riskScore = 0;
    riskScore += (decision.confidence < 0.3 ? 0.4 : decision.confidence < 0.6 ? 0.2 : 0);
    riskScore += (errorChecks.length > 0 ? 0.3 : 0);
    riskScore += (failedChecks.length > 3 ? 0.2 : 0);
    riskScore = Math.min(riskScore, 1);

    let level: import("@spyral/kernel").RiskLevel;
    if (riskScore >= 0.7) level = "critical";
    else if (riskScore >= 0.4) level = "high";
    else if (riskScore >= 0.2) level = "medium";
    else level = "low";

    return {
      level,
      score: riskScore,
      factors: factors.length > 0 ? factors : ["No significant risk factors identified"],
      mitigations: mitigations.length > 0 ? mitigations : ["Continue with current approach"],
    };
  }

  // ─── Stage 5: Confidence Scoring ───────────────────────────────────────────

  private calculateOverallScore(checks: ValidationCheck[]): number {
    if (checks.length === 0) return 0;

    let totalScore = 0;
    for (const check of checks) {
      if (check.severity === "error") {
        totalScore += check.passed ? 1 : 0;
      } else if (check.severity === "warning") {
        totalScore += check.passed ? 0.7 : 0.3;
      } else {
        totalScore += check.passed ? 0.5 : 0.2;
      }
    }

    return Math.round((totalScore / checks.length) * 100) / 100;
  }

  private calculateConfidence(overallScore: number, decision: Decision): number {
    // Blend validation score with decision's self-assessed confidence
    const validationWeight = 0.4;
    const decisionWeight = 0.6;
    const blended = (overallScore * validationWeight) + (decision.confidence * decisionWeight);
    return Math.round(blended * 100) / 100;
  }

  // ─── Stage 6: Recommendations ──────────────────────────────────────────────

  private generateRecommendations(
    checks: ValidationCheck[],
    risk: RiskAssessment,
    score: number,
  ): ValidationRecommendation[] {
    const recommendations: ValidationRecommendation[] = [];

    const failedErrors = checks.filter((c) => c.severity === "error" && !c.passed);
    for (const check of failedErrors) {
      recommendations.push({
        priority: "high",
        category: "Required Fix",
        suggestion: check.details ?? check.message,
        impact: "Blocks validation",
      });
    }

    const failedWarnings = checks.filter((c) => c.severity === "warning" && !c.passed);
    for (const check of failedWarnings) {
      recommendations.push({
        priority: "medium",
        category: "Improvement",
        suggestion: check.details ?? check.message,
        impact: "Improves decision quality",
      });
    }

    if (score < 0.5) {
      recommendations.push({
        priority: "high",
        category: "Quality",
        suggestion: "Overall quality score is low. Consider restructuring the decision with clearer options and more evidence.",
        impact: "Increases decision reliability",
      });
    }

    if (risk.level === "high" || risk.level === "critical") {
      recommendations.push({
        priority: "high",
        category: "Risk",
        suggestion: `High risk detected: ${risk.factors.join("; ")}. ${risk.mitigations.join("; ")}`,
        impact: "Reduces execution risk",
      });
    }

    return recommendations;
  }

  // ─── Summary Generation ────────────────────────────────────────────────────

  private generateSummary(
    valid: boolean,
    score: number,
    risk: RiskAssessment,
    checks: ValidationCheck[],
  ): string {
    const total = checks.length;
    const passed = checks.filter((c) => c.passed).length;
    const failed = checks.filter((c) => !c.passed).length;

    let summary = `Validation ${valid ? "PASSED" : "FAILED"}: ${passed}/${total} checks passed`;
    if (failed > 0) summary += `, ${failed} issues found`;
    summary += `. Score: ${(score * 100).toFixed(0)}/100, Risk: ${risk.level}`;

    return summary;
  }
}
