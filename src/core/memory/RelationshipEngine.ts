/**
 * SPYRAL OS — RelationshipEngine
 *
 * Continuously searches for:
 * - Duplicate ideas
 * - Hidden patterns
 * - Contradictions
 * - Missing information
 * - Emerging themes
 * - Repeated behaviour
 * - Recurring failures
 * - Unexpected connections
 *
 * Runs on every consolidation cycle and on-demand.
 */

"use client";

import { MemoryStore } from "./MemoryStore";
import { KnowledgeGraph } from "./KnowledgeGraph";
import type {
  EpisodeMemory,
  SemanticFact,
  DetectedPattern,
  GraphNode,
  GraphEdge,
  EdgeType,
} from "./types";

export interface RelationshipResult {
  duplicates: { sourceId: string; targetId: string; similarity: number }[];
  contradictions: { factA: SemanticFact; factB: SemanticFact; reason: string }[];
  emergingThemes: { theme: string; evidence: string[]; strength: number }[];
  unexpectedConnections: { nodeA: GraphNode; nodeB: GraphNode; reason: string; suggestedEdge: EdgeType }[];
  repeatedBehaviors: { behavior: string; count: number; examples: string[] }[];
  recurringFailures: string[];
  missingInformation: string[];
}

export const RelationshipEngine = {
  /**
   * Run a full relationship analysis on all stored data.
   */
  analyze(): RelationshipResult {
    const facts = MemoryStore.getSemanticFacts();
    const episodes = MemoryStore.getEpisodes();
    const nodes = MemoryStore.getGraphNodes();
    const patterns = MemoryStore.getPatterns();

    return {
      duplicates: this.findDuplicates(facts, nodes),
      contradictions: this.findContradictions(facts),
      emergingThemes: this.findEmergingThemes(episodes, patterns),
      unexpectedConnections: this.findUnexpectedConnections(nodes),
      repeatedBehaviors: this.findRepeatedBehaviors(episodes),
      recurringFailures: this.findRecurringFailures(episodes),
      missingInformation: this.findMissingInformation(facts, patterns),
    };
  },

  /**
   * Find duplicate or very similar facts/nodes.
   */
  findDuplicates(
    facts: SemanticFact[],
    nodes: GraphNode[],
  ): { sourceId: string; targetId: string; similarity: number }[] {
    const duplicates: { sourceId: string; targetId: string; similarity: number }[] = [];

    // Check semantic facts for duplicates
    for (let i = 0; i < facts.length; i++) {
      for (let j = i + 1; j < facts.length; j++) {
        const sim = this.similarity(facts[i].statement, facts[j].statement);
        if (sim > 0.8) {
          duplicates.push({
            sourceId: facts[i].id,
            targetId: facts[j].id,
            similarity: sim,
          });
        }
      }
    }

    // Check graph nodes for duplicates (by label)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].type === nodes[j].type) {
          const sim = this.similarity(nodes[i].label, nodes[j].label);
          if (sim > 0.85) {
            duplicates.push({
              sourceId: nodes[i].id,
              targetId: nodes[j].id,
              similarity: sim,
            });
          }
        }
      }
    }

    return duplicates;
  },

  /**
   * Find contradictions in semantic facts.
   */
  findContradictions(facts: SemanticFact[]): RelationshipResult["contradictions"] {
    const contradictions: RelationshipResult["contradictions"] = [];
    const negations = [
      "not", "never", "doesn't", "don't", "isn't", "aren't",
      "won't", "can't", "couldn't", "wouldn't", "shouldn't",
      "dislike", "hate", "avoid", "disagree",
    ];

    for (let i = 0; i < facts.length; i++) {
      for (let j = i + 1; j < facts.length; j++) {
        const a = facts[i].statement.toLowerCase();
        const b = facts[j].statement.toLowerCase();

        // Check if statements are about similar topics but one negates
        const aWords = new Set(a.split(/\s+/).filter((w) => w.length > 3));
        const bWords = new Set(b.split(/\s+/).filter((w) => w.length > 3));
        const intersection = new Set([...aWords].filter((w) => bWords.has(w)));

        if (intersection.size >= 2) {
          const aHasNegation = negations.some((n) => a.includes(n));
          const bHasNegation = negations.some((n) => b.includes(n));

          if (aHasNegation !== bHasNegation) {
            contradictions.push({
              factA: facts[i],
              factB: facts[j],
              reason: `'${facts[i].statement}' contradicts '${facts[j].statement}'`,
            });
          }
        }
      }
    }

    return contradictions;
  },

  /**
   * Find emerging themes from recent episodes and patterns.
   */
  findEmergingThemes(
    episodes: EpisodeMemory[],
    patterns: DetectedPattern[],
  ): RelationshipResult["emergingThemes"] {
    const themeMap = new Map<string, { evidence: string[]; count: number }>();

    // Extract themes from episode tags and summaries
    for (const ep of episodes.slice(0, 100)) {
      for (const tag of ep.tags) {
        const existing = themeMap.get(tag) || { evidence: [], count: 0 };
        existing.evidence.push(ep.summary);
        existing.count++;
        themeMap.set(tag, existing);
      }
    }

    // Add pattern themes
    for (const p of patterns) {
      for (const ev of p.evidence) {
        const existing = themeMap.get(p.category) || { evidence: [], count: 0 };
        existing.evidence.push(ev);
        existing.count++;
        themeMap.set(p.category, existing);
      }
    }

    return [...themeMap.entries()]
      .filter(([, data]) => data.count >= 2)
      .map(([theme, data]) => ({
        theme,
        evidence: data.evidence.slice(0, 5),
        strength: Math.min(1, data.count / 10),
      }))
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 10);
  },

  /**
   * Find unexpected connections between nodes that aren't yet linked.
   */
  findUnexpectedConnections(
    nodes: GraphNode[],
  ): RelationshipResult["unexpectedConnections"] {
    const connections: RelationshipResult["unexpectedConnections"] = [];
    const existingEdges = MemoryStore.getGraphEdges();
    const edgeSet = new Set(
      existingEdges.map((e) => `${e.sourceId}-${e.targetId}`),
    );

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];

        // Skip if already connected
        if (edgeSet.has(`${a.id}-${b.id}`) || edgeSet.has(`${b.id}-${a.id}`)) continue;

        // Check for shared keywords in descriptions
        const aDesc = (a.label + " " + a.description).toLowerCase();
        const bDesc = (b.label + " " + b.description).toLowerCase();
        const aWords = new Set(aDesc.split(/\s+/).filter((w) => w.length > 4));
        const bWords = new Set(bDesc.split(/\s+/).filter((w) => w.length > 4));
        const shared = [...aWords].filter((w) => bWords.has(w));

        if (shared.length >= 2) {
          // Determine suggested edge type
          let suggestedEdge: EdgeType = "related_to";
          if (shared.includes("project") || shared.includes("research")) {
            suggestedEdge = "references";
          } else if (shared.includes("improve") || shared.includes("better")) {
            suggestedEdge = "improves";
          }

          connections.push({
            nodeA: a,
            nodeB: b,
            reason: `Both mention: ${shared.slice(0, 3).join(", ")}`,
            suggestedEdge,
          });
        }
      }
    }

    return connections;
  },

  /**
   * Find repeated behaviors from episodes.
   */
  findRepeatedBehaviors(
    episodes: EpisodeMemory[],
  ): RelationshipResult["repeatedBehaviors"] {
    const behaviorCount = new Map<string, { count: number; examples: string[] }>();

    for (const ep of episodes) {
      // Group by type as a simple behavior heuristic
      const key = `episode_type:${ep.type}`;
      const existing = behaviorCount.get(key) || { count: 0, examples: [] };
      existing.count++;
      if (existing.examples.length < 3) {
        existing.examples.push(ep.summary);
      }
      behaviorCount.set(key, existing);
    }

    return [...behaviorCount.entries()]
      .filter(([, data]) => data.count >= 3)
      .map(([behavior, data]) => ({
        behavior: behavior.replace("episode_type:", ""),
        count: data.count,
        examples: data.examples,
      }));
  },

  /**
   * Find recurring failures from episodes.
   */
  findRecurringFailures(episodes: EpisodeMemory[]): string[] {
    const failures = episodes
      .filter((e) => e.type === "mistake" || e.type === "experiment")
      .map((e) => e.summary);

    // Find similar failures
    const uniqueFailures: string[] = [];
    for (const f of failures) {
      if (!uniqueFailures.some((u) => this.similarity(u, f) > 0.7)) {
        uniqueFailures.push(f);
      }
    }

    return uniqueFailures;
  },

  /**
   * Find missing information based on patterns.
   */
  findMissingInformation(
    facts: SemanticFact[],
    patterns: DetectedPattern[],
  ): string[] {
    const missing: string[] = [];
    const factStatements = facts.map((f) => f.statement.toLowerCase());

    // For each pattern, check if we have sufficient facts
    for (const p of patterns) {
      const patternWords = p.pattern.toLowerCase().split(/\s+/);
      const matchedFacts = factStatements.filter((fs) =>
        patternWords.some((w) => w.length > 3 && fs.includes(w)),
      );

      if (matchedFacts.length < 2) {
        missing.push(`Insufficient evidence for pattern: "${p.pattern}"`);
      }
    }

    return missing.slice(0, 20);
  },

  // ── Utility ─────────────────────────────────────────────────────────

  /**
   * Simple text similarity using Jaccard coefficient on word sets.
   */
  similarity(a: string, b: string): number {
    const aWords = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
    const bWords = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 2));

    if (aWords.size === 0 || bWords.size === 0) return 0;

    const intersection = new Set([...aWords].filter((w) => bWords.has(w)));
    const union = new Set([...aWords, ...bWords]);

    return intersection.size / union.size;
  },
};
