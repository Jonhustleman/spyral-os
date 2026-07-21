/**
 * NavigationStore — Orchestrator (state machine) tests
 *
 * Per ADR-0047, Navigation is conversational and stateful.
 * Per ADR-0048, NavigationSession is a product contract.
 *
 * Phase 1 (Highest Risk) — These define SPYRAL's behavior and
 * must be protected first.
 */

import { NavigationStore } from "./navigation.store";
import { NavigationStage } from "@/kernel/contracts/NavigationStage";
import type { NavigationSession } from "@/kernel/contracts/NavigationSession";
import type { NavigationContext } from "@/kernel/contracts/NavigationContext";

// ─── Helpers ────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<NavigationSession> = {}): NavigationSession {
  return {
    id: "test-session-1",
    workspaceId: "default",
    prompt: "Test intent",
    stage: NavigationStage.INTENT,
    status: "ACTIVE" as const,
    context: {
      intent: "Test intent",
      targetDate: undefined,
      currentRealityKnown: false,
      goalDefined: false,
      constraints: [],
      successMetric: undefined,
    },
    history: [],
    currentWorkspaceId: "default",
    currentCapabilityId: "navigation",
    createdAt: new Date("2026-07-20T10:00:00Z"),
    updatedAt: new Date("2026-07-20T10:00:00Z"),
    ...overrides,
  };
}

function makeContext(overrides: Partial<NavigationContext> = {}): NavigationContext {
  return {
    intent: "Test intent",
    targetDate: undefined,
    currentRealityKnown: false,
    goalDefined: false,
    constraints: [],
    successMetric: undefined,
    ...overrides,
  };
}

// ─── Store CRUD ─────────────────────────────────────────────────────────

describe("NavigationStore — CRUD", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should create a session from prompt", () => {
    const session = NavigationStore.createFromPrompt("I want to grow my business");
    expect(session.prompt).toBe("I want to grow my business");
    expect(session.stage).toBe(NavigationStage.INTENT);
    expect(session.status).toBe("ACTIVE");
    expect(session.context.intent).toBe("I want to grow my business");
    expect(session.history).toHaveLength(1);
    expect(session.history[0].role).toBe("user");
  });

  it("should retrieve a session by id", () => {
    const created = NavigationStore.createFromPrompt("Test");
    const found = NavigationStore.getById(created.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(created.id);
  });

  it("should return undefined for unknown id", () => {
    expect(NavigationStore.getById("nonexistent")).toBeUndefined();
  });

  it("should return all sessions", () => {
    NavigationStore.createFromPrompt("Session 1");
    NavigationStore.createFromPrompt("Session 2");
    expect(NavigationStore.getAll()).toHaveLength(2);
  });

  it("should update stage and context", () => {
    const session = NavigationStore.createFromPrompt("Test");
    const updated = NavigationStore.updateStage(session.id, NavigationStage.CLARIFICATION, {
      currentRealityKnown: true,
    });
    expect(updated).toBeDefined();
    expect(updated!.stage).toBe(NavigationStage.CLARIFICATION);
    expect(updated!.context.currentRealityKnown).toBe(true);
  });

  it("should return undefined when updating unknown session", () => {
    expect(NavigationStore.updateStage("nonexistent", NavigationStage.CLARIFICATION)).toBeUndefined();
  });

  it("should update status", () => {
    const session = NavigationStore.createFromPrompt("Test");
    const updated = NavigationStore.updateStatus(session.id, "COMPLETED");
    expect(updated!.status).toBe("COMPLETED");
  });

  it("should add a conversation turn", () => {
    const session = NavigationStore.createFromPrompt("Test");
    const updated = NavigationStore.addTurn(session.id, {
      role: "system",
      message: "Clarifying question?",
      timestamp: new Date(),
    });
    expect(updated!.history).toHaveLength(2);
    expect(updated!.history[1].message).toBe("Clarifying question?");
  });

  it("should update context fields", () => {
    const session = NavigationStore.createFromPrompt("Test");
    const updated = NavigationStore.updateContext(session.id, {
      goalDefined: true,
      constraints: ["budget", "time"],
    });
    expect(updated!.context.goalDefined).toBe(true);
    expect(updated!.context.constraints).toEqual(["budget", "time"]);
  });

  it("should delete a session", () => {
    const session = NavigationStore.createFromPrompt("Test");
    expect(NavigationStore.getAll()).toHaveLength(1);
    NavigationStore.deleteSession(session.id);
    expect(NavigationStore.getAll()).toHaveLength(0);
  });

  it("should return active sessions", () => {
    const s1 = NavigationStore.createFromPrompt("Active");
    NavigationStore.createFromPrompt("Completed");
    NavigationStore.updateStatus(
      NavigationStore.getAll().find((s) => s.id !== s1.id)!.id,
      "COMPLETED"
    );
    expect(NavigationStore.getActiveSessions()).toHaveLength(1);
    expect(NavigationStore.getActiveSessions()[0].id).toBe(s1.id);
  });

  it("should return recent destinations from completed sessions", () => {
    const s1 = NavigationStore.createFromPrompt("Old completed");
    const s2 = NavigationStore.createFromPrompt("Recent completed");
    NavigationStore.updateStatus(s1.id, "COMPLETED");
    NavigationStore.updateStatus(s2.id, "COMPLETED");
    const recent = NavigationStore.getRecentDestinations(2);
    expect(recent).toHaveLength(2);
    // Both completed sessions should be returned
    const ids = recent.map((s) => s.id);
    expect(ids).toContain(s1.id);
    expect(ids).toContain(s2.id);
  });

  it("should count sessions", () => {
    NavigationStore.createFromPrompt("A");
    NavigationStore.createFromPrompt("B");
    NavigationStore.createFromPrompt("C");
    expect(NavigationStore.getSessionCount()).toBe(3);
  });
});

// ─── Orchestrator — State Machine ──────────────────────────────────────

describe("NavigationStore — Orchestrator (state machine)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── next() ───────────────────────────────────────────────────────────

  describe("next()", () => {
    it("INTENT → CLARIFICATION", () => {
      const session = makeSession({ stage: NavigationStage.INTENT });
      expect(NavigationStore.next(session)).toBe(NavigationStage.CLARIFICATION);
    });

    it("CLARIFICATION → REALITY when reality not known", () => {
      const session = makeSession({
        stage: NavigationStage.CLARIFICATION,
        context: makeContext({ intent: "Test", currentRealityKnown: false }),
      });
      expect(NavigationStore.next(session)).toBe(NavigationStage.REALITY);
    });

    it("CLARIFICATION → GAP when reality known but goal not defined", () => {
      const session = makeSession({
        stage: NavigationStage.CLARIFICATION,
        context: makeContext({ intent: "Test", currentRealityKnown: true, goalDefined: false }),
      });
      expect(NavigationStore.next(session)).toBe(NavigationStage.GAP);
    });

    it("CLARIFICATION → DECISION when both reality and goal are known", () => {
      const session = makeSession({
        stage: NavigationStage.CLARIFICATION,
        context: makeContext({ intent: "Test", currentRealityKnown: true, goalDefined: true }),
      });
      expect(NavigationStore.next(session)).toBe(NavigationStage.DECISION);
    });

    it("REALITY → GAP when goal not defined", () => {
      const session = makeSession({
        stage: NavigationStage.REALITY,
        context: makeContext({ intent: "Test", currentRealityKnown: true, goalDefined: false }),
      });
      expect(NavigationStore.next(session)).toBe(NavigationStage.GAP);
    });

    it("REALITY → DECISION when goal defined", () => {
      const session = makeSession({
        stage: NavigationStage.REALITY,
        context: makeContext({ intent: "Test", currentRealityKnown: true, goalDefined: true }),
      });
      expect(NavigationStore.next(session)).toBe(NavigationStage.DECISION);
    });

    it("GAP → DECISION", () => {
      const session = makeSession({ stage: NavigationStage.GAP });
      expect(NavigationStore.next(session)).toBe(NavigationStage.DECISION);
    });

    it("DECISION → EXECUTION", () => {
      const session = makeSession({ stage: NavigationStage.DECISION });
      expect(NavigationStore.next(session)).toBe(NavigationStage.EXECUTION);
    });

    it("EXECUTION → COMPLETE", () => {
      const session = makeSession({ stage: NavigationStage.EXECUTION });
      expect(NavigationStore.next(session)).toBe(NavigationStage.COMPLETE);
    });

    it("COMPLETE → COMPLETE (terminal)", () => {
      const session = makeSession({ stage: NavigationStage.COMPLETE });
      expect(NavigationStore.next(session)).toBe(NavigationStage.COMPLETE);
    });
  });

  // ── canProceed() ─────────────────────────────────────────────────────

  describe("canProceed()", () => {
    it("returns true when intent is set at INTENT stage", () => {
      const session = makeSession({
        stage: NavigationStage.INTENT,
        context: makeContext({ intent: "I want to grow" }),
      });
      expect(NavigationStore.canProceed(session)).toBe(true);
    });

    it("returns false when intent is empty at INTENT stage", () => {
      const session = makeSession({
        stage: NavigationStage.INTENT,
        context: makeContext({ intent: "" }),
      });
      expect(NavigationStore.canProceed(session)).toBe(false);
    });

    it("returns true at CLARIFICATION when intent and targetDate exist", () => {
      const session = makeSession({
        stage: NavigationStage.CLARIFICATION,
        context: makeContext({ intent: "Something", targetDate: "2026-12-31" }),
      });
      expect(NavigationStore.canProceed(session)).toBe(true);
    });

    it("returns true at REALITY when reality is known", () => {
      const session = makeSession({
        stage: NavigationStage.REALITY,
        context: makeContext({ currentRealityKnown: true }),
      });
      expect(NavigationStore.canProceed(session)).toBe(true);
    });

    it("returns false at REALITY when reality is not known", () => {
      const session = makeSession({
        stage: NavigationStage.REALITY,
        context: makeContext({ currentRealityKnown: false }),
      });
      expect(NavigationStore.canProceed(session)).toBe(false);
    });

    it("returns true at GAP when goal is defined", () => {
      const session = makeSession({
        stage: NavigationStage.GAP,
        context: makeContext({ goalDefined: true }),
      });
      expect(NavigationStore.canProceed(session)).toBe(true);
    });

    it("returns false at GAP when goal is not defined", () => {
      const session = makeSession({
        stage: NavigationStage.GAP,
        context: makeContext({ goalDefined: false }),
      });
      expect(NavigationStore.canProceed(session)).toBe(false);
    });

    it("returns true at DECISION when both goal and reality are known", () => {
      const session = makeSession({
        stage: NavigationStage.DECISION,
        context: makeContext({ goalDefined: true, currentRealityKnown: true }),
      });
      expect(NavigationStore.canProceed(session)).toBe(true);
    });

    it("returns false at DECISION when goal is known but reality is not", () => {
      const session = makeSession({
        stage: NavigationStage.DECISION,
        context: makeContext({ goalDefined: true, currentRealityKnown: false }),
      });
      expect(NavigationStore.canProceed(session)).toBe(false);
    });

    it("returns true at EXECUTION", () => {
      const session = makeSession({ stage: NavigationStage.EXECUTION });
      expect(NavigationStore.canProceed(session)).toBe(true);
    });

    it("returns true at COMPLETE", () => {
      const session = makeSession({ stage: NavigationStage.COMPLETE });
      expect(NavigationStore.canProceed(session)).toBe(true);
    });
  });

  // ── missingInformation() ─────────────────────────────────────────────

  describe("missingInformation()", () => {
    it("returns intent question when intent is empty at INTENT stage", () => {
      const session = makeSession({
        stage: NavigationStage.INTENT,
        context: makeContext({ intent: "" }),
      });
      expect(NavigationStore.missingInformation(session)).toContain("Where do you want to go");
    });

    it("returns null at INTENT when intent is set", () => {
      const session = makeSession({
        stage: NavigationStage.INTENT,
        context: makeContext({ intent: "I want to grow" }),
      });
      expect(NavigationStore.missingInformation(session)).toBeNull();
    });

    it("returns intent question when intent empty at CLARIFICATION", () => {
      const session = makeSession({
        stage: NavigationStage.CLARIFICATION,
        context: makeContext({ intent: "" }),
      });
      expect(NavigationStore.missingInformation(session)).toContain("What do you want to achieve");
    });

    it("asks for target date when intent exists but targetDate is missing", () => {
      const session = makeSession({
        stage: NavigationStage.CLARIFICATION,
        context: makeContext({ intent: "Grow", targetDate: undefined }),
      });
      expect(NavigationStore.missingInformation(session)).toContain("target date");
    });

    it("returns null at CLARIFICATION when intent and targetDate are set", () => {
      const session = makeSession({
        stage: NavigationStage.CLARIFICATION,
        context: makeContext({
          intent: "Grow",
          targetDate: "2026-12-31",
        }),
      });
      expect(NavigationStore.missingInformation(session)).toBeNull();
    });

    it("returns null when all clarification fields are filled", () => {
      const session = makeSession({
        stage: NavigationStage.CLARIFICATION,
        context: makeContext({
          intent: "Grow",
          targetDate: "2026-12-31",
          currentRealityKnown: true,
          goalDefined: true,
          constraints: ["time"],
          successMetric: "revenue",
        }),
      });
      expect(NavigationStore.missingInformation(session)).toBeNull();
    });

    it("returns reality message at REALITY stage", () => {
      const session = makeSession({ stage: NavigationStage.REALITY });
      expect(NavigationStore.missingInformation(session)).toContain("current reality assessment");
    });

    it("returns gap message at GAP stage", () => {
      const session = makeSession({ stage: NavigationStage.GAP });
      expect(NavigationStore.missingInformation(session)).toContain("gap");
    });

    it("returns null at DECISION stage", () => {
      const session = makeSession({ stage: NavigationStage.DECISION });
      expect(NavigationStore.missingInformation(session)).toBeNull();
    });

    it("returns null at EXECUTION stage", () => {
      const session = makeSession({ stage: NavigationStage.EXECUTION });
      expect(NavigationStore.missingInformation(session)).toBeNull();
    });

    it("returns null at COMPLETE stage", () => {
      const session = makeSession({ stage: NavigationStage.COMPLETE });
      expect(NavigationStore.missingInformation(session)).toBeNull();
    });
  });

  // ── nextQuestion() ───────────────────────────────────────────────────

  describe("nextQuestion()", () => {
    it("returns null when can proceed", () => {
      const session = makeSession({
        stage: NavigationStage.INTENT,
        context: makeContext({ intent: "Grow" }),
      });
      expect(NavigationStore.nextQuestion(session)).toBeNull();
    });

    it("returns missing information when cannot proceed", () => {
      const session = makeSession({
        stage: NavigationStage.INTENT,
        context: makeContext({ intent: "" }),
      });
      expect(NavigationStore.nextQuestion(session)).toContain("Where do you want to go");
    });
  });

  // ── transition() ─────────────────────────────────────────────────────

  describe("transition()", () => {
    it("transitions to the next stage", () => {
      const session = NavigationStore.createFromPrompt("Grow business");
      const updated = NavigationStore.transition(session.id);
      expect(updated).toBeDefined();
      expect(updated!.stage).toBe(NavigationStage.CLARIFICATION);
    });

    it("returns undefined for unknown session", () => {
      expect(NavigationStore.transition("nonexistent")).toBeUndefined();
    });

    it("stays at COMPLETE (terminal)", () => {
      const session = NavigationStore.createFromPrompt("Done");
      NavigationStore.updateStatus(session.id, "COMPLETED");
      NavigationStore.updateStage(session.id, NavigationStage.COMPLETE);
      const updated = NavigationStore.transition(session.id);
      expect(updated!.stage).toBe(NavigationStage.COMPLETE);
    });
  });
});
