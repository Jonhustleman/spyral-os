/**
 * LearningStore — localStorage-persisted CRUD for learning data.
 *
 * Manages Patterns, LearningRecords, Insights, and Recommendations.
 * Per ADR-0037, Patterns are discovered, not authored.
 * Per ADR-0038, pipeline is: Outcome → Pattern → Insight → Recommendation
 * Per ADR-0041, LearningRecords are immutable — the platform's durable memory.
 */

"use client";

import type { Pattern } from "@/kernel/contracts/Pattern";
import type { LearningRecord } from "@/kernel/contracts/LearningRecord";
import type { Insight } from "@/kernel/contracts/Insight";
import type { Recommendation } from "@/kernel/contracts/Recommendation";
import type { Outcome } from "@/kernel/contracts/Outcome";

const STORAGE_KEY_PATTERNS = "spyral_learning_patterns";
const STORAGE_KEY_RECORDS = "spyral_learning_records";
const STORAGE_KEY_INSIGHTS = "spyral_learning_insights";
const STORAGE_KEY_RECOMMENDATIONS = "spyral_learning_recommendations";

// ─── Helpers ────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function now(): Date {
  return new Date();
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Subscriber pattern ─────────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

// ─── Store ──────────────────────────────────────────────────────────────

export const LearningStore = {
  // ── Subscribe ────────────────────────────────────────────────────────

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // ── Patterns ─────────────────────────────────────────────────────────

  getPatterns(): Pattern[] {
    return load<Pattern[]>(STORAGE_KEY_PATTERNS, []);
  },

  getPatternById(id: string): Pattern | undefined {
    return this.getPatterns().find((p) => p.id === id);
  },

  /**
   * Create a new Pattern (discovered by the Learning Engine).
   * Per ADR-0037: Patterns are discovered, not authored.
   */
  createPattern(data: Omit<Pattern, "id" | "createdAt" | "updatedAt">): Pattern {
    const all = this.getPatterns();
    const pattern: Pattern = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    all.push(pattern);
    save(STORAGE_KEY_PATTERNS, all);
    notify();
    return pattern;
  },

  /**
   * Update a Pattern's confidence based on a new Outcome.
   * Per ADR-0036 (Learning Is Bayesian): each repeated Outcome
   * increases or decreases confidence.
   */
  updatePatternConfidence(
    id: string,
    outcomeMatch: boolean,
    delta: number = 0.1,
  ): Pattern | undefined {
    const all = this.getPatterns();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;

    const p = all[idx];
    p.confidence = outcomeMatch
      ? Math.min(1, p.confidence + delta)
      : Math.max(0, p.confidence - delta);
    p.occurrenceCount += 1;
    p.lastObserved = now();
    if (!p.evidenceIds.includes(id)) {
      p.evidenceIds.push(id);
    }
    p.updatedAt = now();
    all[idx] = p;
    save(STORAGE_KEY_PATTERNS, all);
    notify();
    return p;
  },

  updatePattern(id: string, updates: Partial<Pick<Pattern, "title" | "description" | "category">>): Pattern | undefined {
    const all = this.getPatterns();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...updates, updatedAt: now() };
    save(STORAGE_KEY_PATTERNS, all);
    notify();
    return all[idx];
  },

  deletePattern(id: string): void {
    const all = this.getPatterns().filter((p) => p.id !== id);
    save(STORAGE_KEY_PATTERNS, all);
    notify();
  },

  // ── Learning Records (immutable) ─────────────────────────────────────

  getRecords(): LearningRecord[] {
    return load<LearningRecord[]>(STORAGE_KEY_RECORDS, []);
  },

  /**
   * Create an immutable LearningRecord.
   * Per ADR-0041, this is the platform's durable memory.
   * Records are never updated or deleted.
   */
  createRecord(data: Omit<LearningRecord, "id" | "createdAt" | "updatedAt">): LearningRecord {
    const all = this.getRecords();
    const record: LearningRecord = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    all.push(record);
    save(STORAGE_KEY_RECORDS, all);
    notify();
    return record;
  },

  // ── Insights ─────────────────────────────────────────────────────────

  getInsights(): Insight[] {
    return load<Insight[]>(STORAGE_KEY_INSIGHTS, []);
  },

  getInsightById(id: string): Insight | undefined {
    return this.getInsights().find((i) => i.id === id);
  },

  createInsight(data: Omit<Insight, "id" | "createdAt" | "updatedAt">): Insight {
    const all = this.getInsights();
    const insight: Insight = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    all.push(insight);
    save(STORAGE_KEY_INSIGHTS, all);
    notify();
    return insight;
  },

  updateInsight(id: string, updates: Partial<Pick<Insight, "description" | "category" | "confidence" | "evidence" | "tags">>): Insight | undefined {
    const all = this.getInsights();
    const idx = all.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...updates, updatedAt: now() };
    save(STORAGE_KEY_INSIGHTS, all);
    notify();
    return all[idx];
  },

  deleteInsight(id: string): void {
    const all = this.getInsights().filter((i) => i.id !== id);
    save(STORAGE_KEY_INSIGHTS, all);
    notify();
  },

  // ── Recommendations ──────────────────────────────────────────────────

  getRecommendations(): Recommendation[] {
    return load<Recommendation[]>(STORAGE_KEY_RECOMMENDATIONS, []);
  },

  getRecommendationById(id: string): Recommendation | undefined {
    return this.getRecommendations().find((r) => r.id === id);
  },

  createRecommendation(data: Omit<Recommendation, "id" | "createdAt" | "updatedAt">): Recommendation {
    const all = this.getRecommendations();
    const recommendation: Recommendation = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    all.push(recommendation);
    save(STORAGE_KEY_RECOMMENDATIONS, all);
    notify();
    return recommendation;
  },

  updateRecommendationStatus(id: string, status: Recommendation["status"]): Recommendation | undefined {
    const all = this.getRecommendations();
    const idx = all.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], status, updatedAt: now() };
    save(STORAGE_KEY_RECOMMENDATIONS, all);
    notify();
    return all[idx];
  },

  deleteRecommendation(id: string): void {
    const all = this.getRecommendations().filter((r) => r.id !== id);
    save(STORAGE_KEY_RECOMMENDATIONS, all);
    notify();
  },

  // ── Derived data ─────────────────────────────────────────────────────

  /**
   * Get pattern confidence trend over time.
   * Returns records sorted by date for charting.
   */
  getConfidenceHistory(patternId: string): LearningRecord[] {
    return this.getRecords()
      .filter((r) => r.patternIds.includes(patternId))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  /**
   * Generate Insights from Patterns using a simple heuristic.
   * In production, this would use more sophisticated analysis.
   */
  generateInsightsFromPatterns(): Insight[] {
    const patterns = this.getPatterns();
    return patterns
      .filter((p) => p.confidence > 0.5 && p.occurrenceCount >= 2)
      .map((p) => ({
        id: generateId(),
        patternIds: [p.id],
        description: `Pattern observed: "${p.title}" — observed ${p.occurrenceCount} times with ${Math.round(p.confidence * 100)}% confidence.`,
        category: p.category,
        confidence: p.confidence,
        evidence: `${p.occurrenceCount} occurrence(s) across ${p.evidenceIds.length} evidence source(s).`,
        tags: [p.category || "general"].filter(Boolean) as string[],
        createdAt: now(),
        updatedAt: now(),
      }));
  },

  /**
   * Generate Recommendations from Insights.
   * Each high-confidence insight becomes an actionable recommendation.
   */
  generateRecommendationsFromInsights(): Recommendation[] {
    const insights = this.getInsights();
    return insights
      .filter((i) => i.confidence > 0.6)
      .map((i) => ({
        id: generateId(),
        insightIds: [i.id],
        title: `Recommendation based on: ${i.description.slice(0, 60)}...`,
        description: i.description,
        explanation: {
          reasoning: `This recommendation is derived from an insight with ${Math.round(i.confidence * 100)}% confidence.`,
          evidence: i.evidence || "Generated from observed patterns.",
          confidence: i.confidence,
          missingInformation: "Additional data would improve confidence.",
          alternativeViews: [],
        },
        priority: i.confidence > 0.8 ? "high" : "medium",
        status: "active",
        createdAt: now(),
        updatedAt: now(),
      }));
  },

  /**
   * Get aggregated dashboard data for the Learning Studio.
   */
  getDashboardData(): {
    totalPatterns: number;
    totalInsights: number;
    totalRecommendations: number;
    averageConfidence: number;
    highConfidencePatterns: number;
    activeRecommendations: number;
  } {
    const patterns = this.getPatterns();
    const insights = this.getInsights();
    const recommendations = this.getRecommendations();

    const totalPatterns = patterns.length;
    const totalInsights = insights.length;
    const totalRecommendations = recommendations.length;
    const averageConfidence =
      totalPatterns > 0
        ? patterns.reduce((sum, p) => sum + p.confidence, 0) / totalPatterns
        : 0;
    const highConfidencePatterns = patterns.filter((p) => p.confidence > 0.7).length;
    const activeRecommendations = recommendations.filter((r) => r.status === "active").length;

    return {
      totalPatterns,
      totalInsights,
      totalRecommendations,
      averageConfidence,
      highConfidencePatterns,
      activeRecommendations,
    };
  },
};
