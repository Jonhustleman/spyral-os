/**
 * ProductKnowledgeGraph — SPYRAL's Internal Memory About Itself
 *
 * Phase G.0 — RULE #11
 *
 * Nodes: Features, Experiments, Friction, Sessions, Learning, Releases,
 * Evidence, Recommendations
 *
 * This becomes SPYRAL's memory about itself — queryable, searchable,
 * and used by all Product Intelligence engines.
 *
 * Edges connect related nodes forming a graph of product understanding.
 */

"use client";

import { ExperienceRecorder, type ExperienceEventType, type ExperienceSession } from "./ExperienceRecorder";

// ─── Types ─────────────────────────────────────────────────────────────

export type NodeType =
  | "feature"
  | "experiment"
  | "friction"
  | "session"
  | "learning"
  | "release"
  | "evidence"
  | "recommendation"
  | "pattern";

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  tags: string[];
  confidence: number; // 0-1
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, string | number | boolean>;
  edgeIds: string[]; // IDs of connected edges
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: string; // e.g., "causes", "relates_to", "improves", "measures"
  weight: number; // 0-1
  createdAt: number;
}

export interface KnowledgeGraphSnapshot {
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodeCount: number;
  edgeCount: number;
  lastIndexed: number;
}

// ─── Storage ───────────────────────────────────────────────────────────

const STORAGE_KEY_NODES = "spyral_kg_nodes";
const STORAGE_KEY_EDGES = "spyral_kg_edges";

function generateId(): string {
  return `kg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

// ─── Graph Engine ──────────────────────────────────────────────────────

export const ProductKnowledgeGraph = {
  // ── Node Management ───────────────────────────────────────────────

  /**
   * Add or update a node in the knowledge graph.
   */
  upsertNode(node: Omit<GraphNode, "id" | "createdAt" | "updatedAt" | "edgeIds"> & { id?: string }): GraphNode {
    const nodes = this.getNodes();
    const existing = node.id ? nodes.find((n) => n.id === node.id) : null;

    const graphNode: GraphNode = existing
      ? { ...existing, ...node, updatedAt: Date.now() }
      : {
          ...node,
          id: node.id ?? generateId(),
          edgeIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

    if (existing) {
      const idx = nodes.findIndex((n) => n.id === existing.id);
      nodes[idx] = graphNode;
    } else {
      nodes.unshift(graphNode);
    }

    save(STORAGE_KEY_NODES, nodes);
    return graphNode;
  },

  /**
   * Get all nodes in the graph.
   */
  getNodes(): GraphNode[] {
    return load<GraphNode[]>(STORAGE_KEY_NODES, []);
  },

  /**
   * Get nodes by type.
   */
  getNodesByType(type: NodeType): GraphNode[] {
    return this.getNodes().filter((n) => n.type === type);
  },

  /**
   * Get a single node by ID.
   */
  getNode(id: string): GraphNode | undefined {
    return this.getNodes().find((n) => n.id === id);
  },

  /**
   * Search nodes by label or description.
   */
  searchNodes(query: string): GraphNode[] {
    const lower = query.toLowerCase();
    return this.getNodes().filter(
      (n) =>
        n.label.toLowerCase().includes(lower) ||
        n.description.toLowerCase().includes(lower) ||
        n.tags.some((t) => t.toLowerCase().includes(lower)),
    );
  },

  // ── Edge Management ───────────────────────────────────────────────

  /**
   * Create an edge between two nodes.
   */
  createEdge(sourceId: string, targetId: string, relationship: string, weight: number = 0.5): GraphEdge {
    const edges = this.getEdges();
    const edge: GraphEdge = {
      id: generateId(),
      sourceId,
      targetId,
      relationship,
      weight: Math.max(0, Math.min(1, weight)),
      createdAt: Date.now(),
    };
    edges.push(edge);
    save(STORAGE_KEY_EDGES, edges);

    // Update edge references on both nodes
    const nodes = this.getNodes();
    const sourceNode = nodes.find((n) => n.id === sourceId);
    const targetNode = nodes.find((n) => n.id === targetId);
    if (sourceNode && !sourceNode.edgeIds.includes(edge.id)) {
      sourceNode.edgeIds.push(edge.id);
    }
    if (targetNode && !targetNode.edgeIds.includes(edge.id)) {
      targetNode.edgeIds.push(edge.id);
    }
    save(STORAGE_KEY_NODES, nodes);

    return edge;
  },

  /**
   * Get all edges in the graph.
   */
  getEdges(): GraphEdge[] {
    return load<GraphEdge[]>(STORAGE_KEY_EDGES, []);
  },

  /**
   * Find all edges connected to a node.
   */
  getEdgesForNode(nodeId: string): GraphEdge[] {
    return this.getEdges().filter((e) => e.sourceId === nodeId || e.targetId === nodeId);
  },

  /**
   * Get neighboring nodes (connected by edges).
   */
  getNeighbors(nodeId: string): GraphNode[] {
    const edges = this.getEdgesForNode(nodeId);
    const neighborIds = edges.map((e) => (e.sourceId === nodeId ? e.targetId : e.sourceId));
    return this.getNodes().filter((n) => neighborIds.includes(n.id));
  },

  // ── Auto-Indexing ─────────────────────────────────────────────────

  /**
   * Index sessions into the knowledge graph.
   */
  indexSessions(): number {
    const sessions = ExperienceRecorder.getSessions();
    let indexed = 0;

    for (const session of sessions) {
      // Check if this session is already indexed
      const existing = this.getNodes().find(
        (n) => n.type === "session" && n.metadata.sessionId === session.id,
      );
      if (existing) continue;

      this.upsertNode({
        type: "session",
        label: `Session ${session.id.slice(-8)}`,
        description: `Session on ${session.page || "unknown page"} lasting ${session.duration ? Math.round(session.duration / 1000) + 's' : 'ongoing'}`,
        tags: ["session", session.page || "unknown", session.completed ? "completed" : "incomplete"],
        confidence: 0.9,
        metadata: {
          sessionId: session.id,
          page: session.page || "",
          agentType: session.agentType || "",
          duration: session.duration || 0,
          completed: session.completed,
          returnedLater: session.returnedLater,
          projectCreated: session.projectCreated || false,
          assetsGenerated: session.assetsGenerated || false,
        },
      });
      indexed++;
    }

    return indexed;
  },

  /**
   * Index friction patterns from XAE into the graph.
   */
  indexFrictions(frictions: { observedFriction: string; confidence: number; likelyCause: string }[]): number {
    let indexed = 0;
    for (const f of frictions) {
      const existing = this.getNodes().find(
        (n) => n.type === "friction" && n.label === f.observedFriction.slice(0, 60),
      );
      if (existing) {
        // Update confidence
        this.upsertNode({ ...existing, confidence: f.confidence });
        continue;
      }

      const node = this.upsertNode({
        type: "friction",
        label: f.observedFriction.slice(0, 60),
        description: f.observedFriction,
        tags: ["friction", "ux"],
        confidence: f.confidence,
        metadata: { likelyCause: f.likelyCause },
      });

      // Link to related sessions
      const sessions = this.getNodesByType("session").slice(0, 5);
      for (const s of sessions) {
        this.createEdge(node.id, s.id, "observed_in", 0.5);
      }
      indexed++;
    }
    return indexed;
  },

  /**
   * Index recommendations from IRE into the graph.
   */
  indexRecommendations(recommendations: { observation: string; confidence: number; category: string }[]): number {
    let indexed = 0;
    for (const r of recommendations) {
      const existing = this.getNodes().find(
        (n) => n.type === "recommendation" && n.label === r.observation.slice(0, 60),
      );
      if (existing) continue;

      const node = this.upsertNode({
        type: "recommendation",
        label: r.observation.slice(0, 60),
        description: r.observation,
        tags: ["recommendation", r.category],
        confidence: r.confidence,
        metadata: { category: r.category },
      });

      // Link to friction nodes with similar content
      const frictions = this.getNodesByType("friction").filter((f) =>
        f.description.toLowerCase().includes(r.observation.slice(0, 20).toLowerCase()),
      );
      for (const f of frictions) {
        this.createEdge(node.id, f.id, "addresses", 0.7);
      }
      indexed++;
    }
    return indexed;
  },

  /**
   * Index experiments from PRE into the graph.
   */
  indexExperiments(experiments: { name: string; hypothesis: string; status: string }[]): number {
    let indexed = 0;
    for (const exp of experiments) {
      const existing = this.getNodes().find(
        (n) => n.type === "experiment" && n.label === exp.name,
      );
      if (existing) continue;

      this.upsertNode({
        type: "experiment",
        label: exp.name,
        description: exp.hypothesis,
        tags: ["experiment", exp.status],
        confidence: 0.5,
        metadata: { status: exp.status },
      });
      indexed++;
    }
    return indexed;
  },

  /**
   * Run full indexing — pull from all engines into the graph.
   */
  runFullIndex(): { nodesIndexed: number; edgesCreated: number } {
    let nodesIndexed = 0;
    const edgeCountBefore = this.getEdges().length;

    nodesIndexed += this.indexSessions();

    // Import from other engines
    try {
      const { ExperienceAdaptationEngine } = require("./ExperienceAdaptationEngine");
      const frictions = ExperienceAdaptationEngine.getFrictionRecommendations();
      nodesIndexed += this.indexFrictions(
        frictions.map((f: any) => ({
          observedFriction: f.observedFriction,
          confidence: f.confidence,
          likelyCause: f.likelyCause,
        })),
      );
    } catch {}

    try {
      const { ImprovementRecommendationEngine } = require("./ImprovementRecommendationEngine");
      const recs = ImprovementRecommendationEngine.getRecommendations();
      nodesIndexed += this.indexRecommendations(
        recs.map((r: any) => ({
          observation: r.observation,
          confidence: r.confidence,
          category: r.category,
        })),
      );
    } catch {}

    try {
      const { ProductResearchEngine } = require("./ProductResearchEngine");
      const questions = ProductResearchEngine.getResearchQuestions();
      const experiments: { name: string; hypothesis: string; status: string }[] = [];
      for (const q of questions) {
        for (const h of q.hypotheses) {
          for (const e of h.experiments) {
            experiments.push({ name: e.name, hypothesis: e.hypothesis, status: e.status });
          }
        }
      }
      nodesIndexed += this.indexExperiments(experiments);
    } catch {}

    const edgesCreated = this.getEdges().length - edgeCountBefore;
    return { nodesIndexed, edgesCreated };
  },

  // ── Analytics ─────────────────────────────────────────────────────

  /**
   * Get a full snapshot of the graph.
   */
  getSnapshot(): KnowledgeGraphSnapshot {
    const nodes = this.getNodes();
    const edges = this.getEdges();
    return {
      nodes,
      edges,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      lastIndexed: Date.now(),
    };
  },

  /**
   * Count nodes by type.
   */
  countByType(): Record<NodeType, number> {
    const nodes = this.getNodes();
    const counts: Record<string, number> = {};
    for (const n of nodes) {
      counts[n.type] = (counts[n.type] ?? 0) + 1;
    }
    return counts as Record<NodeType, number>;
  },

  /**
   * Find the most connected node.
   */
  getMostConnectedNode(): GraphNode | null {
    const nodes = this.getNodes();
    if (nodes.length === 0) return null;
    return nodes.reduce((max, n) => (n.edgeIds.length > max.edgeIds.length ? n : max));
  },

  /**
   * Clear all graph data.
   */
  clearAll(): void {
    save(STORAGE_KEY_NODES, []);
    save(STORAGE_KEY_EDGES, []);
  },

  /**
   * Get total node count.
   */
  getNodeCount(): number {
    return this.getNodes().length;
  },

  /**
   * Get total edge count.
   */
  getEdgeCount(): number {
    return this.getEdges().length;
  },
};
