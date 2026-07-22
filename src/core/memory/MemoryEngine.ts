/**
 * SPYRAL OS — MemoryEngine
 *
 * THE central orchestration kernel for all memory operations.
 *
 * Everything passes through MemoryEngine.
 * Nothing bypasses it.
 *
 * No component accesses storage directly.
 *
 * API: remember() | recall() | relate() | predict() | reflect()
 *      | forget() | strengthen() | archive() | summarize() | retrieveContext()
 *
 * Design ensures storage backends can be swapped later:
 * PostgreSQL/pgvector, Supabase, Pinecone, Neo4j, etc.
 * Interface remains stable; backends change.
 */

"use client";

import { MemoryStore } from "./MemoryStore";
import { KnowledgeGraph } from "./KnowledgeGraph";
import { RelationshipEngine, type RelationshipResult } from "./RelationshipEngine";
import { SemanticSearch, type SearchResult } from "./SemanticSearch";
import { MemoryRetriever, type RetrievedMemory } from "./MemoryRetriever";
import { MemoryConsolidator } from "./MemoryConsolidator";
import type { ConsolidationResult } from "./types";
import { ContextEngine } from "./ContextEngine";
import { PatternEngine } from "./PatternEngine";
import { PredictionEngine } from "./PredictionEngine";
import { ReflectionEngine } from "./ReflectionEngine";
import { TimelineEngine } from "./TimelineEngine";
import { UserMemory } from "./UserMemory";
import { ProjectMemoryManager } from "./ProjectMemory";
import { WorkspaceMemory } from "./WorkspaceMemory";
import { AgentMemory, type AgentId } from "./AgentMemory";
import { MemoryIndex } from "./MemoryIndex";
import type {
  MemoryAPI,
  MemoryState,
  MemoryMetrics,
  MemoryScope,
  RecallOptions,
  SummarizeOptions,
  ContextOptions,
  RetrievedContext,
  IdentityMemory,
  WorkingMemory,
  EpisodeMemory,
  SemanticFact,
  DetectedPattern,
  Prediction,
  Reflection,
  ReflectionType,
  GraphNode,
  GraphEdge,
  NodeType,
  EdgeType,
  TimelineEntry,
  ProjectMemory,
  InvestigationMemory,
  EpisodeType,
} from "./types";

// ═══════════════════════════════════════════════════════════════════════
// MEMORY ENGINE
// ═══════════════════════════════════════════════════════════════════════

class MemoryEngineImpl implements MemoryAPI {
  private initialized = false;

  // ── Lifecycle ───────────────────────────────────────────────────────

  /** Initialize the memory system. Call once on app start. */
  init(): void {
    if (this.initialized) return;
    MemoryStore.init();
    MemoryIndex.build();
    this.initialized = true;
  }

  /** Check if memory system is initialized. */
  isInitialized(): boolean {
    return this.initialized;
  }

  /** Get the raw storage interface (for advanced use only). */
  get store() {
    return MemoryStore;
  }

  // ═════════════════════════════════════════════════════════════════════
  // API: remember() — Store something in memory
  // ═════════════════════════════════════════════════════════════════════

  /**
   * Remember something.
   * @param type The type of memory to store.
   * @param data The data to store.
   */
  remember(type: string, data: any): void {
    switch (type) {
      case "identity":
        UserMemory.setIdentity(data as IdentityMemory);
        break;

      case "working":
        MemoryStore.setWorkingMemory(data as WorkingMemory);
        break;

      case "episode":
        MemoryStore.addEpisode(data);
        break;

      case "fact":
        MemoryStore.addSemanticFact(data);
        break;

      case "project":
        ProjectMemoryManager.create(data.name, data.mission, data.goal, data);
        break;

      case "investigation":
        MemoryStore.addInvestigation(data);
        break;

      case "graph_node":
        KnowledgeGraph.addNode(data.type, data.label, data.description, data.metadata);
        break;

      case "graph_edge":
        KnowledgeGraph.addEdge(data.sourceId, data.targetId, data.type, data.weight, data.metadata);
        break;

      default:
        console.warn(`[MemoryEngine] Unknown memory type: ${type}`);
    }

    MemoryIndex.invalidate();
  }

  // ═════════════════════════════════════════════════════════════════════
  // API: recall() — Retrieve from memory
  // ═════════════════════════════════════════════════════════════════════

  /**
   * Recall memories matching a query.
   * @param query Search query.
   * @param options Recall options.
   */
  recall(query: string, options: RecallOptions = {}): RetrievedMemory {
    return MemoryRetriever.retrieve(query, options);
  }

  // ═════════════════════════════════════════════════════════════════════
  // API: relate() — Create relationships
  // ═════════════════════════════════════════════════════════════════════

  /**
   * Relate two entities in the knowledge graph.
   */
  relate(sourceId: string, targetId: string, type: EdgeType, weight?: number): GraphEdge | undefined {
    return KnowledgeGraph.addEdge(sourceId, targetId, type, weight);
  }

  // ═════════════════════════════════════════════════════════════════════
  // API: predict() — Get predictions
  // ═════════════════════════════════════════════════════════════════════

  /**
   * Get all active predictions.
   */
  predict(): Prediction[] {
    return PredictionEngine.getActive();
  }

  // ═════════════════════════════════════════════════════════════════════
  // API: reflect() — Generate reflections
  // ═════════════════════════════════════════════════════════════════════

  /**
   * Generate or retrieve a reflection.
   */
  reflect(type: ReflectionType, generate: boolean = false): Reflection | null {
    if (generate) {
      switch (type) {
        case "weekly": return ReflectionEngine.generateWeekly();
        case "monthly": return ReflectionEngine.generateMonthly();
        case "workspace": return ReflectionEngine.generateWorkspace();
        default: return null;
      }
    }
    return ReflectionEngine.getLatest(type);
  }

  // ═════════════════════════════════════════════════════════════════════
  // API: forget() — Delete from memory
  // ═════════════════════════════════════════════════════════════════════

  /**
   * Forget a specific memory by ID.
   */
  forget(id: string): boolean {
    const result = MemoryStore.deleteById(id);
    if (result) MemoryIndex.invalidate();
    return result;
  }

  // ═════════════════════════════════════════════════════════════════════
  // API: strengthen() — Increase confidence in a memory
  // ═════════════════════════════════════════════════════════════════════

  /**
   * Strengthen a memory (increase its confidence/importance).
   */
  strengthen(id: string, delta: number = 0.1): void {
    // Try semantic fact
    const fact = MemoryStore.getSemanticFacts().find((f) => f.id === id);
    if (fact) {
      MemoryStore.updateSemanticFact(id, {
        confidence: Math.min(1, fact.confidence + delta),
        evidenceCount: fact.evidenceCount + 1,
      });
      return;
    }

    // Try pattern
    const pattern = MemoryStore.getPatterns().find((p) => p.id === id);
    if (pattern) {
      MemoryStore.updatePattern(id, {
        confidence: Math.min(1, pattern.confidence + delta),
        occurrenceCount: pattern.occurrenceCount + 1,
      });
      return;
    }
  }

  // ═════════════════════════════════════════════════════════════════════
  // API: archive() — Archive a memory without deleting
  // ═════════════════════════════════════════════════════════════════════

  /**
   * Archive a memory (mark as archived, don't delete).
   */
  archive(id: string): void {
    const episode = MemoryStore.getEpisode(id);
    if (episode) {
      MemoryStore.updateEpisode(id, { archived: true });
      return;
    }
  }

  // ═════════════════════════════════════════════════════════════════════
  // API: summarize() — Get a summary of memory
  // ═════════════════════════════════════════════════════════════════════

  /**
   * Generate a summary of what's in memory.
   */
  summarize(options: SummarizeOptions = {}): string {
    const metrics = MemoryStore.getMetrics();
    const parts: string[] = [];

    parts.push(`# Memory Summary`);
    parts.push(``);
    parts.push(`**Total Memories:** ${metrics.totalMemories}`);
    parts.push(`**Facts:** ${metrics.totalFacts}`);
    parts.push(`**Patterns:** ${metrics.totalPatterns}`);
    parts.push(`**Predictions:** ${metrics.totalPredictions}`);
    parts.push(`**Graph Nodes:** ${metrics.graphNodes}`);
    parts.push(`**Graph Edges:** ${metrics.graphEdges}`);
    parts.push(`**Avg Confidence:** ${(metrics.averageConfidence * 100).toFixed(0)}%`);
    parts.push(``);

    // Recent episodes
    const recent = MemoryStore.getRecentEpisodes(options.maxItems || 5);
    if (recent.length > 0) {
      parts.push(`**Recent Activity:**`);
      recent.forEach((e) => parts.push(`- [${e.type}] ${e.summary}`));
    }

    return parts.join("\n");
  }

  // ═════════════════════════════════════════════════════════════════════
  // API: retrieveContext() — Get context for a response
  // ═════════════════════════════════════════════════════════════════════

  /**
   * Retrieve relevant context for a query/response.
   * This is what SPYRAL knows before generating.
   */
  retrieveContext(query: string = "", options: ContextOptions = {}): RetrievedContext {
    return ContextEngine.retrieve(query, options);
  }

  // ═════════════════════════════════════════════════════════════════════
  // ADDITIONAL HIGH-LEVEL API
  // ═════════════════════════════════════════════════════════════════════

  // ── Identity ────────────────────────────────────────────────────────

  /** Set user identity. */
  setIdentity(data: IdentityMemory): void {
    UserMemory.setIdentity(data);
  }

  /** Get user identity. */
  getIdentity(): IdentityMemory | null {
    return UserMemory.getIdentity();
  }

  // ── Episodes ────────────────────────────────────────────────────────

  /** Record an episode (what happened). */
  recordEpisode(
    type: EpisodeType,
    summary: string,
    details?: string,
    tags?: string[],
    importance?: number,
  ): EpisodeMemory {
    return MemoryStore.addEpisode({
      type,
      summary,
      details: details || "",
      tags: tags || [],
      importance: importance ?? 0.5,
      projectId: undefined,
      investigationId: undefined,
      relatedEpisodeIds: [],
      archived: false,
    });
  }

  /** Get recent episodes. */
  getRecentEpisodes(limit?: number): EpisodeMemory[] {
    return MemoryStore.getRecentEpisodes(limit);
  }

  // ── Semantic Facts ──────────────────────────────────────────────────

  /** Add a semantic fact (something SPYRAL learned). */
  learnFact(statement: string, category: string, source: string): SemanticFact {
    return MemoryStore.addSemanticFact({
      statement,
      category,
      confidence: 0.5,
      evidenceCount: 1,
      source,
      relatedFactIds: [],
    });
  }

  /** Get all semantic facts. */
  getFacts(): SemanticFact[] {
    return MemoryStore.getSemanticFacts();
  }

  // ── Working Memory ──────────────────────────────────────────────────

  /** Set current working memory state. */
  setWorkingMemory(data: WorkingMemory): void {
    MemoryStore.setWorkingMemory(data);
  }

  /** Get current working memory. */
  getWorkingMemory(): WorkingMemory | null {
    return MemoryStore.getWorkingMemory();
  }

  // ── Knowledge Graph ─────────────────────────────────────────────────

  /** Add a node to the knowledge graph. */
  addNode(type: NodeType, label: string, description?: string, metadata?: Record<string, string>): GraphNode {
    return KnowledgeGraph.addNode(type, label, description, metadata);
  }

  /** Add an edge to the knowledge graph. */
  addEdge(sourceId: string, targetId: string, type: EdgeType, weight?: number, metadata?: Record<string, string>): GraphEdge | undefined {
    return KnowledgeGraph.addEdge(sourceId, targetId, type, weight, metadata);
  }

  /** Get knowledge graph summary. */
  getGraphSummary() {
    return KnowledgeGraph.getSummary();
  }

  /** Get all graph nodes. */
  getNodes(): GraphNode[] {
    return KnowledgeGraph.getAllNodes();
  }

  /** Get all graph edges. */
  getEdges(): GraphEdge[] {
    return KnowledgeGraph.getAllEdges();
  }

  // ── Timeline ────────────────────────────────────────────────────────

  /** Record a timeline event. */
  recordTimeline(type: import("./types").TimelineType, title: string, description: string): TimelineEntry {
    return TimelineEngine.record(type, title, description);
  }

  // ── Projects ────────────────────────────────────────────────────────

  /** Get all projects. */
  getProjects(): ProjectMemory[] {
    return ProjectMemoryManager.getAll();
  }

  // ── Investigations ──────────────────────────────────────────────────

  /** Get all investigations. */
  getInvestigations(): InvestigationMemory[] {
    return MemoryStore.getInvestigations();
  }

  // ── Patterns ────────────────────────────────────────────────────────

  /** Get all detected patterns. */
  getPatterns(): DetectedPattern[] {
    return MemoryStore.getPatterns();
  }

  /** Run pattern detection. */
  detectPatterns(): DetectedPattern[] {
    return PatternEngine.detectAll();
  }

  // ── Consolidation ───────────────────────────────────────────────────

  /** Run memory consolidation (like sleep). */
  consolidate(): ConsolidationResult {
    const result = MemoryConsolidator.consolidate();
    return result;
  }

  /** Check if consolidation is needed. */
  shouldConsolidate(): boolean {
    return MemoryConsolidator.shouldConsolidate();
  }

  // ── Search ──────────────────────────────────────────────────────────

  /** Search across all memory types. */
  search(query: string, limit?: number): SearchResult[] {
    return SemanticSearch.search(query, limit);
  }

  // ── Metrics ─────────────────────────────────────────────────────────

  /** Get memory system metrics. */
  getMetrics(): MemoryMetrics {
    return MemoryStore.getMetrics();
  }

  /** Get full memory state (for debug/export). */
  getState(): MemoryState {
    return MemoryStore.getAllState();
  }

  // ── Agent Memory ────────────────────────────────────────────────────

  /** Share knowledge between agents. */
  shareAgentKnowledge(agentId: AgentId, fact: string, category?: string): SemanticFact {
    return AgentMemory.shareKnowledge(agentId, fact, category);
  }

  /** Get cross-agent memory context. */
  getCrossAgentContext() {
    return AgentMemory.getCrossAgentContext();
  }

  // ── Subscription ────────────────────────────────────────────────────

  /** Subscribe to memory store changes. */
  subscribe(fn: () => void): () => void {
    return MemoryStore.subscribe(fn);
  }

  // ── Reset ───────────────────────────────────────────────────────────

  /** Reset all memory (for testing). */
  reset(): void {
    MemoryStore.reset();
    MemoryIndex.invalidate();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════

/** The single MemoryEngine instance. */
export const MemoryEngine = new MemoryEngineImpl();
