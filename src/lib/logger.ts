/**
 * SPYRAL OS — Structured Event Logger
 *
 * Introduces structured logging events for the full operating cycle.
 * Per ChatGPT's engineering guidance, every deterministic action
 * should emit a structured event for debugging, analytics, and AI.
 *
 * Events:
 * NavigationStarted, IntentCaptured, ClarificationAnswered,
 * RealityEstablished, GapCalculated, DecisionChosen,
 * ExecutionStarted, JourneyCompleted
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("NavigationStarted", { prompt: "Grow revenue" });
 */

"use client";

// ─── Event types ────────────────────────────────────────────────────────

export type SpyralEvent =
  // Navigation
  | "NavigationStarted"
  | "IntentCaptured"
  | "ClarificationAnswered"
  | "RealityEstablished"
  | "GapCalculated"
  | "DecisionChosen"
  | "ExecutionStarted"
  | "JourneyCompleted"
  // Learning
  | "PatternDiscovered"
  | "InsightGenerated"
  | "RecommendationCreated"
  // Validation
  | "ValidationRunStarted"
  | "ValidationCompleted"
  | "OutcomeRecorded"
  // System
  | "StorageUpdated"
  | "CapabilityRegistered"
  | "WorkspaceCreated"
  | "SessionResumed"
  // Error
  | "ErrorCaught";

// ─── Log entry ──────────────────────────────────────────────────────────

export interface LogEntry {
  /** The event name. */
  event: SpyralEvent;

  /** When the event occurred. */
  timestamp: string;

  /** Arbitrary structured metadata. */
  data?: Record<string, unknown>;
}

// ─── Logger ─────────────────────────────────────────────────────────────

const MAX_LOG_ENTRIES = 1000;
const STORAGE_KEY = "spyral_event_log";

function loadLog(): LogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLog(entries: LogEntry[]): void {
  if (typeof window === "undefined") return;
  // Trim to max entries to avoid unbounded storage growth
  const trimmed = entries.slice(-MAX_LOG_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/**
 * Structured event logger.
 * Emits events to localStorage for debugging and analytics.
 */
export const logger = {
  /**
   * Log a structured event.
   */
  info(event: SpyralEvent, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const log = loadLog();
    log.push(entry);
    saveLog(log);

    // Also emit to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[SPYRAL] ${event}`, data ?? "");
    }
  },

  /**
   * Log an error event.
   * Errors are always logged to console.error in addition to localStorage.
   */
  error(context: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      event: "ErrorCaught",
      timestamp: new Date().toISOString(),
      data: { context, ...data },
    };

    const log = loadLog();
    log.push(entry);
    saveLog(log);

    console.error(`[SPYRAL] Error in ${context}:`, data?.message ?? "");
  },

  /**
   * Get all log entries.
   */
  getAll(): LogEntry[] {
    return loadLog();
  },

  /**
   * Get log entries filtered by event type.
   */
  getByEvent(event: SpyralEvent): LogEntry[] {
    return loadLog().filter((e) => e.event === event);
  },

  /**
   * Get log entries within a date range.
   */
  getSince(since: Date): LogEntry[] {
    return loadLog().filter((e) => new Date(e.timestamp) >= since);
  },

  /**
   * Clear all log entries.
   */
  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Get log stats.
   */
  stats(): { total: number; byEvent: Record<string, number> } {
    const log = loadLog();
    const byEvent: Record<string, number> = {};
    for (const entry of log) {
      byEvent[entry.event] = (byEvent[entry.event] || 0) + 1;
    }
    return { total: log.length, byEvent };
  },
};
