/**
 * DeveloperInsights — Consolidated Dashboard Data Provider
 *
 * Combines data from all product intelligence engines into a single
 * unified view for the Developer Intelligence Dashboard.
 *
 * Sections: Overview, Usage, Friction, Research, Recommendations,
 * Predictions, Experiments, Release Comparison
 *
 * Every section uses real data — never empty placeholders.
 */

"use client";

import { ProductMetrics, type ProductMetricsSnapshot } from "./ProductMetrics";
import { ExperienceRecorder, type ExperienceSession, type ExperienceEvent } from "./ExperienceRecorder";
import { ExperienceAdaptationEngine, type AdaptationRecommendation } from "./ExperienceAdaptationEngine";
import { ProductResearchEngine, type ResearchQuestion, type Experiment } from "./ProductResearchEngine";
import { ImprovementRecommendationEngine, type ImprovementRecommendation } from "./ImprovementRecommendationEngine";
import { ProductKnowledgeGraph, type KnowledgeGraphSnapshot } from "./ProductKnowledgeGraph";

// ─── Types ─────────────────────────────────────────────────────────────

export interface DeveloperDashboardData {
  /** Timestamp of snapshot */
  timestamp: number;

  // ── Pilot Summary ────────────────────────────────────────────────
  pilotSessions: number;
  patternsLearned: number;
  recommendationsGenerated: number;
  experimentsRunning: number;
  evidenceConfidence: number;
  productHealth: { score: number; level: string };
  latestInsight: string;

  // ── Overview ─────────────────────────────────────────────────────
  metrics: ProductMetricsSnapshot;

  // ── Usage ────────────────────────────────────────────────────────
  topPages: { page: string; visits: number }[];
  usageByHour: Record<string, number>;

  // ── Friction ─────────────────────────────────────────────────────
  frictions: AdaptationRecommendation[];

  // ── Research ─────────────────────────────────────────────────────
  researchQuestions: ResearchQuestion[];

  // ── Recommendations ──────────────────────────────────────────────
  recommendations: ImprovementRecommendation[];

  // ── Experiments ──────────────────────────────────────────────────
  experiments: Experiment[];

  // ── Release Comparison ───────────────────────────────────────────
  releaseComparison: {
    rc1: { completionRate: number; returnRate: number; avgSessionDuration: number };
    rc2: { completionRate: number; returnRate: number; avgSessionDuration: number };
    changes: Record<string, { direction: string; delta: number }>;
  } | null;

  // ── Knowledge Graph ─────────────────────────────────────────────
  knowledgeGraph: KnowledgeGraphSnapshot;

  // ── Learning ─────────────────────────────────────────────────────
  spralHasLearned: string;
}

// ─── Dashboard Builder ─────────────────────────────────────────────────

export const DeveloperInsights = {
  /**
   * Build a complete dashboard data snapshot.
   */
  buildDashboard(): DeveloperDashboardData {
    const metrics = ProductMetrics.computeSnapshot();
    const health = ProductMetrics.computeHealthScore();
    const xaeRecs = ExperienceAdaptationEngine.getRecommendations();
    const researchQs = ProductResearchEngine.getResearchQuestions();
    const ireRecs = ImprovementRecommendationEngine.getRecommendations();

    // ── Top Pages ──────────────────────────────────────────────────
    const pageVisits = ExperienceRecorder.getEvents().filter((e) => e.type === "page_visited");
    const pageCounts: Record<string, number> = {};
    for (const visit of pageVisits) {
      const page = visit.page ?? "unknown";
      pageCounts[page] = (pageCounts[page] ?? 0) + 1;
    }
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, visits]) => ({ page, visits }));

    // ── Usage by Hour ──────────────────────────────────────────────
    const hourCounts: Record<string, number> = {};
    const sessions = ExperienceRecorder.getSessions();
    for (const session of sessions) {
      const hour = new Date(session.startTime).getHours().toString();
      hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    }

    // ── All experiments ────────────────────────────────────────────
    const allExperiments: Experiment[] = [];
    for (const q of researchQs) {
      for (const h of q.hypotheses) {
        allExperiments.push(...h.experiments);
      }
    }
    const runningExperiments = allExperiments.filter((e) => e.status === "collecting_data" || e.status === "proposed");

    // ── Release Comparison ─────────────────────────────────────────
    // Compare first half of sessions with second half
    let releaseComparison = null;
    if (sessions.length >= 4) {
      const midPoint = sessions.length / 2;
      const rc1Sessions = sessions.slice(Math.ceil(midPoint));
      const rc2Sessions = sessions.slice(0, Math.ceil(midPoint));

      const calcMetrics = (sList: typeof sessions) => {
        const completed = sList.filter((s) => s.completed).length;
        const returned = sList.filter((s) => s.returnedLater).length;
        const durations = sList.filter((s) => s.duration).map((s) => s.duration ?? 0);
        const avgDur = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
        return {
          completionRate: sList.length > 0 ? completed / sList.length : 0,
          returnRate: sList.length > 0 ? returned / sList.length : 0,
          avgSessionDuration: avgDur,
        };
      };

      const rc1 = calcMetrics(rc1Sessions);
      const rc2 = calcMetrics(rc2Sessions);

      const changes: Record<string, { direction: string; delta: number }> = {};
      const compareKeys = ["completionRate", "returnRate", "avgSessionDuration"] as const;
      for (const key of compareKeys) {
        const v1 = rc1[key];
        const v2 = rc2[key];
        const delta = v2 - v1;
        let direction: string;
        if (key === "avgSessionDuration") {
          direction = delta > 0 ? "improved" : delta < 0 ? "regressed" : "unchanged";
        } else {
          direction = delta > 0.01 ? "improved" : delta < -0.01 ? "regressed" : "unchanged";
        }
        changes[key] = { direction, delta };
      }

      releaseComparison = { rc1, rc2, changes };
    }

    // ── SPYRAL has learned message ────────────────────────────────
    const totalSessions = ExperienceRecorder.getSessionCount();
    let spralHasLearned: string;
    if (totalSessions === 0) {
      spralHasLearned = "SPYRAL is observing its first interactions.";
    } else {
      const patternsCount = ExperienceAdaptationEngine.getRecommendationCount();
      const recommendationsCount = ImprovementRecommendationEngine.getRecommendationCount();
      spralHasLearned = `SPYRAL has learned from ${totalSessions} pilot session${totalSessions !== 1 ? 's' : ''}, identified ${patternsCount} pattern${patternsCount !== 1 ? 's' : ''}, and generated ${recommendationsCount} improvement recommendation${recommendationsCount !== 1 ? 's' : ''}.`;

      // Add confidence improvement if applicable
      const avgConfidence = [...xaeRecs, ...ireRecs].reduce((sum, r) => sum + r.confidence, 0) / Math.max([...xaeRecs, ...ireRecs].length, 1);
      if (avgConfidence > 0.5 && totalSessions > 5) {
        spralHasLearned += ` Confidence is growing — currently averaging ${Math.round(avgConfidence * 100)}% across all observations.`;
      }
    }

    // ── Latest Insight ─────────────────────────────────────────────
    const latestXae = ExperienceAdaptationEngine.getLatestInsight();
    const latestIre = ImprovementRecommendationEngine.getLatestInsight();
    const latestInsight = latestIre?.observation ?? latestXae?.observedFriction ?? "No insights yet — keep using SPYRAL.";

    return {
      timestamp: Date.now(),
      pilotSessions: totalSessions,
      patternsLearned: ExperienceAdaptationEngine.getRecommendationCount(),
      recommendationsGenerated: ImprovementRecommendationEngine.getRecommendationCount(),
      experimentsRunning: runningExperiments.length,
      evidenceConfidence: Math.round(
        [...xaeRecs, ...ireRecs].reduce((sum, r) => sum + r.confidence, 0) / Math.max([...xaeRecs, ...ireRecs].length, 1) * 100,
      ),
      productHealth: { score: health.score, level: health.level },
      latestInsight,
      metrics,
      topPages,
      usageByHour: hourCounts,
      frictions: ExperienceAdaptationEngine.getFrictionRecommendations(),
      researchQuestions: researchQs,
      recommendations: ireRecs.slice(0, 10),
      experiments: allExperiments,
      knowledgeGraph: ProductKnowledgeGraph.getSnapshot(),
      releaseComparison,
      spralHasLearned,
    };
  },

  /**
   * Run all engines and return fresh dashboard data.
   */
  runFullAnalysis(): DeveloperDashboardData {
    // Run all engines in order
    ExperienceAdaptationEngine.analyze();
    ProductResearchEngine.analyze();
    ImprovementRecommendationEngine.analyze();
    ProductKnowledgeGraph.runFullIndex();

    return this.buildDashboard();
  },
};
