/**
 * ExperienceAdaptationEngine (XAE) — Post-Session Pattern Detection
 *
 * Runs after every session to detect patterns in user behavior.
 * Uses SPYRAL methodology: Observe → Organize → Detect Patterns →
 * Predict Improvements → Validate Evidence → Recommend Adaptations.
 *
 * Never invents conclusions — requires evidence.
 *
 * Outputs:
 * - Observed Friction
 * - Likely Cause
 * - Confidence
 * - Supporting Evidence
 * - Predicted Impact
 * - Suggested Improvement
 */

"use client";

import { ExperienceRecorder, type ExperienceEvent, type ExperienceSession } from "./ExperienceRecorder";

// ─── Types ─────────────────────────────────────────────────────────────

export interface AdaptationRecommendation {
  id: string;
  type: "friction" | "opportunity" | "behavior";
  observedFriction: string;
  likelyCause: string;
  confidence: number; // 0-1
  supportingEvidence: string[];
  predictedImpact: string;
  suggestedImprovement: string;
  generatedAt: number;
  applied: boolean;
}

// ─── Storage ───────────────────────────────────────────────────────────

const STORAGE_KEY = "spyral_xae_recommendations";

function generateId(): string {
  return `xae_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

export const ExperienceAdaptationEngine = {
  /**
   * Run the full XAE pipeline: analyze sessions and generate recommendations.
   */
  analyze(): AdaptationRecommendation[] {
    const sessions = ExperienceRecorder.getSessions();
    const events = ExperienceRecorder.getEvents();
    const recommendations: AdaptationRecommendation[] = [];

    // ── 1. Detect session abandonment patterns ──────────────────────
    const abandonedSessions = sessions.filter((s) => {
      if (!s.endTime) return false;
      const dur = s.duration ?? 0;
      return dur < 30000 && !s.projectCreated && !s.assetsGenerated;
    });

    if (abandonedSessions.length >= 3) {
      const abandonRate = abandonedSessions.length / sessions.length;
      recommendations.push({
        id: generateId(),
        type: "friction",
        observedFriction: `Users abandon ${Math.round(abandonRate * 100)}% of sessions within 30 seconds without creating anything.`,
        likelyCause: "The initial interaction may require too much effort or the purpose of the page may not be immediately clear.",
        confidence: Math.min(0.5 + abandonRate * 0.3, 0.92),
        supportingEvidence: [
          `${abandonedSessions.length} of ${sessions.length} sessions abandoned quickly (<30s)`,
          `Average abandonment duration: ${Math.round(abandonedSessions.reduce((s, ses) => s + (ses.duration ?? 0), 0) / abandonedSessions.length / 1000)}s`,
        ],
        predictedImpact: `Reducing quick abandonment by 50% could recover ~${Math.round(abandonedSessions.length / 2)} sessions.`,
        suggestedImprovement: "Consider simplifying the initial entry point, adding a guided first-step, or reducing cognitive load on first interaction.",
        generatedAt: Date.now(),
        applied: false,
      });
    }

    // ── 2. Detect repeated navigation patterns ─────────────────────
    const pageVisits = events.filter((e) => e.type === "page_visited");
    const pageCounts: Record<string, number> = {};
    for (const visit of pageVisits) {
      const page = visit.page ?? "unknown";
      pageCounts[page] = (pageCounts[page] ?? 0) + 1;
    }

    const mostVisited = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]);
    if (mostVisited.length >= 2 && mostVisited[0][1] > mostVisited[1][1] * 2) {
      recommendations.push({
        id: generateId(),
        type: "behavior",
        observedFriction: `Users visit "${mostVisited[0][0]}" ${mostVisited[0][1]} times — significantly more than any other page.`,
        likelyCause: "Users may be using this page as a starting point or returning to it frequently as a hub.",
        confidence: 0.75,
        supportingEvidence: [
          `Page "${mostVisited[0][0]}": ${mostVisited[0][1]} visits`,
          `Next most visited: "${mostVisited[1][0]}" with ${mostVisited[1][1]} visits`,
        ],
        predictedImpact: "Optimizing this page for faster access could improve overall session efficiency.",
        suggestedImprovement: "Consider making this page the default landing or adding quick-access shortcuts from other pages.",
        generatedAt: Date.now(),
        applied: false,
      });
    }

    // ── 3. Detect low-content-generation patterns ──────────────────
    const contentEvents = events.filter((e) => e.type === "content_generated").length;
    const researchEvents = events.filter((e) => e.type === "research_completed").length;

    if (researchEvents > 0 && contentEvents < researchEvents * 0.3) {
      recommendations.push({
        id: generateId(),
        type: "opportunity",
        observedFriction: `Users research (${researchEvents} times) but rarely generate content (${contentEvents} times). Research-to-content conversion is low.`,
        likelyCause: "The path from research findings to content creation may be unclear or require too many steps.",
        confidence: 0.65,
        supportingEvidence: [
          `Research completed: ${researchEvents}`,
          `Content generated: ${contentEvents}`,
          `Ratio: ${researchEvents > 0 ? (contentEvents / researchEvents * 100).toFixed(0) : 0}%`,
        ],
        predictedImpact: "Improving research-to-content handoff could increase content generation by 2-3x.",
        suggestedImprovement: "Add a 'Create content from research' button, or auto-populate content fields with research findings.",
        generatedAt: Date.now(),
        applied: false,
      });
    }

    // ── 4. Detect return patterns ──────────────────────────────────
    const returnedSessions = sessions.filter((s) => s.returnedLater).length;
    const returnRate = sessions.length > 0 ? returnedSessions / sessions.length : 0;

    if (returnRate < 0.1 && sessions.length >= 10) {
      recommendations.push({
        id: generateId(),
        type: "behavior",
        observedFriction: `Low return rate (${Math.round(returnRate * 100)}%). Only ${returnedSessions} of ${sessions.length} users returned.`,
        likelyCause: "Users may not find enough value to return, or there is no incentive/motivation to continue engagement.",
        confidence: Math.min(0.5 + (1 - returnRate) * 0.3, 0.9),
        supportingEvidence: [
          `Return rate: ${Math.round(returnRate * 100)}%`,
          `Total sessions: ${sessions.length}`,
          `Returned sessions: ${returnedSessions}`,
        ],
        predictedImpact: "Increasing return rate to 25% could triple long-term engagement.",
        suggestedImprovement: "Consider adding session persistence, progress tracking, or email/notification reminders to return.",
        generatedAt: Date.now(),
        applied: false,
      });
    }

    // ── 5. Detect agent imbalance ──────────────────────────────────
    const agentTypes = ["research", "content", "navigation", "consultant"];
    const agentUsage: Record<string, number> = {};
    for (const agent of agentTypes) {
      agentUsage[agent] = events.filter((e) => e.agentType === agent || e.type === `${agent}_completed` as any).length;
    }

    const maxAgent = Math.max(...Object.values(agentUsage), 1);
    const minAgent = Math.min(...Object.values(agentUsage), 0);
    const maxAgentName = Object.entries(agentUsage).find(([, v]) => v === maxAgent)?.[0];
    const minAgentName = Object.entries(agentUsage).find(([, v]) => v === minAgent)?.[0];

    if (maxAgentName && minAgentName && maxAgent > minAgent * 3 && minAgent >= 0) {
      recommendations.push({
        id: generateId(),
        type: "behavior",
        observedFriction: `Agent usage imbalance: "${maxAgentName}" used ${maxAgent} times vs "${minAgentName}" used ${minAgent} times.`,
        likelyCause: `${minAgentName} may be less discoverable, less useful, or harder to use compared to ${maxAgentName}.`,
        confidence: 0.6,
        supportingEvidence: [
          `"${maxAgentName}" usage: ${maxAgent}`,
          `"${minAgentName}" usage: ${minAgent}`,
          `Ratio: ${minAgent > 0 ? (maxAgent / minAgent).toFixed(1) : '∞'}x`,
        ],
        predictedImpact: `Improving ${minAgentName}'s visibility or UX could balance agent utilization.`,
        suggestedImprovement: `Review ${minAgentName} page for discoverability and usability issues. Consider A/B testing layout changes.`,
        generatedAt: Date.now(),
        applied: false,
      });
    }

    // Save all recommendations
    save(STORAGE_KEY, recommendations);

    return recommendations;
  },

  /**
   * Get all generated adaptation recommendations.
   */
  getRecommendations(): AdaptationRecommendation[] {
    return load<AdaptationRecommendation[]>(STORAGE_KEY, []);
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
   * Get count of detected patterns / recommendations.
   */
  getRecommendationCount(): number {
    return this.getRecommendations().length;
  },

  /**
   * Get recommendations that indicate friction.
   */
  getFrictionRecommendations(): AdaptationRecommendation[] {
    return this.getRecommendations().filter((r) => r.type === "friction");
  },

  /**
   * Get the most recent recommendation.
   */
  getLatestInsight(): AdaptationRecommendation | null {
    const recs = this.getRecommendations();
    return recs.length > 0 ? recs[recs.length - 1] : null;
  },
};
