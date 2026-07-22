/**
 * ImprovementRecommendationEngine (IRE) — Structured Product Recommendations
 *
 * Generates evidence-based improvement recommendations from:
 * - ExperienceAdaptationEngine (friction patterns)
 * - ProductResearchEngine (research questions & hypotheses)
 * - ProductMetrics (metric trends)
 *
 * Output format:
 * - Observation
 * - Evidence
 * - Confidence
 * - Possible Cause
 * - Recommendation
 * - Estimated Impact
 * - Estimated Engineering Effort
 * - Affected Files/Components
 *
 * Never modifies code automatically — only recommends.
 */

"use client";

import { ProductMetrics } from "./ProductMetrics";
import { ExperienceAdaptationEngine } from "./ExperienceAdaptationEngine";
import { ProductResearchEngine } from "./ProductResearchEngine";
import { ExperienceRecorder } from "./ExperienceRecorder";

// ─── Types ─────────────────────────────────────────────────────────────

export interface ImprovementRecommendation {
  id: string;
  observation: string;
  evidence: string[];
  confidence: number; // 0-1
  possibleCause: string;
  recommendation: string;
  estimatedImpact: string;
  estimatedEffort: "low" | "medium" | "high";
  affectedComponents: string[];
  category: "ux" | "engagement" | "retention" | "performance" | "discoverability" | "onboarding";
  generatedAt: number;
  applied: boolean;
}

// ─── Storage ───────────────────────────────────────────────────────────

const STORAGE_KEY = "spyral_ire_recommendations";

function generateId(): string {
  return `ire_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

// ─── Engine ────────────────────────────────────────────────────────────

export const ImprovementRecommendationEngine = {
  /**
   * Run full IRE analysis — generate improvement recommendations.
   */
  analyze(): ImprovementRecommendation[] {
    const recommendations: ImprovementRecommendation[] = [];

    // ── Gather data from all engines ───────────────────────────────
    const metrics = ProductMetrics.computeSnapshot();
    const healthScore = ProductMetrics.computeHealthScore();
    const xaeRecs = ExperienceAdaptationEngine.getRecommendations();
    const researchQuestions = ProductResearchEngine.getResearchQuestions();
    const sessions = ExperienceRecorder.getSessions();
    const events = ExperienceRecorder.getEvents();

    // ── R1: High drop-off rate ─────────────────────────────────────
    if (metrics.dropOffRate > 0.3) {
      recommendations.push({
        id: generateId(),
        observation: `${Math.round(metrics.dropOffRate * 100)}% of sessions are abandoned within 30 seconds.`,
        evidence: [
          `Drop-off rate: ${Math.round(metrics.dropOffRate * 100)}%`,
          `Total sessions: ${metrics.totalSessions}`,
          `Average session duration: ${Math.round(metrics.averageSessionDuration / 1000)}s`,
          `XAE detected ${xaeRecs.filter((r) => r.type === "friction").length} friction patterns`,
        ],
        confidence: Math.min(0.5 + metrics.dropOffRate * 0.4, 0.92),
        possibleCause: "The initial user experience may have high cognitive load, unclear value proposition, or slow loading.",
        recommendation: "Simplify the landing experience. Reduce text input requirements. Add quick-start options or guided onboarding.",
        estimatedImpact: `Reducing drop-off by 50% could save ~${Math.round(metrics.totalSessions * metrics.dropOffRate * 0.5)} sessions.`,
        estimatedEffort: "medium",
        affectedComponents: ["LandingPage", "AppShell", "OnboardingFlow"],
        category: "onboarding",
        generatedAt: Date.now(),
        applied: false,
      });
    }

    // ── R2: Low return rate ────────────────────────────────────────
    if (metrics.returnRate < 0.15 && metrics.totalSessions >= 10) {
      recommendations.push({
        id: generateId(),
        observation: `Low return rate (${Math.round(metrics.returnRate * 100)}%). Only ${metrics.sessionsResumed} of ${metrics.totalSessions} users returned.`,
        evidence: [
          `Return rate: ${Math.round(metrics.returnRate * 100)}%`,
          `Returned users: ${metrics.sessionsResumed}`,
          `Health score: ${healthScore.score}/100 (${healthScore.level})`,
        ],
        confidence: 0.7,
        possibleCause: "Users may not have a reason to return — no persistent state, progress tracking, or follow-up triggers.",
        recommendation: "Implement session persistence with history. Show recent activity on home page. Add 'continue where you left off' functionality.",
        estimatedImpact: "Improving return rate to 25% could triple long-term active users.",
        estimatedEffort: "medium",
        affectedComponents: ["HomePage", "SessionStore", "Dashboard"],
        category: "retention",
        generatedAt: Date.now(),
        applied: false,
      });
    }

    // ── R3: Agent discoverability ──────────────────────────────────
    if (metrics.mostUsedAgent && metrics.leastUsedAgent) {
      const ratio = metrics.mostUsedAgent.count / Math.max(metrics.leastUsedAgent.count, 1);
      if (ratio > 4 && metrics.mostUsedAgent.count > 5) {
        recommendations.push({
          id: generateId(),
          observation: `Agent usage is highly imbalanced: "${metrics.mostUsedAgent.name}" used ${metrics.mostUsedAgent.count}x more than "${metrics.leastUsedAgent.name}".`,
          evidence: [
            `Most used: ${metrics.mostUsedAgent.name} (${metrics.mostUsedAgent.count})`,
            `Least used: ${metrics.leastUsedAgent.name} (${metrics.leastUsedAgent.count})`,
            `Ratio: ${ratio.toFixed(1)}x`,
          ],
          confidence: 0.65,
          possibleCause: `"${metrics.leastUsedAgent.name}" may be less discoverable in the navigation, or users may not understand its value.`,
          recommendation: `Review "${metrics.leastUsedAgent.name}" page placement and labeling. Consider A/B testing different entry points or adding a brief value proposition.`,
          estimatedImpact: `Improving discoverability could increase ${metrics.leastUsedAgent.name} usage by 2-3x.`,
          estimatedEffort: "low",
          affectedComponents: ["Sidebar", "Navigation", `${metrics.leastUsedAgent.name.charAt(0).toUpperCase() + metrics.leastUsedAgent.name.slice(1)}Page`],
          category: "discoverability",
          generatedAt: Date.now(),
          applied: false,
        });
      }
    }

    // ── R4: Research-to-content gap ────────────────────────────────
    if (metrics.researchCompletionCount > 0 && metrics.contentGenerationCount === 0) {
      recommendations.push({
        id: generateId(),
        observation: "Users research but never generate content. The research-to-content pipeline may have a gap.",
        evidence: [
          `Research completions: ${metrics.researchCompletionCount}`,
          `Content generations: ${metrics.contentGenerationCount}`,
          "XAE detected low research-to-content conversion",
        ],
        confidence: 0.6,
        possibleCause: "Users may not see a clear path from research findings to content creation. They may need to manually transfer insights.",
        recommendation: "Add a 'Create content from research' button that pre-populates content fields with research findings and audience insights.",
        estimatedImpact: "Bridging this gap could enable content generation from research sessions.",
        estimatedEffort: "medium",
        affectedComponents: ["ResearchPage", "ContentPage", "SharedContext"],
        category: "ux",
        generatedAt: Date.now(),
        applied: false,
      });
    }

    // ── R5: Low project creation ───────────────────────────────────
    const projectRate = metrics.totalSessions > 0
      ? metrics.projectsCreated / metrics.totalSessions
      : 0;
    if (projectRate < 0.1 && metrics.totalSessions >= 10) {
      recommendations.push({
        id: generateId(),
        observation: `Only ${Math.round(projectRate * 100)}% of sessions result in project creation.`,
        evidence: [
          `Projects created: ${metrics.projectsCreated}`,
          `Total sessions: ${metrics.totalSessions}`,
          `Project rate: ${Math.round(projectRate * 100)}%`,
        ],
        confidence: 0.55,
        possibleCause: "Users may not understand what 'creating a project' means, or the project creation flow may be too complex.",
        recommendation: "Simplify project creation. Consider auto-creating projects from sessions, or adding one-click project save.",
        estimatedImpact: "Increasing project creation to 25% of sessions would provide users with persistent value.",
        estimatedEffort: "low",
        affectedComponents: ["ExecutionPage", "WorkspaceStore"],
        category: "engagement",
        generatedAt: Date.now(),
        applied: false,
      });
    }

    // ── R6: Health-based recommendation ────────────────────────────
    if (healthScore.level === "critical" || healthScore.level === "needs_attention") {
      recommendations.push({
        id: generateId(),
        observation: `Product health score is ${healthScore.score}/100 (${healthScore.level.replace('_', ' ')}). Immediate attention recommended.`,
        evidence: [
          `Health score: ${healthScore.score}/100`,
          `Level: ${healthScore.level}`,
          `Completion rate: ${Math.round(metrics.completionRate * 100)}%`,
          `Return rate: ${Math.round(metrics.returnRate * 100)}%`,
        ],
        confidence: 0.85,
        possibleCause: "Multiple metrics indicate systemic issues with user engagement and retention.",
        recommendation: "Conduct a full UX audit. Review onboarding flow. Add user feedback collection to identify specific pain points.",
        estimatedImpact: "Addressing health-critical issues could improve overall product score by 20-30 points.",
        estimatedEffort: "high",
        affectedComponents: ["AppShell", "Onboarding", "AllAgentPages"],
        category: "ux",
        generatedAt: Date.now(),
        applied: false,
      });
    }

    // Save all recommendations
    const existing = this.getRecommendations();
    const all = [...recommendations, ...existing].slice(0, 30);
    save(STORAGE_KEY, all);

    return recommendations;
  },

  /**
   * Get all improvement recommendations.
   */
  getRecommendations(): ImprovementRecommendation[] {
    return load<ImprovementRecommendation[]>(STORAGE_KEY, []);
  },

  /**
   * Mark a recommendation as applied.
   */
  markApplied(id: string): void {
    const recs = this.getRecommendations();
    const idx = recs.findIndex((r) => r.id === id);
    if (idx !== -1) {
      recs[idx].applied = true;
      save(STORAGE_KEY, recs);
    }
  },

  /**
   * Get count of recommendations.
   */
  getRecommendationCount(): number {
    return this.getRecommendations().length;
  },

  /**
   * Get recommendations by category.
   */
  getByCategory(category: ImprovementRecommendation["category"]): ImprovementRecommendation[] {
    return this.getRecommendations().filter((r) => r.category === category);
  },

  /**
   * Get the latest recommendation/insight.
   */
  getLatestInsight(): ImprovementRecommendation | null {
    const recs = this.getRecommendations();
    return recs.length > 0 ? recs[recs.length - 1] : null;
  },
};
