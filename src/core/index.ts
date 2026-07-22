/**
 * SPYRAL OS — Core barrel export
 *
 * The Cognitive Core is the ONLY intelligence inside SPYRAL.
 * Every agent must import from here.
 *
 * Phase G.0 — Product Intelligence engines observe and recommend.
 * They NEVER replace the Cognitive Core.
 */

export { SpyralCognitiveCore, CONFIDENCE_MAX } from "./SpyralCognitiveCore";
export type {
  AgentType,
  ResearchMode,
  ReasoningStrategy,
  CognitiveDomain,
  CognitiveComplexity,
  CognitiveIntent,
  ConversationContext,
  MentalModel,
  SOPResult,
  LDEResult,
  STEStrategy,
  STEResult,
  SVEResult,
  SAEAction,
  SAEResult,
  CognitiveResponse,
  ThinkInput,
} from "./SpyralCognitiveCore";

// ─── Phase G.0 — Product Intelligence ──────────────────────────────────

export {
  ExperienceRecorder,
  ProductMetrics,
  ExperienceAdaptationEngine,
  ProductResearchEngine,
  ImprovementRecommendationEngine,
  ProductKnowledgeGraph,
  DeveloperInsights,
} from "./product-intelligence";

// ─── Cognitive Memory Architecture ────────────────────────────────────

export { MemoryEngine } from "./memory";
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

  // Knowledge Graph (import from @/core/memory if needed)
  // GraphNode, GraphEdge, NodeType, EdgeType — use from memory module directly

  // Retrieval & Search
  RecallOptions,
  SummarizeOptions,
  ContextOptions,
  RetrievedContext,
  RetrievedMemory,
  SearchResult,
  RelationshipResult,
  ConsolidationResult,

  // Agent Memory
  AgentId,
} from "./memory";

export type {
  ExperienceEvent,
  ExperienceEventType,
  ExperienceSession,
  ProductMetricsSnapshot,
  AdaptationRecommendation,
  ResearchQuestion,
  Hypothesis,
  EvidenceItem,
  Experiment,
  ImprovementRecommendation,
  GraphNode,
  GraphEdge,
  NodeType,
  KnowledgeGraphSnapshot,
  DeveloperDashboardData,
} from "./product-intelligence";
