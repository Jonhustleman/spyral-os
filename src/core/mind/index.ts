/**
 * SPYRAL Mind System — RC6
 *
 * A structured thinking workspace that prepares state before any LLM reasons over it.
 * The Mind is RAM, not a CPU. It organizes reality. The LLM provides intelligence.
 *
 * Architecture:
 *   User Input → ConceptExtractor → WorkingMind (state container) →
 *   RelationshipEngine → HypothesisBuilder → SimulationQueue →
 *   MemoryRetriever → ContextBuilder → ReasoningPackage → LLM
 *
 * All exports are model-agnostic. No provider dependencies.
 */

// ─── Core Types ──────────────────────────────────────────────────────────

export type {
  Entity,
  EntityType,
  Relationship,
  HypothesisSlot,
  SimulationSlot,
  OpenQuestion,
  WorkingMind,
} from "./WorkingMind";

// ─── Engines (state preparation, not reasoning) ──────────────────────────

export {
  extractConcepts,
  extractGoal,
  extractSituation,
} from "./ConceptExtractor";

export {
  discoverRelationships,
} from "./RelationshipEngine";

export {
  buildHypothesisSlots,
} from "./HypothesisBuilder";

export {
  buildSimulationSlots,
} from "./SimulationQueue";

export {
  retrieveMemories,
} from "./MemoryRetriever";

// ─── Orchestrator ────────────────────────────────────────────────────────

export {
  buildWorkingMind,
} from "./ContextBuilder";

// ─── Model-Agnostic Output ───────────────────────────────────────────────

export type {
  ReasoningPackage,
} from "./ReasoningPackage";

export {
  buildReasoningPackage,
  serializeReasoningPackage,
} from "./ReasoningPackage";

// ─── Agent Configuration ─────────────────────────────────────────────────

export type {
  AgentGoal,
} from "./AgentMinds";

export {
  getAgentGoal,
  getAllAgentGoals,
} from "./AgentMinds";
