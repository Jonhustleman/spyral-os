/**
 * SPYRAL OS — MemoryIndex
 *
 * In-memory index for fast retrieval of memories.
 * Built on load, updated on changes.
 *
 * Indexes:
 * - Episodes by type, tag, projectId
 * - Facts by category
 * - Patterns by category
 * - Graph nodes by type
 * - Timeline by type
 *
 * This is the retrieval layer that enables
 * "most relevant, most recent, most similar, most important" queries.
 */

"use client";

import { MemoryStore } from "./MemoryStore";
import type {
  EpisodeMemory,
  SemanticFact,
  DetectedPattern,
  GraphNode,
  TimelineEntry,
  InvestigationMemory,
  ProjectMemory,
} from "./types";

interface MemoryIndexData {
  episodesByType: Map<string, EpisodeMemory[]>;
  episodesByTag: Map<string, EpisodeMemory[]>;
  episodesByProject: Map<string, EpisodeMemory[]>;
  factsByCategory: Map<string, SemanticFact[]>;
  patternsByCategory: Map<string, DetectedPattern[]>;
  nodesByType: Map<string, GraphNode[]>;
  timelineByType: Map<string, TimelineEntry[]>;
  allImportant: { item: any; importance: number; timestamp: number; type: string }[];
  lastBuilt: number;
}

let index: MemoryIndexData | null = null;

export const MemoryIndex = {
  /** Build or rebuild the index from stored data. */
  build(): void {
    const episodes = MemoryStore.getEpisodes();
    const facts = MemoryStore.getSemanticFacts();
    const patterns = MemoryStore.getPatterns();
    const nodes = MemoryStore.getGraphNodes();
    const timeline = MemoryStore.getTimeline();

    const episodesByType = new Map<string, EpisodeMemory[]>();
    const episodesByTag = new Map<string, EpisodeMemory[]>();
    const episodesByProject = new Map<string, EpisodeMemory[]>();
    const factsByCategory = new Map<string, SemanticFact[]>();
    const patternsByCategory = new Map<string, DetectedPattern[]>();
    const nodesByType = new Map<string, GraphNode[]>();
    const timelineByType = new Map<string, TimelineEntry[]>();
    const allImportant: { item: any; importance: number; timestamp: number; type: string }[] = [];

    // Index episodes
    for (const ep of episodes) {
      // By type
      const byType = episodesByType.get(ep.type) || [];
      byType.push(ep);
      episodesByType.set(ep.type, byType);

      // By tag
      for (const tag of ep.tags) {
        const byTag = episodesByTag.get(tag) || [];
        byTag.push(ep);
        episodesByTag.set(tag, byTag);
      }

      // By project
      if (ep.projectId) {
        const byProject = episodesByProject.get(ep.projectId) || [];
        byProject.push(ep);
        episodesByProject.set(ep.projectId, byProject);
      }

      // Importance queue
      allImportant.push({ item: ep, importance: ep.importance, timestamp: ep.timestamp, type: "episode" });
    }

    // Index facts
    for (const fact of facts) {
      const byCategory = factsByCategory.get(fact.category) || [];
      byCategory.push(fact);
      factsByCategory.set(fact.category, byCategory);
      allImportant.push({ item: fact, importance: fact.confidence, timestamp: fact.createdAt, type: "fact" });
    }

    // Index patterns
    for (const p of patterns) {
      const byCategory = patternsByCategory.get(p.category) || [];
      byCategory.push(p);
      patternsByCategory.set(p.category, byCategory);
      allImportant.push({ item: p, importance: p.confidence, timestamp: p.lastDetected, type: "pattern" });
    }

    // Index nodes
    for (const node of nodes) {
      const byType = nodesByType.get(node.type) || [];
      byType.push(node);
      nodesByType.set(node.type, byType);
    }

    // Index timeline
    for (const entry of timeline) {
      const byType = timelineByType.get(entry.type) || [];
      byType.push(entry);
      timelineByType.set(entry.type, byType);
      allImportant.push({ item: entry, importance: entry.importance, timestamp: entry.timestamp, type: "timeline" });
    }

    // Sort importance queue
    allImportant.sort((a, b) => b.importance - a.importance || b.timestamp - a.timestamp);

    index = {
      episodesByType,
      episodesByTag,
      episodesByProject,
      factsByCategory,
      patternsByCategory,
      nodesByType,
      timelineByType,
      allImportant,
      lastBuilt: Date.now(),
    };
  },

  /** Ensure index is built. */
  ensureBuilt(): void {
    if (!index) this.build();
  },

  /** Invalidate index (call after mutations). */
  invalidate(): void {
    index = null;
  },

  // ── Queries ─────────────────────────────────────────────────────────

  /** Get episodes by type. */
  getEpisodesByType(type: string): EpisodeMemory[] {
    this.ensureBuilt();
    return index!.episodesByType.get(type) || [];
  },

  /** Get episodes by tag. */
  getEpisodesByTag(tag: string): EpisodeMemory[] {
    this.ensureBuilt();
    return index!.episodesByTag.get(tag) || [];
  },

  /** Get episodes by project. */
  getEpisodesByProject(projectId: string): EpisodeMemory[] {
    this.ensureBuilt();
    return index!.episodesByProject.get(projectId) || [];
  },

  /** Get facts by category. */
  getFactsByCategory(category: string): SemanticFact[] {
    this.ensureBuilt();
    return index!.factsByCategory.get(category) || [];
  },

  /** Get patterns by category. */
  getPatternsByCategory(category: string): DetectedPattern[] {
    this.ensureBuilt();
    return index!.patternsByCategory.get(category) || [];
  },

  /** Get nodes by type. */
  getNodesByType(type: string): GraphNode[] {
    this.ensureBuilt();
    return index!.nodesByType.get(type) || [];
  },

  /** Get timeline entries by type. */
  getTimelineByType(type: string): TimelineEntry[] {
    this.ensureBuilt();
    return index!.timelineByType.get(type) || [];
  },

  /**
   * Get the most important items across all memory types.
   */
  getMostImportant(limit: number = 20): { item: any; type: string }[] {
    this.ensureBuilt();
    return index!.allImportant.slice(0, limit).map(({ item, type }) => ({ item, type }));
  },

  /**
   * Get the most recent items across all memory types.
   */
  getMostRecent(limit: number = 20): { item: any; type: string; timestamp: number }[] {
    this.ensureBuilt();
    return [...index!.allImportant]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .map(({ item, type, timestamp }) => ({ item, type, timestamp }));
  },

  /** Get index build time. */
  getLastBuilt(): number {
    return index?.lastBuilt ?? 0;
  },

  /** Get index stats. */
  getStats(): { episodesIndexed: number; factsIndexed: number; patternsIndexed: number; nodesIndexed: number; timelineIndexed: number } {
    this.ensureBuilt();
    return {
      episodesIndexed: index!.episodesByType.size,
      factsIndexed: index!.factsByCategory.size,
      patternsIndexed: index!.patternsByCategory.size,
      nodesIndexed: index!.nodesByType.size,
      timelineIndexed: index!.timelineByType.size,
    };
  },
};
