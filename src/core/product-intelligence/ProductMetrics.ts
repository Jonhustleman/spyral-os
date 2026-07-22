/**
 * ProductMetrics — Continuously Calculated Metrics
 *
 * Computes live metrics from ExperienceRecorder data:
 * - Average session duration
 * - Completion rate
 * - Drop-off rate
 * - Return rate
 * - Most/least used agents
 * - Research completion, content generation, navigation success
 * - Prompt exports, projects created, sessions resumed
 * - Average conversation depth, feedback score, etc.
 *
 * All metrics update live from the stored event/session data.
 */

"use client";

import { ExperienceRecorder, type ExperienceEventType } from "./ExperienceRecorder";

// ─── Types ─────────────────────────────────────────────────────────────

export interface ProductMetricsSnapshot {
  /** Timestamp of snapshot */
  timestamp: number;

  // ── Engagement ────────────────────────────────────────────────────
  totalSessions: number;
  totalEvents: number;
  averageSessionDuration: number; // ms
  completionRate: number; // 0-1
  dropOffRate: number; // 0-1
  returnRate: number; // 0-1

  // ── Agent Usage ──────────────────────────────────────────────────
  agentUsage: Record<string, number>;
  mostUsedAgent: { name: string; count: number } | null;
  leastUsedAgent: { name: string; count: number } | null;

  // ── Activity ─────────────────────────────────────────────────────
  researchCompletionCount: number;
  contentGenerationCount: number;
  navigationSuccessCount: number;
  consultantUsageCount: number;
  promptExportCount: number;
  projectsCreated: number;
  sessionsResumed: number;

  // ── Quality ──────────────────────────────────────────────────────
  averageThinkingDuration: number; // ms
  averageConversationDepth: number;
  feedbackScore: number; // 0-5 or -1 if no feedback
}

// ─── Agent event type mapping ──────────────────────────────────────────

const AGENT_EVENT_MAP: Record<string, ExperienceEventType> = {
  research: "research_completed",
  content: "content_generated",
  navigation: "navigation_completed",
  consultant: "consultant_completed",
};

// ─── Metrics Calculator ────────────────────────────────────────────────

export const ProductMetrics = {
  /**
   * Compute a full snapshot of all product metrics from recorded data.
   */
  computeSnapshot(): ProductMetricsSnapshot {
    const sessions = ExperienceRecorder.getSessions();
    const events = ExperienceRecorder.getEvents();

    const totalSessions = sessions.length;
    const totalEvents = events.length;

    // ── Session Duration ───────────────────────────────────────────
    const completedSessions = sessions.filter((s) => s.endTime && s.duration);
    const avgDuration = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.duration ?? 0), 0) / completedSessions.length
      : 0;

    // ── Completion Rate ────────────────────────────────────────────
    const completed = sessions.filter((s) => s.completed).length;
    const completionRate = totalSessions > 0 ? completed / totalSessions : 0;

    // ── Drop-off Rate ──────────────────────────────────────────────
    const abandoned = sessions.filter((s) => {
      if (!s.endTime) return false;
      const dur = s.duration ?? 0;
      return dur < 30000 && !s.projectCreated && !s.assetsGenerated;
    }).length;
    const dropOffRate = totalSessions > 0 ? abandoned / totalSessions : 0;

    // ── Return Rate ────────────────────────────────────────────────
    const returned = sessions.filter((s) => s.returnedLater).length;
    const returnRate = totalSessions > 0 ? returned / totalSessions : 0;

    // ── Agent Usage ────────────────────────────────────────────────
    const agentUsage: Record<string, number> = {};
    for (const [agent, eventType] of Object.entries(AGENT_EVENT_MAP)) {
      agentUsage[agent] = events.filter((e) => e.type === eventType).length;
    }
    // Also count from session agentType if available
    for (const session of sessions) {
      if (session.agentType) {
        agentUsage[session.agentType] = (agentUsage[session.agentType] ?? 0) + 0; // already counted via events
      }
    }

    const sortedAgents = Object.entries(agentUsage).sort((a, b) => b[1] - a[1]);
    const mostUsedAgent = sortedAgents.length > 0 ? { name: sortedAgents[0][0], count: sortedAgents[0][1] } : null;
    const leastUsedAgent = sortedAgents.length > 0
      ? { name: sortedAgents[sortedAgents.length - 1][0], count: sortedAgents[sortedAgents.length - 1][1] }
      : null;

    // ── Activity Counts ────────────────────────────────────────────
    const researchCompletionCount = events.filter((e) => e.type === "research_completed").length;
    const contentGenerationCount = events.filter((e) => e.type === "content_generated").length;
    const navigationSuccessCount = events.filter((e) => e.type === "navigation_completed").length;
    const consultantUsageCount = events.filter((e) => e.type === "consultant_completed").length;
    const promptExportCount = events.filter((e) => e.type === "prompt_exported").length;
    const projectsCreated = events.filter((e) => e.type === "project_created").length;
    const sessionsResumed = sessions.filter((s) => s.returnedLater).length;

    // ── Thinking Duration ──────────────────────────────────────────
    const thinkingStarted = events.filter((e) => e.type === "thinking_started");
    const thinkingCompleted = events.filter((e) => e.type === "thinking_completed");
    let avgThinkingDuration = 0;
    if (thinkingStarted.length > 0 && thinkingCompleted.length > 0) {
      // Match start/end pairs by session proximity
      const thinkingDurations: number[] = [];
      for (const start of thinkingStarted) {
        const match = thinkingCompleted.find(
          (c) => c.sessionId === start.sessionId && c.timestamp > start.timestamp,
        );
        if (match) {
          thinkingDurations.push(match.timestamp - start.timestamp);
        }
      }
      if (thinkingDurations.length > 0) {
        avgThinkingDuration = thinkingDurations.reduce((a, b) => a + b, 0) / thinkingDurations.length;
      }
    }

    // ── Conversation Depth ─────────────────────────────────────────
    // Approximate from events per session
    const sessionDepths = sessions
      .filter((s) => s.eventCount > 0)
      .map((s) => s.eventCount);
    const avgDepth = sessionDepths.length > 0
      ? sessionDepths.reduce((a, b) => a + b, 0) / sessionDepths.length
      : 0;

    // ── Feedback Score ─────────────────────────────────────────────
    const feedbackEvents = events.filter((e) => e.type === "feedback_submitted");
    let feedbackScore = -1;
    if (feedbackEvents.length > 0) {
      const scores = feedbackEvents
        .map((e) => e.metadata?.score)
        .filter((s): s is number => typeof s === "number");
      if (scores.length > 0) {
        feedbackScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    }

    return {
      timestamp: Date.now(),
      totalSessions,
      totalEvents,
      averageSessionDuration: avgDuration,
      completionRate,
      dropOffRate,
      returnRate,
      agentUsage,
      mostUsedAgent,
      leastUsedAgent,
      researchCompletionCount,
      contentGenerationCount,
      navigationSuccessCount,
      consultantUsageCount,
      promptExportCount,
      projectsCreated,
      sessionsResumed,
      averageThinkingDuration: avgThinkingDuration,
      averageConversationDepth: avgDepth,
      feedbackScore,
    };
  },

  /**
   * Get a concise health-oriented subset of metrics.
   */
  computeHealthMetrics() {
    const snapshot = this.computeSnapshot();
    return {
      completionRate: snapshot.completionRate,
      returnRate: snapshot.returnRate,
      dropOffRate: snapshot.dropOffRate,
      averageSessionDuration: snapshot.averageSessionDuration,
      feedbackScore: snapshot.feedbackScore,
      projectsCreated: snapshot.projectsCreated,
      sessionsResumed: snapshot.sessionsResumed,
    };
  },

  /**
   * Compare metrics between two time periods (e.g., releases).
   */
  comparePeriods(
    period1Start: number,
    period1End: number,
    period2Start: number,
    period2End: number,
  ): {
    period1: ProductMetricsSnapshot;
    period2: ProductMetricsSnapshot;
    changes: Record<string, { direction: "improved" | "regressed" | "unchanged"; delta: number }>;
  } {
    // Filter sessions by time range
    const origSessions = ExperienceRecorder.getSessions();
    const origEvents = ExperienceRecorder.getEvents();

    // We need to compute snapshots scoped to specific periods.
    // Since our API doesn't support filtering directly, we temporarily
    // filter the data. We'll create a helper for this.
    const period1Sessions = origSessions.filter(
      (s) => s.startTime >= period1Start && s.startTime <= period1End,
    );
    const period2Sessions = origSessions.filter(
      (s) => s.startTime >= period2Start && s.startTime <= period2End,
    );
    const period1Events = origEvents.filter(
      (e) => e.timestamp >= period1Start && e.timestamp <= period1End,
    );
    const period2Events = origEvents.filter(
      (e) => e.timestamp >= period2Start && e.timestamp <= period2End,
    );

    // Compute metrics for each period (simplified)
    const computeForRange = (sessions: typeof origSessions, events: typeof origEvents) => {
      const completed = sessions.filter((s) => s.completed).length;
      const returned = sessions.filter((s) => s.returnedLater).length;
      const abandoned = sessions.filter((s) => {
        if (!s.endTime) return false;
        return (s.duration ?? 0) < 30000 && !s.projectCreated && !s.assetsGenerated;
      }).length;
      const durations = sessions.filter((s) => s.duration).map((s) => s.duration ?? 0);

      return {
        totalSessions: sessions.length,
        totalEvents: events.length,
        averageSessionDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
        completionRate: sessions.length > 0 ? completed / sessions.length : 0,
        dropOffRate: sessions.length > 0 ? abandoned / sessions.length : 0,
        returnRate: sessions.length > 0 ? returned / sessions.length : 0,
        projectsCreated: events.filter((e) => e.type === "project_created").length,
        contentGenerationCount: events.filter((e) => e.type === "content_generated").length,
        navigationSuccessCount: events.filter((e) => e.type === "navigation_completed").length,
      };
    };

    const p1 = computeForRange(period1Sessions, period1Events);
    const p2 = computeForRange(period2Sessions, period2Events);

    // Compute changes
    const metrics = ["completionRate", "returnRate", "dropOffRate", "averageSessionDuration", "projectsCreated", "contentGenerationCount", "navigationSuccessCount"] as const;
    const changes: Record<string, { direction: "improved" | "regressed" | "unchanged"; delta: number }> = {};

    for (const metric of metrics) {
      const v1 = p1[metric as keyof typeof p1] as number;
      const v2 = p2[metric as keyof typeof p2] as number;
      const delta = v2 - v1;
      let direction: "improved" | "regressed" | "unchanged" = "unchanged";
      if (metric === "dropOffRate") {
        // Lower is better for drop-off
        if (delta < -0.01) direction = "improved";
        else if (delta > 0.01) direction = "regressed";
      } else {
        if (delta > 0.01) direction = "improved";
        else if (delta < -0.01) direction = "regressed";
      }
      changes[metric] = { direction, delta };
    }

    return {
      period1: p1 as unknown as ProductMetricsSnapshot,
      period2: p2 as unknown as ProductMetricsSnapshot,
      changes,
    };
  },

  /**
   * Get product health score (0-100).
   */
  computeHealthScore(): { score: number; level: "excellent" | "good" | "needs_attention" | "critical" } {
    const m = this.computeSnapshot();

    // Weight factors
    const completionScore = m.completionRate * 25; // 0-25
    const returnScore = m.returnRate * 20; // 0-20
    const dropOffPenalty = m.dropOffRate * 20; // 0-20 (penalty)
    const engagementScore = Math.min(m.totalSessions / 10, 10); // 0-10
    const projectScore = Math.min(m.projectsCreated * 5, 10); // 0-10
    const feedbackScore = m.feedbackScore >= 0 ? (m.feedbackScore / 5) * 15 : 7.5; // 0-15

    let score = Math.round(completionScore + returnScore - dropOffPenalty + engagementScore + projectScore + feedbackScore);
    score = Math.max(0, Math.min(100, score));

    let level: "excellent" | "good" | "needs_attention" | "critical";
    if (score >= 80) level = "excellent";
    else if (score >= 60) level = "good";
    else if (score >= 40) level = "needs_attention";
    else level = "critical";

    return { score, level };
  },
};
