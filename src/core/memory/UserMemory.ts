/**
 * SPYRAL OS — UserMemory
 *
 * User-specific memory management.
 * Stores separately from workspace and project memory.
 * Never leaks between users.
 */

"use client";

import { MemoryStore } from "./MemoryStore";
import { KnowledgeGraph } from "./KnowledgeGraph";
import type { IdentityMemory, EpisodeMemory } from "./types";

export const UserMemory = {
  /**
   * Set user identity.
   */
  setIdentity(data: IdentityMemory): void {
    MemoryStore.setIdentity(data);

    // Add/update knowledge graph node for this user
    KnowledgeGraph.addNode("person", data.name, `${data.role} at ${data.company}`, {
      role: data.role,
      company: data.company,
      industry: data.industry,
    });
  },

  /**
   * Get user identity.
   */
  getIdentity(): IdentityMemory | null {
    return MemoryStore.getIdentity();
  },

  /**
   * Update user identity (partial).
   */
  updateIdentity(updates: Partial<IdentityMemory>): IdentityMemory | null {
    const current = this.getIdentity();
    if (!current) return null;

    const updated: IdentityMemory = { ...current, ...updates };
    MemoryStore.setIdentity(updated);

    // Update knowledge graph node
    const existing = KnowledgeGraph.findNode("person", current.name);
    if (existing) {
      KnowledgeGraph.updateNodeMetadata(existing.id, {
        role: updated.role,
        company: updated.company,
        industry: updated.industry,
      });
    }

    return updated;
  },

  /**
   * Record a user action as an episode.
   */
  recordAction(
    type: EpisodeMemory["type"],
    summary: string,
    details: string = "",
    tags: string[] = [],
  ): EpisodeMemory {
    return MemoryStore.addEpisode({
      type,
      summary,
      details,
      tags,
      importance: 0.5,
      projectId: undefined,
      investigationId: undefined,
      relatedEpisodeIds: [],
      archived: false,
    });
  },

  /**
   * Get recent user actions.
   */
  getRecentActions(limit: number = 10): EpisodeMemory[] {
    return MemoryStore.getRecentEpisodes(limit);
  },

  /**
   * Get the user's learning preferences (from identity + patterns).
   */
  getPreferences(): {
    thinkingStyle: string;
    writingStyle: string;
    commonTopics: string[];
    workingHours: string;
  } {
    const identity = this.getIdentity();
    const patterns = MemoryStore.getPatterns();

    // Detect common topics from interest patterns
    const interestPatterns = patterns.filter((p) => p.category === "interest");
    const commonTopics = interestPatterns
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map((p) => p.pattern.replace("Interest in ", ""));

    return {
      thinkingStyle: identity?.preferredThinkingStyle || "Unknown",
      writingStyle: identity?.preferredWritingStyle || "Unknown",
      commonTopics,
      workingHours: identity?.timezone || "Unknown",
    };
  },
};
