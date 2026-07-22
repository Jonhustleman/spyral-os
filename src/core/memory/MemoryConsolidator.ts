/**
 * SPYRAL OS — MemoryConsolidator
 *
 * Every completed session triggers:
 * Observe → Extract Knowledge → Remove Noise → Find Relationships
 * → Update Knowledge Graph → Generate Insights → Store Memory → Update Predictions
 *
 * Exactly like human sleep.
 */

"use client";

import { MemoryStore } from "./MemoryStore";
import { KnowledgeGraph } from "./KnowledgeGraph";
import { RelationshipEngine } from "./RelationshipEngine";
import { MemoryIndex } from "./MemoryIndex";
import { PatternEngine } from "./PatternEngine";
import { PredictionEngine } from "./PredictionEngine";
import type { ConsolidationResult, EpisodeMemory, SemanticFact } from "./types";

export const MemoryConsolidator = {
  /**
   * Run full consolidation cycle.
   * Call this after every session completes.
   */
  consolidate(): ConsolidationResult {
    const startTime = Date.now();

    // 1. Observe: Get recent unconsolidated episodes
    const lastConsolidated = MemoryStore.getMetrics().lastConsolidation;
    const allEpisodes = MemoryStore.getEpisodes();
    const recentEpisodes = lastConsolidated
      ? allEpisodes.filter((e) => e.timestamp > lastConsolidated)
      : allEpisodes.slice(0, 50); // Limit first consolidation

    const observed = recentEpisodes;

    // 2. Extract Knowledge from episodes
    const extractedKnowledge = this.extractKnowledge(recentEpisodes);

    // 3. Remove Noise (low-importance, old ephemeral data)
    const removedNoise = this.removeNoise();

    // 4. Find Relationships
    const relationships = RelationshipEngine.analyze();

    // 5. Update Knowledge Graph
    let graphUpdates = 0;
    for (const conn of relationships.unexpectedConnections.slice(0, 10)) {
      const added = KnowledgeGraph.addEdge(
        conn.nodeA.id,
        conn.nodeB.id,
        conn.suggestedEdge,
        0.3, // initial weight
        { reason: conn.reason },
      );
      if (added) graphUpdates++;
    }

    // 6. Generate Insights
    const insightsGenerated = this.generateInsights(relationships);

    // 7. Store consolidated memory (already stored, just update metrics)

    // 8. Update Predictions
    const predictionsUpdated = PredictionEngine.updateAll();

    // Update metrics
    const metrics = MemoryStore.getMetrics();
    metrics.lastConsolidation = Date.now();
    metrics.consolidationQueue = Math.max(0, metrics.consolidationQueue - observed.length);
    // Rebuild index
    MemoryIndex.invalidate();

    const result: ConsolidationResult = {
      observed,
      extractedKnowledge,
      removedNoise,
      relationshipsFound: relationships.duplicates.length + relationships.contradictions.length + relationships.unexpectedConnections.length,
      graphUpdates,
      insightsGenerated,
      predictionsUpdated,
      timestamp: Date.now(),
    };

    return result;
  },

  /**
   * Extract semantic facts from recent episodes.
   */
  extractKnowledge(episodes: EpisodeMemory[]): SemanticFact[] {
    const extracted: SemanticFact[] = [];
    const processed = new Set<string>();

    for (const ep of episodes) {
      // Skip very short or empty episodes
      if (ep.summary.length < 10 || ep.details.length < 20) continue;

      // Extract key statements from summary
      const sentences = ep.summary.split(/[.!?]+/).filter((s) => s.trim().length > 15);
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (processed.has(trimmed.toLowerCase())) continue;
        processed.add(trimmed.toLowerCase());

        // Check for duplication with existing facts
        const existing = MemoryStore.getSemanticFacts();
        const isDuplicate = existing.some((f) => {
          const sim = RelationshipEngine.similarity(f.statement, trimmed);
          return sim > 0.8;
        });

        if (!isDuplicate) {
          const fact = MemoryStore.addSemanticFact({
            statement: trimmed,
            category: ep.type,
            confidence: 0.5, // Initial confidence
            evidenceCount: 1,
            source: ep.type,
            relatedFactIds: [],
          });
          extracted.push(fact);
        }
      }
    }

    return extracted;
  },

  /**
   * Remove low-quality noise from memory.
   * Returns count of removed items.
   */
  removeNoise(): number {
    let removed = 0;

    // Remove very old, low-importance, archived episodes
    const episodes = MemoryStore.getEpisodes();
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const sixMonths = 180 * 24 * 60 * 60 * 1000;

    for (const ep of episodes) {
      const age = now - ep.timestamp;
      // Remove archived, low-importance episodes older than 6 months
      if (ep.archived && ep.importance < 0.3 && age > sixMonths) {
        MemoryStore.deleteById(ep.id);
        removed++;
      }
      // Remove very old, empty episodes
      if (ep.summary.length < 5 && age > oneWeek) {
        MemoryStore.deleteById(ep.id);
        removed++;
      }
    }

    return removed;
  },

  /**
   * Generate insight statements from relationship analysis.
   */
  generateInsights(relationships: ReturnType<typeof RelationshipEngine.analyze>): string[] {
    const insights: string[] = [];

    for (const theme of relationships.emergingThemes.slice(0, 5)) {
      insights.push(`Emerging theme: ${theme.theme} (${theme.evidence.length} instances)`);
    }

    for (const dup of relationships.duplicates.slice(0, 3)) {
      insights.push(`Duplicate detected: ${Math.round(dup.similarity * 100)}% similarity`);
    }

    for (const contra of relationships.contradictions.slice(0, 3)) {
      insights.push(`Contradiction found: ${contra.reason}`);
    }

    for (const conn of relationships.unexpectedConnections.slice(0, 3)) {
      insights.push(`New connection: "${conn.nodeA.label}" → "${conn.nodeB.label}" (${conn.reason})`);
    }

    return insights;
  },

  /**
   * Get the time since last consolidation.
   */
  timeSinceLastConsolidation(): number {
    const last = MemoryStore.getMetrics().lastConsolidation;
    if (!last) return Infinity;
    return Date.now() - last;
  },

  /**
   * Check if consolidation is needed.
   */
  shouldConsolidate(): boolean {
    const timeSince = this.timeSinceLastConsolidation();
    const episodeCount = MemoryStore.getEpisodes().length;
    // Consolidate if more than 1 hour since last or more than 50 episodes
    return timeSince > 3600000 || episodeCount > 50;
  },
};
