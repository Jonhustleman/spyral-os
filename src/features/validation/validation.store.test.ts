/**
 * ValidationStore — Engine tests
 *
 * Per ADR-0032, Validation compares expected vs observed.
 * Per ADR-0035, Validation produces Outcomes.
 *
 * Phase 1 (Highest Risk) — Deterministic behavior protecting the platform.
 */

import { ValidationStore } from "./validation.store";
import type { ValidationRun } from "@/kernel/contracts/ValidationRun";
import type { ValidationMetric } from "@/kernel/contracts/ValidationMetric";

// ─── Helpers ────────────────────────────────────────────────────────────

function makeRun(overrides: Partial<ValidationRun> = {}): ValidationRun {
  return {
    id: "test-run-1",
    executionPlanId: "plan-1",
    realitySnapshotBefore: "snap-before-1",
    realitySnapshotAfter: "snap-after-1",
    timestamp: "2026-07-20T10:00:00Z",
    validator: "test",
    status: "pending",
    metrics: [],
    result: undefined,
    createdAt: new Date("2026-07-20T10:00:00Z"),
    updatedAt: new Date("2026-07-20T10:00:00Z"),
    ...overrides,
  };
}

// ─── Variance ───────────────────────────────────────────────────────────

describe("createMetric() — variance computation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should mark positive delta as improved", () => {
    const metric = ValidationStore.createMetric("m1", 100, 150, 0.8);
    expect(metric.variance.direction).toBe("improved");
    expect(metric.variance.absolute).toBe(50);
    expect(metric.variance.percentage).toBe(50);
  });

  it("should mark negative delta as regressed", () => {
    const metric = ValidationStore.createMetric("m2", 100, 70, 0.8);
    expect(metric.variance.direction).toBe("regressed");
    expect(metric.variance.absolute).toBe(-30);
    expect(metric.variance.percentage).toBe(-30);
  });

  it("should mark zero delta as unchanged", () => {
    const metric = ValidationStore.createMetric("m3", 100, 100, 0.9);
    expect(metric.variance.direction).toBe("unchanged");
    expect(metric.variance.absolute).toBe(0);
    expect(metric.variance.percentage).toBe(0);
  });

  it("should handle zero expected value gracefully", () => {
    const metric = ValidationStore.createMetric("m4", 0, 5, 0.5);
    expect(metric.variance.percentage).toBe(0);
    expect(metric.variance.direction).toBe("improved");
  });

  it("should store expected, observed, and confidence", () => {
    const metric = ValidationStore.createMetric("m5", 200, 180, 0.75);
    expect(metric.metricId).toBe("m5");
    expect(metric.expectedValue).toBe(200);
    expect(metric.observedValue).toBe(180);
    expect(metric.confidence).toBe(0.75);
  });
});

// ─── Validation Run CRUD ───────────────────────────────────────────────

describe("ValidationStore — Run CRUD", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should create a validation run", () => {
    const run = ValidationStore.createRun({
      executionPlanId: "plan-1",
      realitySnapshotBefore: "before-1",
      realitySnapshotAfter: "after-1",
      timestamp: "2026-07-20T10:00:00Z",
      validator: "system",
      status: "in_progress",
      metrics: [],
      result: undefined,
    });
    expect(run.executionPlanId).toBe("plan-1");
    expect(run.status).toBe("in_progress");
    expect(run.id).toBeDefined();
    expect(run.createdAt).toBeInstanceOf(Date);
  });

  it("should retrieve runs by id", () => {
    const created = ValidationStore.createRun({
      executionPlanId: "plan-1",
      realitySnapshotBefore: "b1",
      realitySnapshotAfter: "a1",
      timestamp: "2026-07-20T10:00:00Z",
      validator: "system",
      status: "pending",
      metrics: [],
      result: undefined,
    });
    expect(ValidationStore.getRunById(created.id)).toBeDefined();
    expect(ValidationStore.getRunById("nonexistent")).toBeUndefined();
  });

  it("should retrieve runs by execution plan", () => {
    ValidationStore.createRun({
      executionPlanId: "plan-A",
      realitySnapshotBefore: "b1",
      realitySnapshotAfter: "a1",
      timestamp: "2026-07-20T10:00:00Z",
      validator: "system",
      status: "pending",
      metrics: [],
      result: undefined,
    });
    ValidationStore.createRun({
      executionPlanId: "plan-A",
      realitySnapshotBefore: "b2",
      realitySnapshotAfter: "a2",
      timestamp: "2026-07-20T11:00:00Z",
      validator: "system",
      status: "pending",
      metrics: [],
      result: undefined,
    });
    ValidationStore.createRun({
      executionPlanId: "plan-B",
      realitySnapshotBefore: "b3",
      realitySnapshotAfter: "a3",
      timestamp: "2026-07-20T12:00:00Z",
      validator: "system",
      status: "pending",
      metrics: [],
      result: undefined,
    });
    expect(ValidationStore.getRunsByPlan("plan-A")).toHaveLength(2);
    expect(ValidationStore.getRunsByPlan("plan-B")).toHaveLength(1);
  });

  it("should update a run", () => {
    const run = ValidationStore.createRun({
      executionPlanId: "plan-1",
      realitySnapshotBefore: "b1",
      realitySnapshotAfter: "a1",
      timestamp: "2026-07-20T10:00:00Z",
      validator: "system",
      status: "pending",
      metrics: [],
      result: undefined,
    });
    const updated = ValidationStore.updateRun(run.id, { status: "completed", result: "expected_met" });
    expect(updated!.status).toBe("completed");
    expect(updated!.result).toBe("expected_met");
  });

  it("should delete a run and cascade outcomes", () => {
    const run = ValidationStore.createRun({
      executionPlanId: "plan-1",
      realitySnapshotBefore: "b1",
      realitySnapshotAfter: "a1",
      timestamp: "2026-07-20T10:00:00Z",
      validator: "system",
      status: "pending",
      metrics: [],
      result: undefined,
    });
    // Complete it to create an outcome
    ValidationStore.completeRun(run.id);
    expect(ValidationStore.getOutcomes().length).toBe(1);
    ValidationStore.deleteRun(run.id);
    expect(ValidationStore.getRuns()).toHaveLength(0);
    expect(ValidationStore.getOutcomes()).toHaveLength(0);
  });
});

// ─── completeRun() — Outcome Logic ─────────────────────────────────────

describe("ValidationStore — completeRun() outcome determination", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns expected_met when all metrics improved", () => {
    const run = ValidationStore.createRun({
      executionPlanId: "plan-1",
      realitySnapshotBefore: "b1",
      realitySnapshotAfter: "a1",
      timestamp: "2026-07-20T10:00:00Z",
      validator: "test",
      status: "in_progress",
      metrics: [
        ValidationStore.createMetric("m1", 100, 150, 0.8),
        ValidationStore.createMetric("m2", 50, 80, 0.7),
      ],
      result: undefined,
    });
    const outcome = ValidationStore.completeRun(run.id);
    expect(outcome!.result).toBe("expected_met");
  });

  it("returns expected_met when all metrics unchanged", () => {
    const run = ValidationStore.createRun({
      executionPlanId: "plan-1",
      realitySnapshotBefore: "b1",
      realitySnapshotAfter: "a1",
      timestamp: "2026-07-20T10:00:00Z",
      validator: "test",
      status: "in_progress",
      metrics: [
        ValidationStore.createMetric("m1", 100, 100, 0.9),
        ValidationStore.createMetric("m2", 50, 50, 0.9),
      ],
      result: undefined,
    });
    const outcome = ValidationStore.completeRun(run.id);
    expect(outcome!.result).toBe("expected_met");
  });

  it("returns partial when mixed improved and regressed", () => {
    const run = ValidationStore.createRun({
      executionPlanId: "plan-1",
      realitySnapshotBefore: "b1",
      realitySnapshotAfter: "a1",
      timestamp: "2026-07-20T10:00:00Z",
      validator: "test",
      status: "in_progress",
      metrics: [
        ValidationStore.createMetric("m1", 100, 150, 0.8),  // improved
        ValidationStore.createMetric("m2", 50, 30, 0.8),   // regressed
      ],
      result: undefined,
    });
    const outcome = ValidationStore.completeRun(run.id);
    expect(outcome!.result).toBe("partial");
  });

  it("returns missed when all metrics regressed", () => {
    const run = ValidationStore.createRun({
      executionPlanId: "plan-1",
      realitySnapshotBefore: "b1",
      realitySnapshotAfter: "a1",
      timestamp: "2026-07-20T10:00:00Z",
      validator: "test",
      status: "in_progress",
      metrics: [
        ValidationStore.createMetric("m1", 100, 50, 0.8),
        ValidationStore.createMetric("m2", 50, 20, 0.7),
      ],
      result: undefined,
    });
    const outcome = ValidationStore.completeRun(run.id);
    expect(outcome!.result).toBe("missed");
  });

  it("returns inconclusive for empty metrics", () => {
    const run = ValidationStore.createRun({
      executionPlanId: "plan-1",
      realitySnapshotBefore: "b1",
      realitySnapshotAfter: "a1",
      timestamp: "2026-07-20T10:00:00Z",
      validator: "test",
      status: "in_progress",
      metrics: [],
      result: undefined,
    });
    const outcome = ValidationStore.completeRun(run.id);
    expect(outcome!.result).toBe("inconclusive");
  });

  it("updates the run status to completed", () => {
    const run = ValidationStore.createRun({
      executionPlanId: "plan-1",
      realitySnapshotBefore: "b1",
      realitySnapshotAfter: "a1",
      timestamp: "2026-07-20T10:00:00Z",
      validator: "test",
      status: "in_progress",
      metrics: [ValidationStore.createMetric("m1", 100, 150, 0.8)],
      result: undefined,
    });
    ValidationStore.completeRun(run.id);
    const updated = ValidationStore.getRunById(run.id);
    expect(updated!.status).toBe("completed");
  });

  it("returns undefined for unknown run", () => {
    expect(ValidationStore.completeRun("nonexistent")).toBeUndefined();
  });

  it("computes average confidence across metrics", () => {
    const run = ValidationStore.createRun({
      executionPlanId: "plan-1",
      realitySnapshotBefore: "b1",
      realitySnapshotAfter: "a1",
      timestamp: "2026-07-20T10:00:00Z",
      validator: "test",
      status: "in_progress",
      metrics: [
        ValidationStore.createMetric("m1", 100, 150, 0.9),
        ValidationStore.createMetric("m2", 50, 60, 0.7),
      ],
      result: undefined,
    });
    const outcome = ValidationStore.completeRun(run.id);
    expect(outcome!.confidence.value).toBe(0.8); // (0.9 + 0.7) / 2
  });
});

// ─── Outcome CRUD ──────────────────────────────────────────────────────

describe("ValidationStore — Outcome CRUD", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should create an outcome", () => {
    const outcome = ValidationStore.createOutcome({
      decisionId: "decision-1",
      validationRunId: "run-1",
      result: "expected_met",
      variances: [],
      confidence: { value: 0.85, label: "High", rationale: "Test" },
      summary: "All metrics improved",
      insights: ["Insight 1"],
    });
    expect(outcome.decisionId).toBe("decision-1");
    expect(outcome.result).toBe("expected_met");
  });

  it("should retrieve outcomes by decision", () => {
    ValidationStore.createOutcome({
      decisionId: "d1", validationRunId: "r1", result: "expected_met",
      variances: [], confidence: { value: 0.8, label: "High", rationale: "Test" },
      insights: [],
    });
    ValidationStore.createOutcome({
      decisionId: "d1", validationRunId: "r2", result: "partial",
      variances: [], confidence: { value: 0.6, label: "Medium", rationale: "Test" },
      insights: [],
    });
    ValidationStore.createOutcome({
      decisionId: "d2", validationRunId: "r3", result: "missed",
      variances: [], confidence: { value: 0.3, label: "Low", rationale: "Test" },
      insights: [],
    });
    expect(ValidationStore.getOutcomesByDecision("d1")).toHaveLength(2);
    expect(ValidationStore.getOutcomesByDecision("d2")).toHaveLength(1);
  });

  it("should delete an outcome", () => {
    const o = ValidationStore.createOutcome({
      decisionId: "d1", validationRunId: "r1", result: "expected_met",
      variances: [], confidence: { value: 0.8, label: "High", rationale: "Test" },
      insights: [],
    });
    expect(ValidationStore.getOutcomes()).toHaveLength(1);
    ValidationStore.deleteOutcome(o.id);
    expect(ValidationStore.getOutcomes()).toHaveLength(0);
  });
});

// ─── Trend and Confidence History ──────────────────────────────────────

describe("ValidationStore — trend and confidence history", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("getTrend returns chronological outcome summaries", () => {
    const createOutcome = (decisionId: string, result: string, confidence: number) => {
      ValidationStore.createOutcome({
        decisionId,
        validationRunId: `run-${Date.now()}`,
        result: result as any,
        variances: [],
        confidence: { value: confidence, label: "Test", rationale: "Test" },
        insights: [],
      });
    };

    createOutcome("d1", "expected_met", 0.9);
    createOutcome("d1", "partial", 0.6);
    createOutcome("d1", "expected_met", 0.85);

    const trend = ValidationStore.getTrend("d1");
    expect(trend).toHaveLength(3);
    expect(trend[0].result).toBe("expected_met");
    expect(trend[2].confidence).toBe(0.85);
  });

  it("getConfidenceHistory returns chronological confidence values", () => {
    ValidationStore.createOutcome({
      decisionId: "d1", validationRunId: "r1", result: "expected_met",
      variances: [], confidence: { value: 0.7, label: "Medium", rationale: "Test" },
      insights: [],
    });
    ValidationStore.createOutcome({
      decisionId: "d1", validationRunId: "r2", result: "expected_met",
      variances: [], confidence: { value: 0.85, label: "High", rationale: "Test" },
      insights: [],
    });

    const history = ValidationStore.getConfidenceHistory("d1");
    expect(history).toHaveLength(2);
    expect(history[1].confidence).toBe(0.85);
  });

  it("returns empty arrays for unknown decision", () => {
    expect(ValidationStore.getTrend("unknown")).toEqual([]);
    expect(ValidationStore.getConfidenceHistory("unknown")).toEqual([]);
  });
});
