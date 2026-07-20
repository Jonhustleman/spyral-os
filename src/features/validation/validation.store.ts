/**
 * ValidationStore — localStorage-persisted CRUD for validation data.
 *
 * Manages ValidationRuns and Outcomes.
 * Per ADR-0032, Validation compares expected vs observed and produces Outcomes.
 * Per ADR-0035, Validation does not learn — it produces Outcomes for the Learning Engine.
 */

"use client";

import type { ValidationRun, ValidationStatus } from "@/kernel/contracts/ValidationRun";
import type { ValidationMetric } from "@/kernel/contracts/ValidationMetric";
import type { Outcome, OutcomeResult } from "@/kernel/contracts/Outcome";
import type { Variance, VarianceDirection } from "@/kernel/contracts/Variance";
import type { ConfidenceScore } from "@/kernel/contracts/ConfidenceScore";
import { createVariance } from "@/kernel/contracts/Variance";

const STORAGE_KEY_RUNS = "spyral_validation_runs";
const STORAGE_KEY_OUTCOMES = "spyral_validation_outcomes";

// ─── Helpers ────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function now(): Date {
  return new Date();
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Subscriber pattern ─────────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

// ─── Store ──────────────────────────────────────────────────────────────

export const ValidationStore = {
  // ── Subscribe ────────────────────────────────────────────────────────

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // ── Validation Runs ──────────────────────────────────────────────────

  getRuns(): ValidationRun[] {
    return load<ValidationRun[]>(STORAGE_KEY_RUNS, []);
  },

  getRunById(id: string): ValidationRun | undefined {
    return this.getRuns().find((r) => r.id === id);
  },

  getRunsByPlan(executionPlanId: string): ValidationRun[] {
    return this.getRuns().filter((r) => r.executionPlanId === executionPlanId);
  },

  createRun(run: Omit<ValidationRun, "id" | "createdAt" | "updatedAt">): ValidationRun {
    const all = this.getRuns();
    const newRun: ValidationRun = {
      ...run,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    all.push(newRun);
    save(STORAGE_KEY_RUNS, all);
    notify();
    return newRun;
  },

  updateRun(id: string, updates: Partial<Omit<ValidationRun, "id" | "createdAt" | "executionPlanId" | "realitySnapshotBefore" | "realitySnapshotAfter" | "timestamp">>): ValidationRun | undefined {
    const all = this.getRuns();
    const idx = all.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...updates, updatedAt: now() };
    save(STORAGE_KEY_RUNS, all);
    notify();
    return all[idx];
  },

  deleteRun(id: string): void {
    const all = this.getRuns().filter((r) => r.id !== id);
    save(STORAGE_KEY_RUNS, all);
    // Cascade delete outcomes
    const outcomes = this.getOutcomes().filter((o) => o.validationRunId !== id);
    save(STORAGE_KEY_OUTCOMES, outcomes);
    notify();
  },

  /**
   * Complete a validation run: set status to completed, compute result,
   * and auto-generate an Outcome.
   */
  completeRun(id: string): Outcome | undefined {
    const run = this.getRunById(id);
    if (!run) return undefined;

    // Determine overall result
    let result: OutcomeResult;
    if (run.metrics.length === 0) {
      result = "inconclusive";
    } else {
      const allImproved = run.metrics.every((m) => m.variance.direction === "improved");
      const allUnchanged = run.metrics.every((m) => m.variance.direction === "unchanged");
      const allRegressed = run.metrics.every((m) => m.variance.direction === "regressed");
      const anyRegressed = run.metrics.some((m) => m.variance.direction === "regressed");

      if (allImproved || allUnchanged) {
        result = "expected_met";
      } else if (anyRegressed && !allRegressed) {
        result = "partial";
      } else if (allRegressed) {
        result = "missed";
      } else {
        result = "inconclusive";
      }
    }

    // Update the run
    this.updateRun(id, { status: "completed", result });

    // Auto-generate outcome
    const avgConfidence = run.metrics.length > 0
      ? run.metrics.reduce((sum, m) => sum + m.confidence, 0) / run.metrics.length
      : 0;

    return this.createOutcome({
      decisionId: run.executionPlanId,
      validationRunId: id,
      result,
      variances: run.metrics.map((m) => m.variance),
      confidence: {
        value: avgConfidence,
        label: "Validation",
        rationale: `Average confidence across ${run.metrics.length} metrics`,
      },
      summary: `Validation ${id}: ${result.replace("_", " ")}`,
      insights: [],
    });
  },

  // ── Outcomes ─────────────────────────────────────────────────────────

  getOutcomes(): Outcome[] {
    return load<Outcome[]>(STORAGE_KEY_OUTCOMES, []);
  },

  getOutcomeById(id: string): Outcome | undefined {
    return this.getOutcomes().find((o) => o.id === id);
  },

  getOutcomesByDecision(decisionId: string): Outcome[] {
    return this.getOutcomes().filter((o) => o.decisionId === decisionId);
  },

  createOutcome(outcome: Omit<Outcome, "id" | "createdAt" | "updatedAt">): Outcome {
    const all = this.getOutcomes();
    const newOutcome: Outcome = {
      ...outcome,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    all.push(newOutcome);
    save(STORAGE_KEY_OUTCOMES, all);
    notify();
    return newOutcome;
  },

  deleteOutcome(id: string): void {
    const all = this.getOutcomes().filter((o) => o.id !== id);
    save(STORAGE_KEY_OUTCOMES, all);
    notify();
  },

  // ── Helpers ──────────────────────────────────────────────────────────

  /**
   * Create a metric with auto-computed variance.
   */
  createMetric(metricId: string, expected: number, observed: number, confidence: number): ValidationMetric {
    return {
      metricId,
      expectedValue: expected,
      observedValue: observed,
      variance: createVariance(expected, observed),
      confidence,
    };
  },

  /**
   * Get trend data: outcomes over time for a decision.
   */
  getTrend(decisionId: string) {
    const outcomes = this.getOutcomesByDecision(decisionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return outcomes.map((o) => ({
      date: o.createdAt,
      result: o.result,
      confidence: o.confidence.value,
      summary: o.summary,
    }));
  },

  /**
   * Get confidence evolution for a decision.
   */
  getConfidenceHistory(decisionId: string) {
    const outcomes = this.getOutcomesByDecision(decisionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return outcomes.map((o) => ({
      date: o.createdAt,
      confidence: o.confidence.value,
      label: o.confidence.label,
    }));
  },
};

// Export types
export type { ValidationRun, ValidationMetric, Outcome, Variance, ConfidenceScore };
