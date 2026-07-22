/**
 * SPYRAL OS — KnowledgeGraph
 *
 * The center of SPYRAL's memory.
 * Nodes represent entities (projects, people, companies, etc.)
 * Edges represent relationships between them.
 *
 * Every interaction updates this graph.
 */

"use client";

import { MemoryStore } from "./MemoryStore";
import type { GraphNode, GraphEdge, NodeType, EdgeType } from "./types";

export const KnowledgeGraph = {
  // ── Node Operations ─────────────────────────────────────────────────

  /**
   * Add a node to the knowledge graph.
   * If a node with the same type and label exists, returns it instead.
   */
  addNode(
    type: NodeType,
    label: string,
    description: string = "",
    metadata: Record<string, string> = {},
  ): GraphNode {
    // Check for existing node with same type + label (case-insensitive)
    const existing = this.findNode(type, label);
    if (existing) {
      // Update description and metadata
      return MemoryStore.updateGraphNode(existing.id, {
        description: description || existing.description,
        metadata: { ...existing.metadata, ...metadata },
      })!;
    }

    return MemoryStore.addGraphNode({
      type,
      label,
      description,
      metadata,
    });
  },

  /** Get a node by ID. */
  getNode(id: string): GraphNode | undefined {
    return MemoryStore.getGraphNode(id);
  },

  /** Find a node by type and label. */
  findNode(type: NodeType, label: string): GraphNode | undefined {
    return MemoryStore.getGraphNodes().find(
      (n) => n.type === type && n.label.toLowerCase() === label.toLowerCase(),
    );
  },

  /** Search nodes by query string. */
  searchNodes(query: string): GraphNode[] {
    const q = query.toLowerCase();
    return MemoryStore.getGraphNodes().filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q),
    );
  },

  /** Get all nodes of a specific type. */
  getNodesByType(type: NodeType): GraphNode[] {
    return MemoryStore.getGraphNodes().filter((n) => n.type === type);
  },

  /** Get all nodes. */
  getAllNodes(): GraphNode[] {
    return MemoryStore.getGraphNodes();
  },

  /** Update a node's metadata. */
  updateNodeMetadata(id: string, metadata: Record<string, string>): GraphNode | undefined {
    const node = this.getNode(id);
    if (!node) return undefined;
    return MemoryStore.updateGraphNode(id, {
      metadata: { ...node.metadata, ...metadata },
    });
  },

  // ── Edge Operations ─────────────────────────────────────────────────

  /**
   * Add a relationship (edge) between two nodes.
   * Prevents duplicate edges of the same type between same nodes.
   */
  addEdge(
    sourceId: string,
    targetId: string,
    type: EdgeType,
    weight: number = 0.5,
    metadata: Record<string, string> = {},
  ): GraphEdge | undefined {
    // Validate nodes exist
    if (!this.getNode(sourceId) || !this.getNode(targetId)) return undefined;

    // Check for existing edge of same type between these nodes
    const existing = MemoryStore.getGraphEdges().find(
      (e) => e.sourceId === sourceId && e.targetId === targetId && e.type === type,
    );
    if (existing) {
      // Update weight
      MemoryStore.removeGraphEdge(existing.id);
    }

    return MemoryStore.addGraphEdge({
      sourceId,
      targetId,
      type,
      weight: Math.max(0, Math.min(1, weight)),
      metadata,
    });
  },

  /** Remove an edge. */
  removeEdge(id: string): void {
    MemoryStore.removeGraphEdge(id);
  },

  /** Get all edges connected to a node (incoming + outgoing). */
  getNodeEdges(nodeId: string): GraphEdge[] {
    return MemoryStore.getGraphEdges().filter(
      (e) => e.sourceId === nodeId || e.targetId === nodeId,
    );
  },

  /** Get neighboring nodes of a given node. */
  getNeighbors(nodeId: string): { node: GraphNode; edge: GraphEdge; direction: "incoming" | "outgoing" }[] {
    const edges = this.getNodeEdges(nodeId);
    const allNodes = MemoryStore.getGraphNodes();
    const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

    return edges
      .map((edge) => {
        if (edge.sourceId === nodeId) {
          const target = nodeMap.get(edge.targetId);
          return target ? { node: target, edge, direction: "outgoing" as const } : null;
        }
        const source = nodeMap.get(edge.sourceId);
        return source ? { node: source, edge, direction: "incoming" as const } : null;
      })
      .filter(Boolean) as { node: GraphNode; edge: GraphEdge; direction: "incoming" | "outgoing" }[];
  },

  /** Get all edges. */
  getAllEdges(): GraphEdge[] {
    return MemoryStore.getGraphEdges();
  },

  /** Get edges of a specific type. */
  getEdgesByType(type: EdgeType): GraphEdge[] {
    return MemoryStore.getGraphEdges().filter((e) => e.type === type);
  },

  // ── Graph Analysis ──────────────────────────────────────────────────

  /**
   * Find paths between two nodes (simple BFS).
   * Returns array of paths, each path is an array of edge IDs.
   */
  findPath(sourceId: string, targetId: string, maxDepth: number = 5): string[][] {
    const edges = MemoryStore.getGraphEdges();
    const adjacency = new Map<string, { nodeId: string; edgeId: string }[]>();

    for (const edge of edges) {
      const from = adjacency.get(edge.sourceId) || [];
      from.push({ nodeId: edge.targetId, edgeId: edge.id });
      adjacency.set(edge.sourceId, from);

      // Bidirectional traversal
      const to = adjacency.get(edge.targetId) || [];
      to.push({ nodeId: edge.sourceId, edgeId: edge.id });
      adjacency.set(edge.targetId, to);
    }

    const paths: string[][] = [];
    const visited = new Set<string>();

    function dfs(currentId: string, targetId: string, pathEdges: string[], depth: number) {
      if (depth > maxDepth) return;
      if (currentId === targetId) {
        paths.push([...pathEdges]);
        return;
      }
      visited.add(currentId);
      const neighbors = adjacency.get(currentId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.nodeId)) {
          pathEdges.push(neighbor.edgeId);
          dfs(neighbor.nodeId, targetId, pathEdges, depth + 1);
          pathEdges.pop();
        }
      }
      visited.delete(currentId);
    }

    dfs(sourceId, targetId, [], 0);
    return paths;
  },

  /**
   * Find the most connected nodes (hub nodes).
   */
  getHubNodes(limit: number = 10): { node: GraphNode; connectionCount: number }[] {
    const edgeCount = new Map<string, number>();
    for (const edge of MemoryStore.getGraphEdges()) {
      edgeCount.set(edge.sourceId, (edgeCount.get(edge.sourceId) || 0) + 1);
      edgeCount.set(edge.targetId, (edgeCount.get(edge.targetId) || 0) + 1);
    }

    return [...edgeCount.entries()]
      .map(([nodeId, count]) => ({
        node: this.getNode(nodeId)!,
        connectionCount: count,
      }))
      .filter((n) => n.node)
      .sort((a, b) => b.connectionCount - a.connectionCount)
      .slice(0, limit);
  },

  /**
   * Get isolated nodes (nodes with no edges).
   */
  getIsolatedNodes(): GraphNode[] {
    const connectedIds = new Set<string>();
    for (const edge of MemoryStore.getGraphEdges()) {
      connectedIds.add(edge.sourceId);
      connectedIds.add(edge.targetId);
    }
    return MemoryStore.getGraphNodes().filter((n) => !connectedIds.has(n.id));
  },

  /**
   * Get the graph summary for display.
   */
  getSummary(): { nodeCount: number; edgeCount: number; nodeTypeCounts: Record<string, number>; hubNodes: { label: string; connections: number }[] } {
    const nodes = this.getAllNodes();
    const edges = this.getAllEdges();
    const nodeTypeCounts: Record<string, number> = {};

    for (const node of nodes) {
      nodeTypeCounts[node.type] = (nodeTypeCounts[node.type] || 0) + 1;
    }

    const hubs = this.getHubNodes(5).map((h) => ({
      label: h.node.label,
      connections: h.connectionCount,
    }));

    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodeTypeCounts,
      hubNodes: hubs,
    };
  },
};
