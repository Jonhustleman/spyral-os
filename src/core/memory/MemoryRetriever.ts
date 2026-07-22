/**
 * SPYRAL OS — MemoryRetriever
 *
 * Retrieves memories based on:
 * - Most Relevant (semantic similarity)
 * - Most Recent (timestamp)
 * - Most Similar (category/type matching)
 * - Most Important (importance score)
 * - Highest Confidence
 *
 * Never retrieves everything.
 */

"use client";

import { MemoryStore } from "./MemoryStore";
import { MemoryIndex } from "./MemoryIndex";
import { SemanticSearch } from "./SemanticSearch";
import type {
  EpisodeMemory,
  SemanticFact,
  DetectedPattern,
  GraphNode,
  InvestigationMemory,
  ProjectMemory,
  RecallOptions,
  TimelineEntry,
} from "./types";

export interface RetrievedMemory {
  episodes: EpisodeMemory[];
  facts: SemanticFact[];
  patterns: DetectedPattern[];
  nodes: GraphNode[];
  investigations: InvestigationMemory[];
  projects: ProjectMemory[];
  timeline: TimelineEntry[];
}

export const MemoryRetriever = {
  /**
   * Retrieve memories based on a query and options.
   */
  retrieve(query: string, options: RecallOptions = {}): RetrievedMemory {
    const {
      limit = 10,
      minConfidence = 0,
      tags,
    } = options;

    let episodes = MemoryStore.getEpisodes();
    let facts = MemoryStore.getSemanticFacts();
    let patterns = MemoryStore.getPatterns();
    let nodes = MemoryStore.getGraphNodes();
    let investigations = MemoryStore.getInvestigations();
    let projects = MemoryStore.getProjects();
    const timeline = MemoryStore.getTimeline();

    // Filter by minimum confidence
    if (minConfidence > 0) {
      facts = facts.filter((f) => f.confidence >= minConfidence);
      patterns = patterns.filter((p) => p.confidence >= minConfidence);
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      episodes = episodes.filter((e) => tags.some((t) => e.tags.includes(t)));
    }

    // If query is provided, use semantic search to find the most relevant
    if (query) {
      const searchResults = SemanticSearch.search(query, limit * 3);

      // Extract IDs from search results
      const episodeIds = new Set<string>();
      const factIds = new Set<string>();
      const patternIds = new Set<string>();
      const nodeIds = new Set<string>();

      for (const result of searchResults) {
        switch (result.type) {
          case "episode": episodeIds.add(result.id); break;
          case "fact": factIds.add(result.id); break;
          case "pattern": patternIds.add(result.id); break;
          case "node": nodeIds.add(result.id); break;
        }
      }

      // Filter by relevance
      if (episodeIds.size > 0) {
        episodes = episodes.filter((e) => episodeIds.has(e.id));
      }
      if (factIds.size > 0) {
        facts = facts.filter((f) => factIds.has(f.id));
      }
      if (patternIds.size > 0) {
        patterns = patterns.filter((p) => patternIds.has(p.id));
      }
      if (nodeIds.size > 0) {
        nodes = nodes.filter((n) => nodeIds.has(n.id));
      }
    }

    // Sort by confidence/importance and limit
    facts.sort((a, b) => b.confidence - a.confidence);
    patterns.sort((a, b) => b.confidence - a.confidence);
    episodes.sort((a, b) => b.importance - a.importance || b.timestamp - a.timestamp);
    investigations.sort((a, b) => b.updatedAt - a.updatedAt);
    projects.sort((a, b) => (a.status === "active" ? -1 : 1));

    return {
      episodes: episodes.slice(0, limit),
      facts: facts.slice(0, limit),
      patterns: patterns.slice(0, limit),
      nodes: nodes.slice(0, limit),
      investigations: investigations.slice(0, limit),
      projects: projects.slice(0, limit),
      timeline: timeline.slice(0, limit),
    };
  },

  /**
   * Get the most recent items regardless of type.
   */
  recent(limit: number = 10): RetrievedMemory {
    return this.retrieve("", { limit });
  },

  /**
   * Get the highest confidence facts.
   */
  highConfidenceFacts(limit: number = 10): SemanticFact[] {
    return MemoryStore.getSemanticFacts()
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  },

  /**
   * Get the most important episodes.
   */
  importantEpisodes(limit: number = 10): EpisodeMemory[] {
    return MemoryStore.getEpisodes()
      .filter((e) => !e.archived)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  },
};
