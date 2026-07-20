/**
 * DecisionStore — localStorage-persisted CRUD for decisions and relationships.
 *
 * Per ADR-0017, decisions are immutable once "made".
 * Per ADR-0021, outcome is deprecated (will move to Execution Engine).
 * Per ADR-0022, decisions form a graph via DecisionRelationship.
 */

"use client";

import type { Decision } from "@/kernel/contracts/Decision";
import type { DecisionRelationship } from "@/kernel/contracts/DecisionRelationship";
import type { DecisionOption } from "@/kernel/contracts/DecisionOption";
import type { DecisionScore, DecisionDimensionScore } from "@/kernel/contracts/DecisionScore";
import type { Explainability } from "@/kernel/contracts/Explainability";
import type { DecisionContext } from "@/kernel/contracts/DecisionContext";

const STORAGE_KEY_DECISIONS = "spyral_decisions";
const STORAGE_KEY_RELATIONSHIPS = "spyral_decision_relationships";

// ─── Helpers ────────────────────────────────────────────────────────────

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

// ─── Subscriber pattern ─────────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

// ─── Store ──────────────────────────────────────────────────────────────

export const DecisionStore = {
  // ── Subscribe ────────────────────────────────────────────────────────

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // ── Decisions ────────────────────────────────────────────────────────

  getAll(): Decision[] {
    return load<Decision[]>(STORAGE_KEY_DECISIONS, []);
  },

  getById(id: string): Decision | undefined {
    return this.getAll().find((d) => d.id === id);
  },

  getByWorkspace(workspaceId: string): Decision[] {
    return this.getAll().filter((d) => d.context.workspaceId === workspaceId);
  },

  create(decision: Omit<Decision, "id" | "createdAt"> & { updatedAt?: Date }): Decision {
    const all = this.getAll();
    const newDecision: Decision = {
      ...decision,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: decision.updatedAt || new Date(),
    };
    all.push(newDecision);
    save(STORAGE_KEY_DECISIONS, all);
    notify();
    return newDecision;
  },

  /**
   * Update mutable fields only.
   * Immutable fields (context, options, explanation, selectedOptionId, createdAt, madeBy)
   * cannot be changed after creation.
   */
  update(id: string, updates: Partial<Pick<Decision, "title" | "description" | "status" | "tags" | "relationships" | "scores" | "outcome" | "options" | "explanation" | "selectedOptionId">>): Decision | undefined {
    const all = this.getAll();
    const idx = all.findIndex((d) => d.id === id);
    if (idx === -1) return undefined;
    // Preserve immutable fields, update timestamp
    all[idx] = { ...all[idx], ...updates, updatedAt: new Date() };
    save(STORAGE_KEY_DECISIONS, all);
    notify();
    return all[idx];
  },

  delete(id: string): void {
    const all = this.getAll().filter((d) => d.id !== id);
    save(STORAGE_KEY_DECISIONS, all);
    // Also remove related relationships
    const rels = this.getRelationships().filter(
      (r) => r.fromDecisionId !== id && r.toDecisionId !== id
    );
    save(STORAGE_KEY_RELATIONSHIPS, rels);
    notify();
  },

  // ── Relationships (ADR-0022) ─────────────────────────────────────────

  getRelationships(): DecisionRelationship[] {
    return load<DecisionRelationship[]>(STORAGE_KEY_RELATIONSHIPS, []);
  },

  getRelationshipsFor(decisionId: string): DecisionRelationship[] {
    return this.getRelationships().filter(
      (r) => r.fromDecisionId === decisionId || r.toDecisionId === decisionId
    );
  },

  addRelationship(rel: Omit<DecisionRelationship, "id"> & { id?: string }): DecisionRelationship {
    const all = this.getRelationships();
    const newRel: DecisionRelationship = { ...rel, id: rel.id || generateId() } as DecisionRelationship & { id: string };
    all.push(newRel);
    save(STORAGE_KEY_RELATIONSHIPS, all);
    notify();
    return newRel;
  },

  removeRelationship(fromDecisionId: string, toDecisionId: string): void {
    const all = this.getRelationships().filter(
      (r) => !(r.fromDecisionId === fromDecisionId && r.toDecisionId === toDecisionId)
    );
    save(STORAGE_KEY_RELATIONSHIPS, all);
    notify();
  },

  // ── Scoring helpers ──────────────────────────────────────────────────

  createDefaultScores(optionId: string): DecisionScore {
    return {
      optionId,
      dimensions: [
        { name: "Impact", value: 5, max: 10 },
        { name: "Cost", value: 5, max: 10 },
        { name: "Risk", value: 5, max: 10 },
        { name: "Time", value: 5, max: 10 },
        { name: "Confidence", value: 5, max: 10 },
      ],
    };
  },

  updateDimensionScore(
    decisionId: string,
    optionId: string,
    dimensionIndex: number,
    value: number
  ): void {
    const decision = this.getById(decisionId);
    if (!decision) return;
    const scores = [...decision.scores];
    const scoreIdx = scores.findIndex((s) => s.optionId === optionId);
    if (scoreIdx === -1) return;
    const dimensions = [...scores[scoreIdx].dimensions];
    if (dimensions[dimensionIndex]) {
      dimensions[dimensionIndex] = { ...dimensions[dimensionIndex], value };
    }
    scores[scoreIdx] = { ...scores[scoreIdx], dimensions };
    this.update(decisionId, { scores });
  },
};

// Export the type for use in components
export type { Decision, DecisionOption, DecisionScore, DecisionRelationship, Explainability };
