/**
 * SPYRAL OS — SemanticSearch
 *
 * Meaning search over all memory types.
 * Not keyword search — meaning search.
 *
 * Currently uses expanded keyword + synonym matching.
 * Future: vector embeddings with pgvector/Pinecone/Qdrant.
 *
 * Searching "marketing" should also retrieve:
 * branding, campaign, customer, advertising, positioning, copywriting
 */

"use client";

import { MemoryStore } from "./MemoryStore";
import type { SemanticFact, EpisodeMemory, DetectedPattern, GraphNode } from "./types";

// ─── Synonym Map ────────────────────────────────────────────────────────────

const SYNONYM_MAP: Record<string, string[]> = {
  marketing: ["branding", "campaign", "customer", "advertising", "positioning", "copywriting", "promotion", "market"],
  research: ["investigation", "study", "analysis", "exploration", "examination", "inquiry", "survey"],
  content: ["writing", "copy", "creative", "article", "blog", "post", "media", "story"],
  strategy: ["plan", "approach", "method", "framework", "tactic", "methodology", "system"],
  design: ["ui", "ux", "interface", "visual", "layout", "style", "aesthetic", "creative"],
  code: ["programming", "development", "software", "engineering", "implementation", "coding"],
  product: ["feature", "offering", "solution", "service", "tool", "platform"],
  user: ["customer", "client", "persona", "audience", "consumer", "people"],
  business: ["company", "enterprise", "organization", "venture", "startup", "firm"],
  growth: ["scale", "expand", "improve", "optimize", "increase", "accelerate"],
  learning: ["education", "skill", "knowledge", "training", "study", "practice"],
  error: ["mistake", "bug", "issue", "problem", "failure", "crash", "defect"],
  success: ["win", "achievement", "milestone", "victory", "breakthrough"],
  data: ["analytics", "metrics", "statistics", "insights", "measurement", "kpi"],
  ai: ["artificial intelligence", "machine learning", "ml", "deep learning", "neural", "llm", "model"],
};

function expandQuery(query: string): string[] {
  const q = query.toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  const expanded = new Set<string>();

  for (const term of terms) {
    expanded.add(term);
    const synonyms = SYNONYM_MAP[term];
    if (synonyms) {
      synonyms.forEach((s) => expanded.add(s));
    }
    // Also check partial matches in synonym map keys
    for (const [key, syns] of Object.entries(SYNONYM_MAP)) {
      if (key.includes(term) || term.includes(key)) {
        syns.forEach((s) => expanded.add(s));
        expanded.add(key);
      }
    }
  }

  return [...expanded];
}

function matchesQuery(text: string, expandedTerms: string[]): number {
  const lower = text.toLowerCase();
  let matches = 0;
  for (const term of expandedTerms) {
    if (lower.includes(term)) matches++;
  }
  return matches;
}

export interface SearchResult {
  type: "fact" | "episode" | "pattern" | "node";
  id: string;
  title: string;
  description: string;
  relevance: number; // 0-1
  timestamp: number;
  source: string;
}

export const SemanticSearch = {
  /**
   * Search across all memory types with synonym expansion.
   */
  search(query: string, limit: number = 20): SearchResult[] {
    const expanded = expandQuery(query);
    if (expanded.length === 0) return [];

    const results: SearchResult[] = [];

    // Search semantic facts
    for (const fact of MemoryStore.getSemanticFacts()) {
      const score = matchesQuery(`${fact.statement} ${fact.category}`, expanded);
      if (score > 0) {
        results.push({
          type: "fact",
          id: fact.id,
          title: fact.statement.slice(0, 80),
          description: `[${fact.category}] ${fact.statement}`,
          relevance: score / expanded.length,
          timestamp: fact.createdAt,
          source: fact.source,
        });
      }
    }

    // Search episodes
    for (const ep of MemoryStore.getEpisodes().slice(0, 200)) {
      const score = matchesQuery(`${ep.summary} ${ep.details} ${ep.tags.join(" ")}`, expanded);
      if (score > 0) {
        results.push({
          type: "episode",
          id: ep.id,
          title: ep.summary.slice(0, 80),
          description: ep.details.slice(0, 200),
          relevance: score / expanded.length,
          timestamp: ep.timestamp,
          source: ep.type,
        });
      }
    }

    // Search detected patterns
    for (const p of MemoryStore.getPatterns()) {
      const score = matchesQuery(`${p.pattern} ${p.evidence.join(" ")}`, expanded);
      if (score > 0) {
        results.push({
          type: "pattern",
          id: p.id,
          title: `Pattern: ${p.pattern}`,
          description: p.evidence.slice(0, 2).join("; "),
          relevance: score / expanded.length,
          timestamp: p.lastDetected,
          source: p.category,
        });
      }
    }

    // Search graph nodes
    for (const node of MemoryStore.getGraphNodes()) {
      const score = matchesQuery(`${node.label} ${node.description}`, expanded);
      if (score > 0) {
        results.push({
          type: "node",
          id: node.id,
          title: node.label,
          description: node.description,
          relevance: score / expanded.length,
          timestamp: node.createdAt,
          source: node.type,
        });
      }
    }

    // Sort by relevance, then by timestamp (newer first for ties)
    results.sort((a, b) => {
      if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      return b.timestamp - a.timestamp;
    });

    return results.slice(0, limit);
  },

  /**
   * Simple keyword search for facts (backward compatible).
   */
  searchFacts(query: string, limit: number = 10): SemanticFact[] {
    return MemoryStore.searchFacts(query, limit);
  },
};
