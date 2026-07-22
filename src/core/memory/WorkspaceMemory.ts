/**
 * SPYRAL OS — WorkspaceMemory
 *
 * Workspace-scoped memory.
 * Keeps data separate between different workspaces.
 */

"use client";

import { MemoryStore } from "./MemoryStore";
import { KnowledgeGraph } from "./KnowledgeGraph";
import { TimelineEngine } from "./TimelineEngine";
import type { EpisodeMemory } from "./types";

export const WorkspaceMemory = {
  /**
   * Initialize workspace memory.
   */
  init(workspaceId: string, workspaceName: string): void {
    // Add workspace node to knowledge graph
    KnowledgeGraph.addNode("project", workspaceName, `Workspace: ${workspaceName}`);

    TimelineEngine.record("personal", "Workspace initialized", workspaceName);
  },

  /**
   * Record a workspace-level event.
   */
  recordEvent(summary: string, details: string = "", tags: string[] = []): EpisodeMemory {
    return MemoryStore.addEpisode({
      type: "conversation",
      summary,
      details,
      tags,
      importance: 0.4,
      projectId: undefined,
      investigationId: undefined,
      relatedEpisodeIds: [],
      archived: false,
    });
  },

  /**
   * Get workspace-level episodes.
   */
  getEvents(limit: number = 20): EpisodeMemory[] {
    return MemoryStore.getRecentEpisodes(limit);
  },

  /**
   * Search workspace memory.
   */
  search(query: string): any[] {
    const { SemanticSearch } = require("./SemanticSearch");
    return SemanticSearch.search(query, 20);
  },
};
