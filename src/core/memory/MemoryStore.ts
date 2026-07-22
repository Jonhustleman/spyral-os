/**
 * SPYRAL OS — MemoryStore
 *
 * Base storage layer for all memory types.
 * LocalStorage persistence with subscriber pattern.
 *
 * Designed so storage backends can be swapped later:
 * PostgreSQL with pgvector, Supabase, Pinecone, etc.
 * The interface remains stable while backends change.
 */

"use client";

import type {
  MemoryState,
  EpisodeMemory,
  SemanticFact,
  ProceduralPattern,
  ProjectMemory,
  InvestigationMemory,
  GraphNode,
  GraphEdge,
  DetectedPattern,
  Prediction,
  Reflection,
  TimelineEntry,
  IdentityMemory,
  WorkingMemory,
  MemoryMetrics,
  MemoryScope,
} from "./types";

// ═══════════════════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════════════════

const PREFIX = "spyral_memory_";

const KEYS = {
  identity: `${PREFIX}identity`,
  episodes: `${PREFIX}episodes`,
  working: `${PREFIX}working`,
  semanticFacts: `${PREFIX}semantic_facts`,
  proceduralPatterns: `${PREFIX}procedural_patterns`,
  projects: `${PREFIX}projects`,
  investigations: `${PREFIX}investigations`,
  graphNodes: `${PREFIX}graph_nodes`,
  graphEdges: `${PREFIX}graph_edges`,
  patterns: `${PREFIX}patterns`,
  predictions: `${PREFIX}predictions`,
  reflections: `${PREFIX}reflections`,
  timeline: `${PREFIX}timeline`,
  metrics: `${PREFIX}metrics`,
  lastConsolidated: `${PREFIX}last_consolidated`,
} as const;

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function now(): number {
  return Date.now();
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

function remove(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

// ═══════════════════════════════════════════════════════════════════════
// SUBSCRIBER PATTERN
// ═══════════════════════════════════════════════════════════════════════

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

// ═══════════════════════════════════════════════════════════════════════
// DEFAULT STATE
// ═══════════════════════════════════════════════════════════════════════

function getDefaultMetrics(): MemoryMetrics {
  return {
    totalMemories: 0,
    totalFacts: 0,
    totalPatterns: 0,
    totalPredictions: 0,
    graphNodes: 0,
    graphEdges: 0,
    episodesThisSession: 0,
    lastConsolidation: null,
    consolidationQueue: 0,
    retrievalCount: 0,
    averageConfidence: 0,
    storageSize: 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════

export const MemoryStore = {
  // ── Lifecycle ───────────────────────────────────────────────────────

  /** Initialize storage — call once on app load. */
  init(): void {
    if (typeof window === "undefined") return;

    // Ensure all keys exist with defaults
    if (!localStorage.getItem(KEYS.metrics)) {
      save(KEYS.metrics, getDefaultMetrics());
    }
    // Touch each key to ensure they exist
    load(KEYS.episodes, []);
    load(KEYS.semanticFacts, []);
    load(KEYS.proceduralPatterns, []);
    load(KEYS.projects, []);
    load(KEYS.investigations, []);
    load(KEYS.graphNodes, []);
    load(KEYS.graphEdges, []);
    load(KEYS.patterns, []);
    load(KEYS.predictions, []);
    load(KEYS.reflections, []);
    load(KEYS.timeline, []);
  },

  /** Reset all memory data. */
  reset(): void {
    Object.values(KEYS).forEach((key) => remove(key));
    notify();
  },

  /** Subscribe to store changes. */
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  /** Get the total estimated storage size in bytes. */
  getStorageSize(): number {
    let total = 0;
    if (typeof window === "undefined") return 0;
    Object.values(KEYS).forEach((key) => {
      const val = localStorage.getItem(key);
      if (val) total += val.length * 2; // UTF-16
    });
    return total;
  },

  /** Get all state (for export/debug). */
  getAllState(): MemoryState {
    return {
      identity: load<IdentityMemory | null>(KEYS.identity, null),
      episodes: load<EpisodeMemory[]>(KEYS.episodes, []),
      working: load<WorkingMemory | null>(KEYS.working, null),
      semanticFacts: load<SemanticFact[]>(KEYS.semanticFacts, []),
      proceduralPatterns: load<ProceduralPattern[]>(KEYS.proceduralPatterns, []),
      projects: load<ProjectMemory[]>(KEYS.projects, []),
      investigations: load<InvestigationMemory[]>(KEYS.investigations, []),
      graphNodes: load<GraphNode[]>(KEYS.graphNodes, []),
      graphEdges: load<GraphEdge[]>(KEYS.graphEdges, []),
      patterns: load<DetectedPattern[]>(KEYS.patterns, []),
      predictions: load<Prediction[]>(KEYS.predictions, []),
      reflections: load<Reflection[]>(KEYS.reflections, []),
      timeline: load<TimelineEntry[]>(KEYS.timeline, []),
      metrics: load<MemoryMetrics>(KEYS.metrics, getDefaultMetrics()),
      lastConsolidated: load<number | null>(KEYS.lastConsolidated, null),
    };
  },

  // ── Identity Memory ─────────────────────────────────────────────────

  getIdentity(): IdentityMemory | null {
    return load<IdentityMemory | null>(KEYS.identity, null);
  },

  setIdentity(data: IdentityMemory): void {
    save(KEYS.identity, data);
    notify();
  },

  // ── Episodic Memory ─────────────────────────────────────────────────

  getEpisodes(): EpisodeMemory[] {
    return load<EpisodeMemory[]>(KEYS.episodes, []);
  },

  getEpisode(id: string): EpisodeMemory | undefined {
    return this.getEpisodes().find((e) => e.id === id);
  },

  addEpisode(data: Omit<EpisodeMemory, "id" | "timestamp">): EpisodeMemory {
    const all = this.getEpisodes();
    const episode: EpisodeMemory = {
      ...data,
      id: generateId(),
      timestamp: now(),
    };
    all.unshift(episode);
    save(KEYS.episodes, all);
    this._updateMetrics();
    notify();
    return episode;
  },

  updateEpisode(id: string, updates: Partial<EpisodeMemory>): EpisodeMemory | undefined {
    const all = this.getEpisodes();
    const idx = all.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...updates };
    save(KEYS.episodes, all);
    notify();
    return all[idx];
  },

  getRecentEpisodes(limit: number = 10): EpisodeMemory[] {
    return this.getEpisodes()
      .filter((e) => !e.archived)
      .slice(0, limit);
  },

  getEpisodesByType(type: string): EpisodeMemory[] {
    return this.getEpisodes().filter((e) => e.type === type);
  },

  // ── Working Memory ──────────────────────────────────────────────────

  getWorkingMemory(): WorkingMemory | null {
    return load<WorkingMemory | null>(KEYS.working, null);
  },

  setWorkingMemory(data: WorkingMemory): void {
    save(KEYS.working, { ...data, updatedAt: now() });
    notify();
  },

  updateWorkingMemory(updates: Partial<WorkingMemory>): WorkingMemory | null {
    const current = this.getWorkingMemory() || {
      currentMission: "",
      currentInvestigation: "",
      currentProject: "",
      currentObstacles: [],
      currentAssumptions: [],
      currentPriorities: [],
      currentDecisions: [],
      openQuestions: [],
      updatedAt: now(),
    };
    const updated: WorkingMemory = { ...current, ...updates, updatedAt: now() };
    save(KEYS.working, updated);
    notify();
    return updated;
  },

  // ── Semantic Memory ─────────────────────────────────────────────────

  getSemanticFacts(): SemanticFact[] {
    return load<SemanticFact[]>(KEYS.semanticFacts, []);
  },

  addSemanticFact(data: Omit<SemanticFact, "id" | "createdAt" | "lastUpdated">): SemanticFact {
    const all = this.getSemanticFacts();
    const fact: SemanticFact = {
      ...data,
      id: generateId(),
      createdAt: now(),
      lastUpdated: now(),
    };
    all.push(fact);
    save(KEYS.semanticFacts, all);
    this._updateMetrics();
    notify();
    return fact;
  },

  updateSemanticFact(id: string, updates: Partial<SemanticFact>): SemanticFact | undefined {
    const all = this.getSemanticFacts();
    const idx = all.findIndex((f) => f.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...updates, lastUpdated: now() };
    save(KEYS.semanticFacts, all);
    notify();
    return all[idx];
  },

  // ── Procedural Memory ───────────────────────────────────────────────

  getProceduralPatterns(): ProceduralPattern[] {
    return load<ProceduralPattern[]>(KEYS.proceduralPatterns, []);
  },

  addProceduralPattern(data: Omit<ProceduralPattern, "id" | "firstObserved">): ProceduralPattern {
    const all = this.getProceduralPatterns();
    const pattern: ProceduralPattern = {
      ...data,
      id: generateId(),
      firstObserved: now(),
    };
    all.push(pattern);
    save(KEYS.proceduralPatterns, all);
    notify();
    return pattern;
  },

  updateProceduralPattern(id: string, updates: Partial<ProceduralPattern>): ProceduralPattern | undefined {
    const all = this.getProceduralPatterns();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...updates, lastObserved: now() };
    save(KEYS.proceduralPatterns, all);
    notify();
    return all[idx];
  },

  // ── Project Memory ──────────────────────────────────────────────────

  getProjects(): ProjectMemory[] {
    return load<ProjectMemory[]>(KEYS.projects, []);
  },

  getProject(id: string): ProjectMemory | undefined {
    return this.getProjects().find((p) => p.id === id);
  },

  addProject(data: Omit<ProjectMemory, "id" | "createdAt" | "updatedAt">): ProjectMemory {
    const all = this.getProjects();
    const project: ProjectMemory = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    all.push(project);
    save(KEYS.projects, all);
    this._updateMetrics();
    notify();
    return project;
  },

  updateProject(id: string, updates: Partial<ProjectMemory>): ProjectMemory | undefined {
    const all = this.getProjects();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...updates, updatedAt: now() };
    save(KEYS.projects, all);
    notify();
    return all[idx];
  },

  // ── Investigation Memory ────────────────────────────────────────────

  getInvestigations(): InvestigationMemory[] {
    return load<InvestigationMemory[]>(KEYS.investigations, []);
  },

  getInvestigation(id: string): InvestigationMemory | undefined {
    return this.getInvestigations().find((i) => i.id === id);
  },

  addInvestigation(data: Omit<InvestigationMemory, "id" | "createdAt" | "updatedAt">): InvestigationMemory {
    const all = this.getInvestigations();
    const inv: InvestigationMemory = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    all.unshift(inv);
    save(KEYS.investigations, all);
    this._updateMetrics();
    notify();
    return inv;
  },

  updateInvestigation(id: string, updates: Partial<InvestigationMemory>): InvestigationMemory | undefined {
    const all = this.getInvestigations();
    const idx = all.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...updates, updatedAt: now() };
    save(KEYS.investigations, all);
    notify();
    return all[idx];
  },

  // ── Knowledge Graph ─────────────────────────────────────────────────

  getGraphNodes(): GraphNode[] {
    return load<GraphNode[]>(KEYS.graphNodes, []);
  },

  getGraphNode(id: string): GraphNode | undefined {
    return this.getGraphNodes().find((n) => n.id === id);
  },

  addGraphNode(data: Omit<GraphNode, "id" | "createdAt" | "updatedAt">): GraphNode {
    const all = this.getGraphNodes();
    const node: GraphNode = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    all.push(node);
    save(KEYS.graphNodes, all);
    this._updateMetrics();
    notify();
    return node;
  },

  updateGraphNode(id: string, updates: Partial<GraphNode>): GraphNode | undefined {
    const all = this.getGraphNodes();
    const idx = all.findIndex((n) => n.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...updates, updatedAt: now() };
    save(KEYS.graphNodes, all);
    notify();
    return all[idx];
  },

  getGraphEdges(): GraphEdge[] {
    return load<GraphEdge[]>(KEYS.graphEdges, []);
  },

  addGraphEdge(data: Omit<GraphEdge, "id" | "createdAt">): GraphEdge {
    const all = this.getGraphEdges();
    const edge: GraphEdge = {
      ...data,
      id: generateId(),
      createdAt: now(),
    };
    all.push(edge);
    save(KEYS.graphEdges, all);
    this._updateMetrics();
    notify();
    return edge;
  },

  removeGraphEdge(id: string): void {
    const all = this.getGraphEdges().filter((e) => e.id !== id);
    save(KEYS.graphEdges, all);
    this._updateMetrics();
    notify();
  },

  // ── Detected Patterns ───────────────────────────────────────────────

  getPatterns(): DetectedPattern[] {
    return load<DetectedPattern[]>(KEYS.patterns, []);
  },

  addPattern(data: Omit<DetectedPattern, "id" | "firstDetected" | "lastDetected">): DetectedPattern {
    const all = this.getPatterns();
    const now_ = now();
    const pattern: DetectedPattern = {
      ...data,
      id: generateId(),
      firstDetected: now_,
      lastDetected: now_,
    };
    all.push(pattern);
    save(KEYS.patterns, all);
    this._updateMetrics();
    notify();
    return pattern;
  },

  updatePattern(id: string, updates: Partial<DetectedPattern>): DetectedPattern | undefined {
    const all = this.getPatterns();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...updates, lastDetected: now() };
    save(KEYS.patterns, all);
    notify();
    return all[idx];
  },

  // ── Predictions ─────────────────────────────────────────────────────

  getPredictions(): Prediction[] {
    return load<Prediction[]>(KEYS.predictions, []);
  },

  addPrediction(data: Omit<Prediction, "id" | "createdAt">): Prediction {
    const all = this.getPredictions();
    const prediction: Prediction = {
      ...data,
      id: generateId(),
      createdAt: now(),
    };
    all.push(prediction);
    save(KEYS.predictions, all);
    this._updateMetrics();
    notify();
    return prediction;
  },

  updatePrediction(id: string, updates: Partial<Prediction>): Prediction | undefined {
    const all = this.getPredictions();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...updates };
    save(KEYS.predictions, all);
    notify();
    return all[idx];
  },

  // ── Reflections ─────────────────────────────────────────────────────

  getReflections(): Reflection[] {
    return load<Reflection[]>(KEYS.reflections, []);
  },

  addReflection(data: Omit<Reflection, "id" | "createdAt">): Reflection {
    const all = this.getReflections();
    const reflection: Reflection = {
      ...data,
      id: generateId(),
      createdAt: now(),
    };
    all.unshift(reflection);
    save(KEYS.reflections, all);
    notify();
    return reflection;
  },

  // ── Timeline ────────────────────────────────────────────────────────

  getTimeline(): TimelineEntry[] {
    return load<TimelineEntry[]>(KEYS.timeline, []);
  },

  addTimelineEntry(data: Omit<TimelineEntry, "id" | "timestamp">): TimelineEntry {
    const all = this.getTimeline();
    const entry: TimelineEntry = {
      ...data,
      id: generateId(),
      timestamp: now(),
    };
    all.unshift(entry);
    save(KEYS.timeline, all);
    notify();
    return entry;
  },

  getTimelineByType(type: string): TimelineEntry[] {
    return this.getTimeline().filter((t) => t.type === type);
  },

  // ── Metrics ─────────────────────────────────────────────────────────

  getMetrics(): MemoryMetrics {
    return load<MemoryMetrics>(KEYS.metrics, getDefaultMetrics());
  },

  _updateMetrics(): void {
    const metrics = this.getMetrics();
    metrics.totalMemories = this.getEpisodes().length;
    metrics.totalFacts = this.getSemanticFacts().length;
    metrics.totalPatterns = this.getPatterns().length;
    metrics.totalPredictions = this.getPredictions().length;
    metrics.graphNodes = this.getGraphNodes().length;
    metrics.graphEdges = this.getGraphEdges().length;
    metrics.storageSize = this.getStorageSize();

    // Calculate average confidence across facts and patterns
    const facts = this.getSemanticFacts();
    const patterns = this.getPatterns();
    const allConfidences = [
      ...facts.map((f) => f.confidence),
      ...patterns.map((p) => p.confidence),
    ];
    metrics.averageConfidence = allConfidences.length > 0
      ? allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length
      : 0;

    save(KEYS.metrics, metrics);
  },

  // ── Semantic Search (simple keyword-based for now) ──────────────────

  /**
   * Simple keyword search across semantic facts.
   * Will be replaced with vector/embedding-based search later.
   */
  searchFacts(query: string, limit: number = 10): SemanticFact[] {
    const q = query.toLowerCase();
    return this.getSemanticFacts()
      .filter((f) =>
        f.statement.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.source.toLowerCase().includes(q)
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  },

  /** Delete a memory item by id across all stores. */
  deleteById(id: string): boolean {
    // Search across all stores
    const stores = [
      { items: this.getEpisodes(), save: (d: any[]) => save(KEYS.episodes, d) },
      { items: this.getSemanticFacts(), save: (d: any[]) => save(KEYS.semanticFacts, d) },
      { items: this.getPatterns(), save: (d: any[]) => save(KEYS.patterns, d) },
      { items: this.getPredictions(), save: (d: any[]) => save(KEYS.predictions, d) },
      { items: this.getProjects(), save: (d: any[]) => save(KEYS.projects, d) },
      { items: this.getInvestigations(), save: (d: any[]) => save(KEYS.investigations, d) },
      { items: this.getGraphNodes(), save: (d: any[]) => save(KEYS.graphNodes, d) },
      { items: this.getGraphEdges(), save: (d: any[]) => save(KEYS.graphEdges, d) },
    ];

    for (const store of stores) {
      const idx = store.items.findIndex((item: any) => item.id === id);
      if (idx !== -1) {
        store.items.splice(idx, 1);
        store.save(store.items);
        this._updateMetrics();
        notify();
        return true;
      }
    }
    return false;
  },
};
