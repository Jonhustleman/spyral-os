/**
 * SPYRAL OS — Cognitive Memory Architecture
 *
 * Every memory type in the system.
 * Everything passes through MemoryEngine.
 * Nothing bypasses it.
 */

// ═══════════════════════════════════════════════════════════════════════
// IDENTITY MEMORY — Who is this user?
// ═══════════════════════════════════════════════════════════════════════

export interface IdentityMemory {
  name: string;
  role: string;
  industry: string;
  company: string;
  goals: string[];
  preferredThinkingStyle: string;
  preferredWritingStyle: string;
  timezone: string;
  languages: string[];
  experience: string;
  teams: string[];
  products: string[];
  businesses: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// EPISODIC MEMORY — What happened.
// ═══════════════════════════════════════════════════════════════════════

export type EpisodeType =
  | "conversation"
  | "decision"
  | "meeting"
  | "research"
  | "content"
  | "navigation"
  | "consultation"
  | "mistake"
  | "success"
  | "experiment";

export interface EpisodeMemory {
  id: string;
  type: EpisodeType;
  timestamp: number;
  duration?: number;
  summary: string;
  details: string;
  tags: string[];
  projectId?: string;
  investigationId?: string;
  relatedEpisodeIds: string[];
  importance: number; // 0-1
  archived: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// WORKING MEMORY — Current thoughts.
// ═══════════════════════════════════════════════════════════════════════

export interface WorkingMemory {
  currentMission: string;
  currentInvestigation: string;
  currentProject: string;
  currentObstacles: string[];
  currentAssumptions: string[];
  currentPriorities: string[];
  currentDecisions: string[];
  openQuestions: string[];
  updatedAt: number;
}

// ═══════════════════════════════════════════════════════════════════════
// SEMANTIC MEMORY — Facts SPYRAL has learned.
// ═══════════════════════════════════════════════════════════════════════

export interface SemanticFact {
  id: string;
  statement: string;
  category: string;
  confidence: number; // 0-1
  evidenceCount: number;
  createdAt: number;
  lastUpdated: number;
  source: string;
  relatedFactIds: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// PROCEDURAL MEMORY — How user works.
// ═══════════════════════════════════════════════════════════════════════

export interface ProceduralPattern {
  id: string;
  behavior: string;
  observationCount: number;
  confidence: number;
  firstObserved: number;
  lastObserved: number;
  evidence: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// PROJECT MEMORY
// ═══════════════════════════════════════════════════════════════════════

export interface ProjectMemory {
  id: string;
  name: string;
  mission: string;
  goal: string;
  timeline: { start: number; end?: number };
  researchFindings: string[];
  contentCreated: string[];
  strategies: string[];
  decisions: string[];
  experiments: string[];
  failures: string[];
  successes: string[];
  assets: string[];
  learnings: string[];
  relatedProjectIds: string[];
  status: "active" | "paused" | "completed" | "archived";
  createdAt: number;
  updatedAt: number;
}

// ═══════════════════════════════════════════════════════════════════════
// INVESTIGATION MEMORY — Research never ends.
// ═══════════════════════════════════════════════════════════════════════

export interface InvestigationMemory {
  id: string;
  question: string;
  hypotheses: string[];
  evidence: string[];
  contradictions: string[];
  unknowns: string[];
  experiments: {
    name: string;
    hypothesis: string;
    result?: string;
    status: "planned" | "running" | "completed" | "failed";
  }[];
  conclusions: string[];
  confidence: number;
  relatedInvestigationIds: string[];
  openQuestions: string[];
  projectId?: string;
  status: "active" | "paused" | "completed";
  createdAt: number;
  updatedAt: number;
}

// ═══════════════════════════════════════════════════════════════════════
// KNOWLEDGE GRAPH — The center of SPYRAL.
// ═══════════════════════════════════════════════════════════════════════

export type NodeType =
  | "project"
  | "person"
  | "company"
  | "product"
  | "technology"
  | "idea"
  | "framework"
  | "book"
  | "concept"
  | "research"
  | "strategy"
  | "goal";

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  metadata: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export type EdgeType =
  | "created"
  | "related_to"
  | "supports"
  | "contradicts"
  | "depends_on"
  | "improves"
  | "replaced_by"
  | "derived_from"
  | "inspired_by"
  | "belongs_to"
  | "references";

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: EdgeType;
  weight: number; // 0-1
  createdAt: number;
  metadata: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════════════
// MEMORY QUALITY
// ═══════════════════════════════════════════════════════════════════════

export interface MemoryQuality {
  confidence: number;
  evidenceCount: number;
  lastUsed: number;
  importance: number;
  relationshipCount: number;
  source: string;
  freshness: number;
}

// ═══════════════════════════════════════════════════════════════════════
// MEMORY PRIVACY
// ═══════════════════════════════════════════════════════════════════════

export type MemoryScope = "personal" | "workspace" | "team" | "public";

// ═══════════════════════════════════════════════════════════════════════
// REFLECTION
// ═══════════════════════════════════════════════════════════════════════

export type ReflectionType = "weekly" | "monthly" | "workspace" | "project";

export interface Reflection {
  id: string;
  type: ReflectionType;
  title: string;
  content: string;
  learned: string[];
  surprises: string[];
  patterns: string[];
  assumptionsChanged: string[];
  connectionsMade: string[];
  recommendations: string[];
  period: { start: number; end: number };
  createdAt: number;
}

// ═══════════════════════════════════════════════════════════════════════
// PREDICTION
// ═══════════════════════════════════════════════════════════════════════

export interface Prediction {
  id: string;
  type: "next_project" | "next_question" | "needed_tool" | "roadblock" | "success" | "failure";
  title: string;
  description: string;
  confidence: number;
  evidence: string[];
  relatedPatternIds: string[];
  createdAt: number;
  expiresAt: number;
  verified?: boolean;
  verifiedAt?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// PATTERN DETECTION
// ═══════════════════════════════════════════════════════════════════════

export interface DetectedPattern {
  id: string;
  pattern: string;
  evidence: string[];
  confidence: number;
  category: "decision" | "mistake" | "interest" | "topic" | "framework" | "success" | "failure" | "behavior";
  firstDetected: number;
  lastDetected: number;
  occurrenceCount: number;
  prediction?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// TIMELINE ENTRY
// ═══════════════════════════════════════════════════════════════════════

export type TimelineType = "personal" | "project" | "research" | "learning" | "company";

export interface TimelineEntry {
  id: string;
  type: TimelineType;
  timestamp: number;
  title: string;
  description: string;
  episodeId?: string;
  projectId?: string;
  investigationId?: string;
  tags: string[];
  importance: number;
}

// ═══════════════════════════════════════════════════════════════════════
// MEMORY HEALTH / METRICS
// ═══════════════════════════════════════════════════════════════════════

export interface MemoryMetrics {
  totalMemories: number;
  totalFacts: number;
  totalPatterns: number;
  totalPredictions: number;
  graphNodes: number;
  graphEdges: number;
  episodesThisSession: number;
  lastConsolidation: number | null;
  consolidationQueue: number;
  retrievalCount: number;
  averageConfidence: number;
  storageSize: number; // bytes
}

// ═══════════════════════════════════════════════════════════════════════
// MEMORY API — Everything goes through these.
// ═══════════════════════════════════════════════════════════════════════

export interface MemoryAPI {
  remember(type: string, data: any): void;
  recall(query: string, options?: RecallOptions): any;
  relate(sourceId: string, targetId: string, type: EdgeType): void;
  predict(): Prediction[];
  reflect(type: ReflectionType): Reflection | null;
  forget(id: string): void;
  strengthen(id: string, delta?: number): void;
  archive(id: string): void;
  summarize(options?: SummarizeOptions): string;
  retrieveContext(query?: string, options?: ContextOptions): RetrievedContext;
}

export interface RecallOptions {
  limit?: number;
  offset?: number;
  minConfidence?: number;
  types?: string[];
  scope?: MemoryScope;
  tags?: string[];
}

export interface SummarizeOptions {
  scope?: MemoryScope;
  since?: number;
  maxItems?: number;
}

export interface ContextOptions {
  includeIdentity?: boolean;
  includeWorking?: boolean;
  includeRecentEpisodes?: boolean;
  includeRelatedKnowledge?: boolean;
  includePastDecisions?: boolean;
  includePatterns?: boolean;
  includeGoals?: boolean;
  includeOpenQuestions?: boolean;
  maxItems?: number;
}

export interface RetrievedContext {
  identity: IdentityMemory | null;
  working: WorkingMemory | null;
  recentEpisodes: EpisodeMemory[];
  relatedFacts: SemanticFact[];
  pastDecisions: EpisodeMemory[];
  patterns: DetectedPattern[];
  goals: string[];
  openQuestions: string[];
  projects: ProjectMemory[];
  investigations: InvestigationMemory[];
}

// ═══════════════════════════════════════════════════════════════════════
// CONSOLIDATION
// ═══════════════════════════════════════════════════════════════════════

export interface ConsolidationResult {
  observed: EpisodeMemory[];
  extractedKnowledge: SemanticFact[];
  removedNoise: number;
  relationshipsFound: number;
  graphUpdates: number;
  insightsGenerated: string[];
  predictionsUpdated: number;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════
// WORKSPACE MEMORY STATE (persisted)
// ═══════════════════════════════════════════════════════════════════════

export interface MemoryState {
  identity: IdentityMemory | null;
  episodes: EpisodeMemory[];
  working: WorkingMemory | null;
  semanticFacts: SemanticFact[];
  proceduralPatterns: ProceduralPattern[];
  projects: ProjectMemory[];
  investigations: InvestigationMemory[];
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  patterns: DetectedPattern[];
  predictions: Prediction[];
  reflections: Reflection[];
  timeline: TimelineEntry[];
  metrics: MemoryMetrics;
  lastConsolidated: number | null;
}
