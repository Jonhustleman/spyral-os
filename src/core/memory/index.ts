/**
 * SPYRAL OS — Memory Module Barrel Export
 *
 * Everything passes through MemoryEngine.
 * Nothing bypasses it.
 */

export { MemoryEngine } from "./MemoryEngine";
export { MemoryStore } from "./MemoryStore";
export { KnowledgeGraph } from "./KnowledgeGraph";
export { RelationshipEngine } from "./RelationshipEngine";
export { SemanticSearch } from "./SemanticSearch";
export { MemoryRetriever } from "./MemoryRetriever";
export { MemoryConsolidator } from "./MemoryConsolidator";
export { ContextEngine } from "./ContextEngine";
export { MemoryIndex } from "./MemoryIndex";
export { PatternEngine } from "./PatternEngine";
export { PredictionEngine } from "./PredictionEngine";
export { ReflectionEngine } from "./ReflectionEngine";
export { TimelineEngine } from "./TimelineEngine";
export { UserMemory } from "./UserMemory";
export { ProjectMemoryManager } from "./ProjectMemory";
export { WorkspaceMemory } from "./WorkspaceMemory";
export { AgentMemory } from "./AgentMemory";

// ─── Types from types.ts ──────────────────────────────────────────────

export type {
  // Core types
  MemoryState,
  MemoryMetrics,
  MemoryScope,
  MemoryAPI,

  // Memory types
  IdentityMemory,
  EpisodeMemory,
  EpisodeType,
  WorkingMemory,
  SemanticFact,
  ProceduralPattern,
  ProjectMemory,
  InvestigationMemory,
  DetectedPattern,
  Prediction,
  Reflection,
  ReflectionType,
  TimelineEntry,
  TimelineType,

  // Knowledge Graph
  GraphNode,
  GraphEdge,
  NodeType,
  EdgeType,

  // Retrieval & Search Options
  RecallOptions,
  SummarizeOptions,
  ContextOptions,
  RetrievedContext,
  ConsolidationResult,
} from "./types";

// ─── Types from MemoryRetriever ────────────────────────────────────────

export type { RetrievedMemory } from "./MemoryRetriever";

// ─── Types from RelationshipEngine ─────────────────────────────────────

export type { RelationshipResult } from "./RelationshipEngine";

// ─── Types from SemanticSearch ─────────────────────────────────────────

export type { SearchResult } from "./SemanticSearch";

// ─── Types from AgentMemory ────────────────────────────────────────────

export type { AgentId } from "./AgentMemory";
