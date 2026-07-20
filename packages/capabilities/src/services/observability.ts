/**
 * Observability — Request-scoped tracing and metrics for SPYRAL OS workflows.
 *
 * Phase C.1.5 — Observability
 *
 * Every workflow gets:
 *   - Request ID
 *   - Session ID
 *   - Workspace ID
 *   - Duration
 *   - Outcome
 *   - Validation score
 *
 * Usage:
 *   const obsv = new ObservabilityContext({ requestId, sessionId, workspaceId });
 *   const result = await obsv.track("createDecision", async () => {
 *     // ... workflow logic
 *     return { success: true };
 *   });
 *   console.log(obsv.getReport());
 */

import { randomUUID } from "node:crypto";

export interface ObservabilityOptions {
  requestId?: string;
  sessionId?: string;
  workspaceId?: string;
  serviceName?: string;
}

export interface TraceStep {
  name: string;
  status: "started" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  duration?: number; // ms
  error?: string;
}

export interface ObservabilityReport {
  requestId: string;
  sessionId?: string;
  workspaceId?: string;
  serviceName: string;
  startedAt: string;
  completedAt?: string;
  totalDuration?: number;
  steps: TraceStep[];
  outcome?: string;
  validationScore?: number;
  events: Array<{ eventName: string; timestamp: string }>;
}

export class ObservabilityContext {
  readonly requestId: string;
  readonly sessionId?: string;
  readonly workspaceId?: string;
  readonly serviceName: string;
  readonly startedAt: string;
  private steps: TraceStep[] = [];
  private events: Array<{ eventName: string; timestamp: string }> = [];
  private outcome?: string;
  private validationScore?: number;
  private completedAt?: string;

  constructor(options: ObservabilityOptions = {}) {
    this.requestId = options.requestId ?? randomUUID();
    this.sessionId = options.sessionId;
    this.workspaceId = options.workspaceId;
    this.serviceName = options.serviceName ?? "spyral";
    this.startedAt = new Date().toISOString();
  }

  /**
   * Track a workflow step — measures duration and captures result.
   */
  async track<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const step: TraceStep = {
      name,
      status: "started",
      startedAt: new Date().toISOString(),
    };
    this.steps.push(step);

    try {
      const result = await fn();
      step.status = "completed";
      step.completedAt = new Date().toISOString();
      step.duration = new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime();
      return result;
    } catch (err) {
      step.status = "failed";
      step.completedAt = new Date().toISOString();
      step.duration = new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime();
      step.error = err instanceof Error ? err.message : String(err);
      throw err;
    }
  }

  /**
   * Record an emitted event.
   */
  recordEvent(eventName: string): void {
    this.events.push({ eventName, timestamp: new Date().toISOString() });
  }

  /**
   * Set the final outcome of the workflow.
   */
  setOutcome(outcome: string): void {
    this.outcome = outcome;
  }

  /**
   * Set the validation score result.
   */
  setValidationScore(score: number): void {
    this.validationScore = score;
  }

  /**
   * Generate the full observability report.
   */
  getReport(): ObservabilityReport {
    this.completedAt = new Date().toISOString();
    return {
      requestId: this.requestId,
      sessionId: this.sessionId,
      workspaceId: this.workspaceId,
      serviceName: this.serviceName,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      totalDuration: new Date(this.completedAt).getTime() - new Date(this.startedAt).getTime(),
      steps: [...this.steps],
      outcome: this.outcome,
      validationScore: this.validationScore,
      events: [...this.events],
    };
  }
}
