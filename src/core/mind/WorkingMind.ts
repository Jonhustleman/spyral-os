/**
 * WorkingMind — The temporary thinking workspace created per user message.
 *
 * RC6: This is RAM, not a CPU. It organizes state before any LLM reasons over it.
 * It does NOT generate responses. It does NOT reason. It does NOT write English.
 *
 * Every user message creates one WorkingMind.
 * It holds structured representations that any LLM can consume.
 *
 * The Job: Organize reality before intelligence reasons over it.
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY — A thing in the user's mental world
// ═══════════════════════════════════════════════════════════════════════════

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  properties: Record<string, string | number | boolean>;
  source: "user" | "memory" | "inference";
}

export type EntityType =
  | "concept"    // Abstract idea (Freedom, Justice, Flight)
  | "object"     // Tangible thing (Car, Building, Phone)
  | "domain"     // Field of knowledge (Transportation, Architecture)
  | "person"     // Person or role
  | "action"     // Something that happens or can happen
  | "property"   // Attribute or quality
  | "constraint" // Limitation or boundary
  | "unknown"    // Gap in knowledge
  | "goal"       // Desired outcome
  ;

// ═══════════════════════════════════════════════════════════════════════════
// RELATIONSHIP — A directed connection between two entities
// ═══════════════════════════════════════════════════════════════════════════

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: string; // "enables", "contradicts", "requires", "transforms", etc.
  strength: "strong" | "moderate" | "weak" | "speculative";
  description: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HYPOTHESIS — A structured possible explanation (format only, no reasoning)
// ═══════════════════════════════════════════════════════════════════════════

export interface HypothesisSlot {
  id: string;
  title: string;
  description: string;
  entities: string[]; // Entity IDs involved
}

// ═══════════════════════════════════════════════════════════════════════════
// SIMULATION — A what-if scenario to explore (format only, no reasoning)
// ═══════════════════════════════════════════════════════════════════════════

export interface SimulationSlot {
  id: string;
  title: string;
  description: string;
  entities: string[]; // Entity IDs involved
}

// ═══════════════════════════════════════════════════════════════════════════
// QUESTION — An open question worth asking (if uncertainty is high enough)
// ═══════════════════════════════════════════════════════════════════════════

export interface OpenQuestion {
  id: string;
  text: string;
  resolvesUncertainty: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKING MIND — The complete temporary workspace
// ═══════════════════════════════════════════════════════════════════════════

export interface WorkingMind {
  /** Unique ID for this thinking session */
  id: string;

  /** Which agent initiated this */
  agentType: string;

  /** The raw user input */
  rawInput: string;

  // ─── PARSED STATE ──────────────────────────────────────────────────

  /** Primary goal derived from input */
  goal: string;

  /** Current situation/context */
  context: string;

  /** All entities extracted from input + memory */
  entities: Entity[];

  /** Relationships between entities */
  relationships: Relationship[];

  /** Identified constraints */
  constraints: string[];

  /** Unknowns / gaps in knowledge */
  unknowns: string[];

  /** Possible directions the user might want to go */
  possibleDirections: string[];

  /** User's apparent intent */
  userIntent: string;

  // ─── MEMORY CONTEXT ───────────────────────────────────────────────

  /** Active investigation from memory */
  currentInvestigation?: string;

  /** Active mission from memory */
  currentMission?: string;

  /** Relevant memories retrieved before thought */
  activeMemory: {
    identity: string[];
    patterns: string[];
    preferences: string[];
    previousDiscoveries: string[];
  };

  // ─── STRUCTURED THOUGHT (formats, not reasoning) ──────────────────

  /** Possible hypotheses (formats for LLM to reason about) */
  hypotheses: HypothesisSlot[];

  /** What-if scenarios to explore (formats for LLM to simulate) */
  simulations: SimulationSlot[];

  /** Questions worth asking the user (if uncertainty demands it) */
  openQuestions: OpenQuestion[];

  // ─── META ──────────────────────────────────────────────────────────

  /** Confidence in understanding (0-1) */
  confidence: number;

  /** Processing timestamp */
  createdAt: number;
}
