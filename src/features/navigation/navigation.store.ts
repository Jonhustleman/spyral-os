/**
 * NavigationStore — localStorage-persisted CRUD for navigation sessions.
 *
 * Per ADR-0047, Navigation is conversational and stateful.
 * Per ADR-0048, NavigationSession is a product contract (user journey).
 *
 * The Orchestrator is a state machine, not a router.
 * Methods: next(), canProceed(), missingInformation(), transition()
 */

"use client";

import type { NavigationSession, NavigationSessionStatus } from "@/kernel/contracts/NavigationSession";
import type { NavigationContext, ConversationTurn } from "@/kernel/contracts/NavigationContext";
import { NavigationStage } from "@/kernel/contracts/NavigationStage";

const STORAGE_KEY_SESSIONS = "spyral_navigation_sessions";

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

// ─── Default context ────────────────────────────────────────────────────

function emptyContext(): NavigationContext {
  return {
    intent: "",
    targetDate: undefined,
    currentRealityKnown: false,
    goalDefined: false,
    constraints: [],
    successMetric: undefined,
  };
}

// ─── Orchestrator (state machine) ───────────────────────────────────────

/**
 * Determine the next stage based on current session state.
 * Per ADR-0047, this is progressive disclosure.
 */
function determineNextStage(session: NavigationSession): NavigationStage {
  const ctx = session.context;

  switch (session.stage) {
    case NavigationStage.INTENT:
      // Intent expressed, needs clarification
      return NavigationStage.CLARIFICATION;

    case NavigationStage.CLARIFICATION:
      // After clarification, if reality is needed
      if (!ctx.currentRealityKnown) {
        return NavigationStage.REALITY;
      }
      if (!ctx.goalDefined) {
        return NavigationStage.GAP;
      }
      return NavigationStage.DECISION;

    case NavigationStage.REALITY:
      // After reality assessment, check gap
      if (!ctx.goalDefined) {
        return NavigationStage.GAP;
      }
      return NavigationStage.DECISION;

    case NavigationStage.GAP:
      return NavigationStage.DECISION;

    case NavigationStage.DECISION:
      return NavigationStage.EXECUTION;

    case NavigationStage.EXECUTION:
      return NavigationStage.COMPLETE;

    case NavigationStage.COMPLETE:
      return NavigationStage.COMPLETE;

    default:
      return NavigationStage.CLARIFICATION;
  }
}

/**
 * Check if we have enough information to proceed to the next stage.
 */
function canProceedFromStage(stage: NavigationStage, context: NavigationContext): boolean {
  switch (stage) {
    case NavigationStage.INTENT:
      return context.intent.length > 0;

    case NavigationStage.CLARIFICATION:
      // Need at least destination, timeline, and constraints
      return context.intent.length > 0 && !!context.targetDate;

    case NavigationStage.REALITY:
      return context.currentRealityKnown;

    case NavigationStage.GAP:
      return context.goalDefined;

    case NavigationStage.DECISION:
      return context.goalDefined && context.currentRealityKnown;

    case NavigationStage.EXECUTION:
      return true; // Decision has been made

    case NavigationStage.COMPLETE:
      return true;

    default:
      return false;
  }
}

/**
 * Determine what information is missing for the current stage.
 * Returns a clarifying question or null if enough info.
 */
function missingInformation(session: NavigationSession): string | null {
  const ctx = session.context;

  switch (session.stage) {
    case NavigationStage.INTENT:
      if (!ctx.intent) return "Where do you want to go today—in reality?";
      return null;

    case NavigationStage.CLARIFICATION:
      if (!ctx.intent) return "What do you want to achieve?";
      if (!ctx.targetDate) return "What's your target date for achieving this?";
      return null;

    case NavigationStage.REALITY:
      return "We need your current reality assessment before we can proceed.";

    case NavigationStage.GAP:
      return "We need to define the gap between current reality and your goal.";

    case NavigationStage.DECISION:
      return null; // Decision Studio handles its own questions

    case NavigationStage.EXECUTION:
      return null; // Execution Studio handles its own questions

    case NavigationStage.COMPLETE:
      return null;

    default:
      return null;
  }
}

/**
 * Compute the next question to ask the user based on current state.
 */
function nextQuestion(session: NavigationSession): string | null {
  if (canProceedFromStage(session.stage, session.context)) {
    return null; // Can proceed to next stage
  }
  return missingInformation(session);
}

// ─── Store ──────────────────────────────────────────────────────────────

export const NavigationStore = {
  // ── Subscribe ────────────────────────────────────────────────────────

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // ── Sessions ─────────────────────────────────────────────────────────

  getAll(): NavigationSession[] {
    return load<NavigationSession[]>(STORAGE_KEY_SESSIONS, []);
  },

  getById(id: string): NavigationSession | undefined {
    return this.getAll().find((s) => s.id === id);
  },

  /**
   * Create a new navigation session from a user prompt.
   */
  createFromPrompt(prompt: string, workspaceId: string = "default"): NavigationSession {
    const all = this.getAll();
    const session: NavigationSession = {
      id: generateId(),
      workspaceId,
      prompt,
      stage: NavigationStage.INTENT,
      status: "ACTIVE",
      context: {
        ...emptyContext(),
        intent: prompt,
      },
      history: [
        {
          role: "user",
          message: prompt,
          timestamp: now(),
        },
      ],
      currentWorkspaceId: workspaceId,
      currentCapabilityId: "navigation",
      createdAt: now(),
      updatedAt: now(),
    };
    all.push(session);
    save(STORAGE_KEY_SESSIONS, all);
    notify();
    return session;
  },

  /**
   * Update a session's stage and context.
   */
  updateStage(id: string, stage: NavigationStage, contextUpdate?: Partial<NavigationContext>): NavigationSession | undefined {
    const all = this.getAll();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;

    all[idx] = {
      ...all[idx],
      stage,
      context: contextUpdate ? { ...all[idx].context, ...contextUpdate } : all[idx].context,
      updatedAt: now(),
    };
    save(STORAGE_KEY_SESSIONS, all);
    notify();
    return all[idx];
  },

  /**
   * Update session status (ACTIVE | PAUSED | COMPLETED | ABANDONED).
   */
  updateStatus(id: string, status: NavigationSessionStatus): NavigationSession | undefined {
    const all = this.getAll();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;

    all[idx] = { ...all[idx], status, updatedAt: now() };
    save(STORAGE_KEY_SESSIONS, all);
    notify();
    return all[idx];
  },

  /**
   * Add a conversation turn to the session history.
   */
  addTurn(id: string, turn: ConversationTurn): NavigationSession | undefined {
    const all = this.getAll();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;

    all[idx] = {
      ...all[idx],
      history: [...all[idx].history, turn],
      updatedAt: now(),
    };
    save(STORAGE_KEY_SESSIONS, all);
    notify();
    return all[idx];
  },

  /**
   * Update context fields.
   */
  updateContext(id: string, contextUpdate: Partial<NavigationContext>): NavigationSession | undefined {
    const all = this.getAll();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;

    all[idx] = {
      ...all[idx],
      context: { ...all[idx].context, ...contextUpdate },
      updatedAt: now(),
    };
    save(STORAGE_KEY_SESSIONS, all);
    notify();
    return all[idx];
  },

  deleteSession(id: string): void {
    const all = this.getAll().filter((s) => s.id !== id);
    save(STORAGE_KEY_SESSIONS, all);
    notify();
  },

  // ── Orchestrator (state machine) ─────────────────────────────────────

  /**
   * Determine the next stage based on current session state.
   */
  next(session: NavigationSession): NavigationStage {
    return determineNextStage(session);
  },

  /**
   * Check if we can proceed from the current stage.
   */
  canProceed(session: NavigationSession): boolean {
    return canProceedFromStage(session.stage, session.context);
  },

  /**
   * Get the missing information / next question for the current stage.
   */
  missingInformation(session: NavigationSession): string | null {
    return missingInformation(session);
  },

  /**
   * Get the next question to ask the user.
   */
  nextQuestion(session: NavigationSession): string | null {
    return nextQuestion(session);
  },

  /**
   * Transition the session to the next appropriate stage.
   * Returns the updated session.
   */
  transition(id: string): NavigationSession | undefined {
    const session = this.getById(id);
    if (!session) return undefined;

    const nextStage = this.next(session);
    if (nextStage !== session.stage) {
      return this.updateStage(id, nextStage);
    }
    return session;
  },

  // ── Query helpers ────────────────────────────────────────────────────

  /**
   * Get active sessions (ACTIVE or PAUSED).
   * Per ADR-0048, "Continue Journey" queries WHERE status == ACTIVE.
   */
  getActiveSessions(): NavigationSession[] {
    return this.getAll().filter((s) => s.status === "ACTIVE" || s.status === "PAUSED");
  },

  /**
   * Get recent destinations from COMPLETED sessions.
   * Per ADR-0048, derive from completed sessions (single source of truth).
   */
  getRecentDestinations(limit: number = 5): NavigationSession[] {
    return this.getAll()
      .filter((s) => s.status === "COMPLETED")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  },

  /**
   * Get the total number of sessions.
   */
  getSessionCount(): number {
    return this.getAll().length;
  },
};
