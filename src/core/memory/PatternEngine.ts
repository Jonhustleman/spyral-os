/**
 * SPYRAL OS — PatternEngine
 *
 * Continuously detects:
 * - Repeated Decisions
 * - Repeated Mistakes
 * - Repeated Interests
 * - Repeated Topics
 * - Repeated Frameworks
 * - Repeated Success
 * - Repeated Failure
 *
 * Stores: Pattern, Evidence, Confidence, Prediction
 */

"use client";

import { MemoryStore } from "./MemoryStore";
import { RelationshipEngine } from "./RelationshipEngine";
import type { DetectedPattern, EpisodeMemory } from "./types";

export const PatternEngine = {
  /**
   * Run pattern detection on all episodes.
   * Call during consolidation or on-demand.
   */
  detectAll(): DetectedPattern[] {
    const episodes = MemoryStore.getEpisodes();
    const newPatterns: DetectedPattern[] = [];

    // Detect from repeated episode types
    const typePatterns = this.detectTypePatterns(episodes);
    newPatterns.push(...typePatterns);

    // Detect from repeated tags
    const tagPatterns = this.detectTagPatterns(episodes);
    newPatterns.push(...tagPatterns);

    // Detect from semantic similarities
    const semanticPatterns = this.detectSemanticPatterns(episodes);
    newPatterns.push(...semanticPatterns);

    return newPatterns;
  },

  /**
   * Detect patterns based on episode type frequency.
   */
  detectTypePatterns(episodes: EpisodeMemory[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const typeCount = new Map<string, number>();

    for (const ep of episodes) {
      typeCount.set(ep.type, (typeCount.get(ep.type) || 0) + 1);
    }

    for (const [type, count] of typeCount) {
      if (count >= 5) {
        const confidence = Math.min(1, count / 20);
        const examples = episodes
          .filter((e) => e.type === type)
          .slice(0, 3)
          .map((e) => e.summary);

        // Check if pattern already exists
        const existing = MemoryStore.getPatterns().find(
          (p) => p.pattern === `Frequent ${type} activity` && p.category === "behavior",
        );

        if (existing && existing.occurrenceCount < count) {
          MemoryStore.updatePattern(existing.id, {
            confidence,
            occurrenceCount: count,
            evidence: [...new Set([...existing.evidence, ...examples])],
          });
        } else if (!existing) {
          patterns.push({
            id: "",
            pattern: `Frequent ${type} activity`,
            evidence: examples,
            confidence,
            category: "topic",
            firstDetected: Date.now(),
            lastDetected: Date.now(),
            occurrenceCount: count,
            prediction: `User likely to engage in ${type} activity again soon`,
          });
        }
      }
    }

    return patterns;
  },

  /**
   * Detect patterns in tags.
   */
  detectTagPatterns(episodes: EpisodeMemory[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const tagCount = new Map<string, number>();

    for (const ep of episodes) {
      for (const tag of ep.tags) {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      }
    }

    for (const [tag, count] of tagCount) {
      if (count >= 3) {
        const confidence = Math.min(1, count / 10);
        const examples = episodes
          .filter((e) => e.tags.includes(tag))
          .slice(0, 3)
          .map((e) => e.summary);

        const existing = MemoryStore.getPatterns().find(
          (p) => p.pattern === `Interest in ${tag}` && p.category === "interest",
        );

        if (existing && existing.occurrenceCount < count) {
          MemoryStore.updatePattern(existing.id, {
            confidence,
            occurrenceCount: count,
            evidence: [...new Set([...existing.evidence, ...examples])],
          });
        } else if (!existing) {
          patterns.push({
            id: "",
            pattern: `Interest in ${tag}`,
            evidence: examples,
            confidence,
            category: "interest",
            firstDetected: Date.now(),
            lastDetected: Date.now(),
            occurrenceCount: count,
            prediction: `User may explore "${tag}" further`,
          });
        }
      }
    }

    return patterns;
  },

  /**
   * Detect patterns by finding semantically similar episodes.
   */
  detectSemanticPatterns(episodes: EpisodeMemory[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const similarityThreshold = 0.6;
    const groups: { summaries: string[]; indices: number[] }[] = [];

    for (let i = 0; i < episodes.length; i++) {
      let addedToGroup = false;
      for (const group of groups) {
        const similarity = RelationshipEngine.similarity(
          episodes[i].summary,
          episodes[group.indices[0]].summary,
        );
        if (similarity > similarityThreshold) {
          group.summaries.push(episodes[i].summary);
          group.indices.push(i);
          addedToGroup = true;
          break;
        }
      }
      if (!addedToGroup && episodes[i].summary.length > 10) {
        groups.push({ summaries: [episodes[i].summary], indices: [i] });
      }
    }

    for (const group of groups) {
      if (group.indices.length >= 3) {
        const confidence = Math.min(1, group.indices.length / 10);
        const topSummary = group.summaries[0];
        const patternLabel = topSummary.length > 60
          ? topSummary.slice(0, 60) + "..."
          : topSummary;

        const existing = MemoryStore.getPatterns().find(
          (p) => p.pattern === patternLabel && p.category === "topic",
        );

        if (!existing) {
          patterns.push({
            id: "",
            pattern: patternLabel,
            evidence: group.summaries.slice(0, 5),
            confidence,
            category: "topic",
            firstDetected: Date.now(),
            lastDetected: Date.now(),
            occurrenceCount: group.indices.length,
            prediction: "Similar episodes may recur",
          });
        }
      }
    }

    return patterns;
  },

  /**
   * Get all patterns grouped by category.
   */
  getPatternsByCategory(): Record<string, DetectedPattern[]> {
    const patterns = MemoryStore.getPatterns();
    const grouped: Record<string, DetectedPattern[]> = {};

    for (const p of patterns) {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    }

    return grouped;
  },

  /**
   * Get high-confidence patterns.
   */
  getHighConfidencePatterns(minConfidence: number = 0.7): DetectedPattern[] {
    return MemoryStore.getPatterns()
      .filter((p) => p.confidence >= minConfidence)
      .sort((a, b) => b.confidence - a.confidence);
  },
};
