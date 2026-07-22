/**
 * ExperienceRecorder — Interaction Metadata Logger
 *
 * Records every user interaction with SPYRAL as structured events.
 * Stores ONLY interaction metadata — NEVER private conversation content.
 *
 * Events: Session Started/Ended, Project Created, Research Started/Completed,
 * Content Generated, Provider Opened, Navigation Completed, Consultant Completed,
 * Reality Cycle Completed, Feedback Submitted, Prediction Resolved.
 *
 * Architecture supports future database sync (currently localStorage).
 */

"use client";

// ─── Types ─────────────────────────────────────────────────────────────

export type ExperienceEventType =
  | "session_started"
  | "session_ended"
  | "project_created"
  | "research_started"
  | "research_completed"
  | "content_generated"
  | "provider_opened"
  | "navigation_completed"
  | "consultant_completed"
  | "reality_cycle_completed"
  | "feedback_submitted"
  | "prediction_resolved"
  | "thinking_started"
  | "thinking_completed"
  | "prompt_exported"
  | "page_visited";

export interface ExperienceEvent {
  id: string;
  type: ExperienceEventType;
  timestamp: number;
  sessionId: string;
  page?: string;
  agentType?: string;
  duration?: number; // ms
  outcome?: "success" | "abandoned" | "error";
  metadata?: Record<string, string | number | boolean>;
}

export interface ExperienceSession {
  id: string;
  startTime: number;
  endTime?: number;
  page?: string;
  agentType?: string;
  eventCount: number;
  duration?: number;
  completed: boolean;
  returnedLater: boolean;
  lastActivity: number;
  projectCreated?: boolean;
  assetsGenerated?: boolean;
  promptExported?: boolean;
  feedbackSubmitted?: boolean;
}

// ─── Storage ───────────────────────────────────────────────────────────

const STORAGE_KEY_EVENTS = "spyral_experience_events";
const STORAGE_KEY_SESSIONS = "spyral_experience_sessions";

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

// ─── Subscriber pattern ────────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

// ─── Active session tracking ──────────────────────────────────────────

let _activeSessionId: string | null = null;
let _sessionStartTime: number = 0;
let _idleTimer: ReturnType<typeof setTimeout> | null = null;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 min

function startIdleTimer(): void {
  if (_idleTimer) clearTimeout(_idleTimer);
  _idleTimer = setTimeout(() => {
    // Auto-end session on idle timeout
    if (_activeSessionId) {
      ExperienceRecorder.endSession();
    }
  }, IDLE_TIMEOUT_MS);
}

// ─── Store ─────────────────────────────────────────────────────────────

export const ExperienceRecorder = {
  // ── Subscribe ──────────────────────────────────────────────────────

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // ── Session Management ─────────────────────────────────────────────

  /**
   * Start a new experience session. Called when user begins interacting.
   */
  startSession(page?: string, agentType?: string): string {
    // End any existing session first
    if (_activeSessionId) {
      this.endSession();
    }

    const session: ExperienceSession = {
      id: generateId(),
      startTime: Date.now(),
      page,
      agentType,
      eventCount: 0,
      completed: false,
      returnedLater: false,
      lastActivity: Date.now(),
    };

    _activeSessionId = session.id;
    _sessionStartTime = session.startTime;

    const sessions = this.getSessions();
    sessions.unshift(session);
    save(STORAGE_KEY_SESSIONS, sessions);

    this.recordEvent("session_started", { page, agentType, sessionId: session.id });
    startIdleTimer();

    return session.id;
  },

  /**
   * End the active session. Called on page leave or idle timeout.
   */
  endSession(): void {
    if (!_activeSessionId) return;

    const sessions = this.getSessions();
    const idx = sessions.findIndex((s) => s.id === _activeSessionId);
    if (idx !== -1) {
      sessions[idx].endTime = Date.now();
      sessions[idx].duration = sessions[idx].endTime - sessions[idx].startTime;
      sessions[idx].completed = true;
      sessions[idx].lastActivity = Date.now();
      save(STORAGE_KEY_SESSIONS, sessions);
    }

    this.recordEvent("session_ended", { sessionId: _activeSessionId });
    _activeSessionId = null;
    _sessionStartTime = 0;
    if (_idleTimer) clearTimeout(_idleTimer);
  },

  /**
   * Get the current active session ID, or null if none.
   */
  getActiveSessionId(): string | null {
    return _activeSessionId;
  },

  // ── Event Recording ────────────────────────────────────────────────

  /**
   * Record a single interaction event.
   */
  recordEvent(
    type: ExperienceEventType,
    overrides?: Partial<ExperienceEvent>,
  ): ExperienceEvent {
    const event: ExperienceEvent = {
      id: generateId(),
      type,
      timestamp: Date.now(),
      sessionId: overrides?.sessionId ?? _activeSessionId ?? "unknown",
      page: overrides?.page,
      agentType: overrides?.agentType,
      duration: overrides?.duration,
      outcome: overrides?.outcome,
      metadata: overrides?.metadata,
    };

    const events = this.getEvents();
    events.unshift(event);
    save(STORAGE_KEY_EVENTS, events);

    // Keep max 10,000 events in storage
    if (events.length > 10000) {
      events.length = 10000;
      save(STORAGE_KEY_EVENTS, events);
    }

    // Update session event count
    if (event.sessionId !== "unknown") {
      const sessions = this.getSessions();
      const sIdx = sessions.findIndex((s) => s.id === event.sessionId);
      if (sIdx !== -1) {
        sessions[sIdx].eventCount++;
        sessions[sIdx].lastActivity = Date.now();
        if (type === "project_created") sessions[sIdx].projectCreated = true;
        if (type === "content_generated") sessions[sIdx].assetsGenerated = true;
        if (type === "prompt_exported") sessions[sIdx].promptExported = true;
        if (type === "feedback_submitted") sessions[sIdx].feedbackSubmitted = true;
        save(STORAGE_KEY_SESSIONS, sessions);
      }
    }

    startIdleTimer();
    notify();

    return event;
  },

  // ── Data Access ────────────────────────────────────────────────────

  getEvents(): ExperienceEvent[] {
    return load<ExperienceEvent[]>(STORAGE_KEY_EVENTS, []);
  },

  getSessions(): ExperienceSession[] {
    return load<ExperienceSession[]>(STORAGE_KEY_SESSIONS, []);
  },

  /**
   * Get events filtered by type.
   */
  getEventsByType(type: ExperienceEventType): ExperienceEvent[] {
    return this.getEvents().filter((e) => e.type === type);
  },

  /**
   * Get the most recent N events.
   */
  getRecentEvents(count: number = 50): ExperienceEvent[] {
    return this.getEvents().slice(0, count);
  },

  /**
   * Get sessions within a date range.
   */
  getSessionsInRange(startTime: number, endTime: number): ExperienceSession[] {
    return this.getSessions().filter((s) => {
      const sTime = s.startTime;
      const eTime = s.endTime ?? s.lastActivity;
      return sTime >= startTime && eTime <= endTime;
    });
  },

  /**
   * Get today's sessions.
   */
  getTodaySessions(): ExperienceSession[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.getSessions().filter((s) => s.startTime >= today.getTime());
  },

  /**
   * Get total event count.
   */
  getEventCount(): number {
    return this.getEvents().length;
  },

  /**
   * Get total session count.
   */
  getSessionCount(): number {
    return this.getSessions().length;
  },

  /**
   * Get the count of sessions that ended with a project created.
   */
  getSessionsWithProjects(): number {
    return this.getSessions().filter((s) => s.projectCreated).length;
  },

  /**
   * Get the count of sessions that generated assets.
   */
  getSessionsWithAssets(): number {
    return this.getSessions().filter((s) => s.assetsGenerated).length;
  },

  // ── Utility ────────────────────────────────────────────────────────

  /**
   * Clear all stored experience data. For testing/reset.
   */
  clearAll(): void {
    save(STORAGE_KEY_EVENTS, []);
    save(STORAGE_KEY_SESSIONS, []);
    _activeSessionId = null;
    _sessionStartTime = 0;
    if (_idleTimer) clearTimeout(_idleTimer);
    notify();
  },

  /**
   * Record that a user returned to a session (re-engaged).
   */
  markReturned(sessionId: string): void {
    const sessions = this.getSessions();
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx !== -1) {
      sessions[idx].returnedLater = true;
      save(STORAGE_KEY_SESSIONS, sessions);
      notify();
    }
  },
};
