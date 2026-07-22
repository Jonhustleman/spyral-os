/**
 * SPYRAL OS — AgentMemory
 *
 * Agent-specific memory management.
 * Each agent (Research, Content, Navigation, Consultant, Command)
 * has access to shared memory but also maintains agent-specific context.
 *
 * Cross-agent memory:
 * Research learns → Consultant knows → Navigation adapts → Content improves
 * → Command Center updates → Knowledge Graph expands
 *
 * One brain.
 */

"use client";

import { MemoryStore } from "./MemoryStore";
import { KnowledgeGraph } from "./KnowledgeGraph";
import type { EpisodeMemory, SemanticFact } from "./types";

export type AgentId = "research" | "content" | "navigation" | "consultant" | "command" | "intelligence";

export const AgentMemory = {
  /**
   * Record an agent action/result as an episode.
   */
  recordAction(
    agentId: AgentId,
    summary: string,
    details: string = "",
    tags: string[] = [],
    importance: number = 0.5,
  ): EpisodeMemory {
    const episodeType = this.getEpisodeTypeForAgent(agentId);

    return MemoryStore.addEpisode({
      type: episodeType,
      summary,
      details,
      tags,
      importance,
      projectId: undefined,
      investigationId: undefined,
      relatedEpisodeIds: [],
      archived: false,
    });
  },

  /**
   * Share knowledge from one agent to all others.
   * Research learns → Consultant knows → Navigation adapts → Content improves
   */
  shareKnowledge(agentId: AgentId, fact: string, category: string = "shared"): SemanticFact {
    // Add as a semantic fact
    const semanticFact = MemoryStore.addSemanticFact({
      statement: fact,
      category,
      confidence: 0.5,
      evidenceCount: 1,
      source: agentId,
      relatedFactIds: [],
    });

    // Add to knowledge graph
    const nodeLabel = fact.length > 60 ? fact.slice(0, 60) + "..." : fact;
    KnowledgeGraph.addNode("concept", nodeLabel, fact, {
      source: agentId,
      category,
    });

    return semanticFact;
  },

  /**
   * Get knowledge relevant to a specific agent.
   */
  getRelevantKnowledge(agentId: AgentId): { facts: SemanticFact[]; episodes: EpisodeMemory[] } {
    const facts = MemoryStore.getSemanticFacts()
      .filter((f) => f.source === agentId || f.category === "shared")
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20);

    const type = this.getEpisodeTypeForAgent(agentId);
    const episodes = MemoryStore.getEpisodesByType(type).slice(0, 10);

    return { facts, episodes };
  },

  /**
   * Get cross-agent context — what every agent knows.
   * This is the "one brain" view.
   */
  getCrossAgentContext(): {
    recentLearnings: string[];
    sharedFacts: SemanticFact[];
    activePatterns: string[];
    recentActivity: { agent: AgentId; summary: string }[];
  } {
    const allFacts = MemoryStore.getSemanticFacts()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    const patterns = MemoryStore.getPatterns()
      .filter((p) => p.confidence > 0.5)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    const recentEpisodes = MemoryStore.getRecentEpisodes(10);

    const agents: AgentId[] = ["research", "content", "navigation", "consultant", "command"];
    const recentActivity = agents
      .map((agent) => {
        const latest = recentEpisodes.find((e) => e.type === this.getEpisodeTypeForAgent(agent));
        return latest ? { agent, summary: latest.summary } : null;
      })
      .filter(Boolean) as { agent: AgentId; summary: string }[];

    return {
      recentLearnings: recentEpisodes.map((e) => e.summary),
      sharedFacts: allFacts,
      activePatterns: patterns.map((p) => p.pattern),
      recentActivity,
    };
  },

  /**
   * Map agent ID to episode type.
   */
  getEpisodeTypeForAgent(agentId: AgentId): EpisodeMemory["type"] {
    const map: Record<AgentId, EpisodeMemory["type"]> = {
      research: "research",
      content: "content",
      navigation: "navigation",
      consultant: "consultation",
      command: "conversation",
      intelligence: "conversation",
    };
    return map[agentId];
  },
};
