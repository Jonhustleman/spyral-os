/**
 * SPYRAL OS — Reality Store
 *
 * CRUD operations for Reality data with localStorage persistence.
 * Manages snapshots, metrics, goals, gaps, evidence, and constraints.
 */

import type { RealitySnapshot, RealityConstraint, RealityEvidence } from "@/kernel/contracts/RealitySnapshot";
import type { RealityMetric } from "@/kernel/contracts/RealityMetric";
import type { RealityGoal } from "@/kernel/contracts/RealityGoal";
import type { RealityGap } from "@/kernel/contracts/RealityGap";

const STORAGE_PREFIX = "spyral_reality_";

// ─── ID generation ─────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Store ─────────────────────────────────────────────────────────────────

class RealityStoreImpl {
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  // ── Snapshots ─────────────────────────────────────────────────────────

  private snapshotKey(workspaceId: string): string {
    return `${STORAGE_PREFIX}snapshot_${workspaceId}`;
  }

  getSnapshot(workspaceId: string): RealitySnapshot | null {
    try {
      const raw = localStorage.getItem(this.snapshotKey(workspaceId));
      if (!raw) return null;
      return JSON.parse(raw) as RealitySnapshot;
    } catch {
      return null;
    }
  }

  saveSnapshot(snapshot: RealitySnapshot): void {
    try {
      localStorage.setItem(this.snapshotKey(snapshot.workspaceId), JSON.stringify(snapshot));
      this.notify();
    } catch (e) {
      console.error("Failed to persist reality snapshot:", e);
    }
  }

  /**
   * Create a new empty snapshot for a workspace if one doesn't exist.
   */
  ensureSnapshot(workspaceId: string): RealitySnapshot {
    const existing = this.getSnapshot(workspaceId);
    if (existing) return existing;

    const now = new Date();
    const snapshot: RealitySnapshot = {
      id: generateId(),
      workspaceId,
      metrics: [],
      goals: [],
      gaps: [],
      assumptions: [],
      constraints: [],
      evidence: [],
      createdAt: now,
      updatedAt: now,
    };

    this.saveSnapshot(snapshot);
    return snapshot;
  }

  // ── Metrics ────────────────────────────────────────────────────────────

  addMetric(workspaceId: string, metric: Omit<RealityMetric, "id" | "createdAt" | "updatedAt">): RealityMetric | null {
    const snapshot = this.getSnapshot(workspaceId);
    if (!snapshot) return null;

    const now = new Date();
    const newMetric: RealityMetric = {
      ...metric,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    snapshot.metrics.push(newMetric);
    snapshot.updatedAt = now;
    this.saveSnapshot(snapshot);
    return newMetric;
  }

  updateMetric(workspaceId: string, metricId: string, changes: Partial<RealityMetric>): boolean {
    const snapshot = this.getSnapshot(workspaceId);
    if (!snapshot) return false;

    const index = snapshot.metrics.findIndex((m) => m.id === metricId);
    if (index === -1) return false;

    snapshot.metrics[index] = { ...snapshot.metrics[index], ...changes, updatedAt: new Date() };
    snapshot.updatedAt = new Date();
    this.saveSnapshot(snapshot);
    return true;
  }

  deleteMetric(workspaceId: string, metricId: string): boolean {
    const snapshot = this.getSnapshot(workspaceId);
    if (!snapshot) return false;

    const index = snapshot.metrics.findIndex((m) => m.id === metricId);
    if (index === -1) return false;

    snapshot.metrics.splice(index, 1);
    snapshot.updatedAt = new Date();
    this.saveSnapshot(snapshot);
    return true;
  }

  // ── Goals ──────────────────────────────────────────────────────────────

  setGoal(workspaceId: string, goal: Omit<RealityGoal, "id" | "createdAt" | "updatedAt">): RealityGoal | null {
    const snapshot = this.getSnapshot(workspaceId);
    if (!snapshot) return null;

    const now = new Date();
    const newGoal: RealityGoal = {
      ...goal,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    // If this goal is primary, unset others
    if (newGoal.isPrimary) {
      snapshot.goals.forEach((g) => (g.isPrimary = false));
    }

    snapshot.goals.push(newGoal);
    snapshot.updatedAt = now;
    this.saveSnapshot(snapshot);
    return newGoal;
  }

  updateGoal(workspaceId: string, goalId: string, changes: Partial<RealityGoal>): boolean {
    const snapshot = this.getSnapshot(workspaceId);
    if (!snapshot) return false;

    const index = snapshot.goals.findIndex((g) => g.id === goalId);
    if (index === -1) return false;

    // If setting as primary, unset others
    if (changes.isPrimary) {
      snapshot.goals.forEach((g) => (g.isPrimary = false));
    }

    snapshot.goals[index] = { ...snapshot.goals[index], ...changes, updatedAt: new Date() };
    snapshot.updatedAt = new Date();
    this.saveSnapshot(snapshot);
    return true;
  }

  deleteGoal(workspaceId: string, goalId: string): boolean {
    const snapshot = this.getSnapshot(workspaceId);
    if (!snapshot) return false;

    const index = snapshot.goals.findIndex((g) => g.id === goalId);
    if (index === -1) return false;

    snapshot.goals.splice(index, 1);
    snapshot.updatedAt = new Date();
    this.saveSnapshot(snapshot);
    return true;
  }

  // ── Gaps (calculated) ─────────────────────────────────────────────────

  /**
   * Calculate gaps between current metrics and target goal.
   * Returns an array of calculated gaps.
   */
  calculateGaps(workspaceId: string): RealityGap[] {
    const snapshot = this.getSnapshot(workspaceId);
    if (!snapshot) return [];

    const primaryGoal = snapshot.goals.find((g) => g.isPrimary);
    if (!primaryGoal) return [];

    const gaps: RealityGap[] = [];
    const now = new Date();

    for (const target of primaryGoal.targetMetrics) {
      // Find the matching current metric
      const currentMetric = snapshot.metrics.find((m) => m.name === target.name);
      const currentValue = currentMetric?.value ?? 0;
      const diff = target.targetValue - currentValue;
      const percent = target.targetValue !== 0 ? (currentValue / target.targetValue) * 100 : 0;

      // Determine severity
      const absPercent = Math.abs(percent);
      let severity: "critical" | "significant" | "moderate" | "minor" = "moderate";
      if (absPercent < 25) severity = "critical";
      else if (absPercent < 50) severity = "significant";
      else if (absPercent < 80) severity = "moderate";
      else severity = "minor";

      gaps.push({
        id: generateId(),
        workspaceId,
        goalId: primaryGoal.id,
        title: `Gap: ${target.name}`,
        description: currentMetric
          ? `Current ${currentValue}${target.unit ?? ""} vs target ${target.targetValue}${target.unit ?? ""}`
          : `No data for ${target.name}. Target is ${target.targetValue}${target.unit ?? ""}`,
        severity,
        currentValue,
        targetValue: target.targetValue,
        absoluteGap: diff,
        percentComplete: Math.round(percent * 100) / 100,
        unit: target.unit,
        tags: [],
        createdAt: now,
        updatedAt: now,
      });
    }

    // Persist calculated gaps
    snapshot.gaps = gaps;
    snapshot.updatedAt = now;
    this.saveSnapshot(snapshot);

    return gaps;
  }

  // ── Evidence ───────────────────────────────────────────────────────────

  addEvidence(workspaceId: string, evidence: Omit<RealityEvidence, "id">): boolean {
    const snapshot = this.getSnapshot(workspaceId);
    if (!snapshot) return false;

    snapshot.evidence.push({ ...evidence, id: generateId() });
    snapshot.updatedAt = new Date();
    this.saveSnapshot(snapshot);
    return true;
  }

  deleteEvidence(workspaceId: string, evidenceId: string): boolean {
    const snapshot = this.getSnapshot(workspaceId);
    if (!snapshot) return false;

    const index = snapshot.evidence.findIndex((e) => e.id === evidenceId);
    if (index === -1) return false;

    snapshot.evidence.splice(index, 1);
    snapshot.updatedAt = new Date();
    this.saveSnapshot(snapshot);
    return true;
  }

  // ── Constraints ────────────────────────────────────────────────────────

  addConstraint(workspaceId: string, constraint: RealityConstraint): boolean {
    const snapshot = this.getSnapshot(workspaceId);
    if (!snapshot) return false;

    snapshot.constraints.push(constraint);
    snapshot.updatedAt = new Date();
    this.saveSnapshot(snapshot);
    return true;
  }

  removeConstraint(workspaceId: string, index: number): boolean {
    const snapshot = this.getSnapshot(workspaceId);
    if (!snapshot || index < 0 || index >= snapshot.constraints.length) return false;

    snapshot.constraints.splice(index, 1);
    snapshot.updatedAt = new Date();
    this.saveSnapshot(snapshot);
    return true;
  }

  // ── Report Data (frontend Reality Report) ─────────────────────────────

  private reportKey(workspaceId: string): string {
    return `${STORAGE_PREFIX}report_${workspaceId}`;
  }

  /** Save a reality report for a workspace. */
  saveReport(workspaceId: string, reportData: Record<string, unknown>): void {
    try {
      localStorage.setItem(this.reportKey(workspaceId), JSON.stringify(reportData));
      this.notify();
    } catch (e) {
      console.error("Failed to persist reality report:", e);
    }
  }

  /** Get the reality report for a workspace, or null. */
  getReport(workspaceId: string): Record<string, unknown> | null {
    try {
      const raw = localStorage.getItem(this.reportKey(workspaceId));
      if (!raw) return null;
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  /** Check if a workspace has a completed report. */
  hasReport(workspaceId: string): boolean {
    return this.getReport(workspaceId) !== null;
  }

  /** Delete the report for a workspace. */
  deleteReport(workspaceId: string): void {
    try {
      localStorage.removeItem(this.reportKey(workspaceId));
      this.notify();
    } catch { /* ignore */ }
  }
}

/** Singleton store instance. */
export const RealityStore = new RealityStoreImpl();
