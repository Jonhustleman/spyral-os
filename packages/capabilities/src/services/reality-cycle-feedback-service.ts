/**
 * RealityCycleFeedbackService — Collects user feedback on reality cycles.
 *
 * Phase E.1.1 — Reality Validation & Learning Loop
 *
 * After SPYRAL produces a plan, the user rates it and provides
 * feedback about what was accurate, inaccurate, or missing.
 * This becomes the first real-world training signal.
 *
 * Architecture:
 *   MCP Tool → RealityCycleFeedbackService → LearningCapability + EventBus
 */

import { randomUUID } from "node:crypto";
import type {
  TenantContext,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
  RealityCycleFeedback,
  RealityGapAnalysis,
  CycleQuality,
  UserRating,
} from "@spyral/kernel";
import { getApplicationContext } from "./application-context.js";
import { getGlobalEventBus } from "./event-bus.js";

export class RealityCycleFeedbackService {
  /**
   * Submit user feedback for a completed reality cycle.
   * Returns feedback with gap analysis and quality scores (Phase E.2).
   */
  async submitFeedback(
    tenantCtx: TenantContext,
    request: SubmitFeedbackRequest,
  ): Promise<SubmitFeedbackResponse> {
    const ctx = getApplicationContext();
    const eventBus = getGlobalEventBus();

    const feedback: RealityCycleFeedback = {
      cycleId: request.cycleId,
      workspaceId: "",
      userRating: request.userRating,
      expectedReality: request.expectedReality ?? "",
      observedReality: request.observedReality ?? "",
      gaps: request.gaps ?? [],
      corrections: request.corrections ?? [],
      timestamp: new Date().toISOString(),
    };

    // Try to enrich with workspace info from existing data
    try {
      const caps = ctx as any;
      if (caps.workspace && caps.workspace.getWorkspace) {
        // workspace context optional
      }
    } catch {
      // ignore
    }

    // Record the feedback as a learning event
    try {
      await ctx.learning.recordLearning(tenantCtx, {
        workspaceId: feedback.workspaceId || "system",
        decisionId: feedback.cycleId,
        outcomeIds: [],
        type: "lesson",
        content: this.formatFeedbackContent(feedback),
        confidence: this.ratingToConfidence(request.userRating),
        description: `User feedback: ${request.userRating}. Gaps: ${feedback.gaps.length}. Corrections: ${feedback.corrections.length}`,
      });
    } catch {
      // Learning recording is best-effort
    }

    // Emit feedback event
    try {
      await eventBus.emit({
        eventName: "RealityCycleFeedbackSubmitted",
        eventId: `evt_fb_${Date.now()}`,
        aggregateId: feedback.cycleId,
        aggregateType: "reality-cycle",
        timestamp: new Date().toISOString(),
        payload: {
          cycleId: feedback.cycleId,
          userRating: feedback.userRating,
          gapCount: feedback.gaps.length,
        },
      });
    } catch {
      // Event emission is best-effort
    }

    // Phase E.2 — Compute Reality Gap Analysis
    const gapAnalysis = this.computeRealityGapAnalysis(feedback);

    // Phase E.2 — Compute Cycle Quality from feedback
    const quality = this.computeCycleQuality(feedback);

    return {
      success: true,
      feedback,
      gapAnalysis,
      quality,
      message: this.buildFeedbackMessage(feedback, gapAnalysis),
    };
  }

  /**
   * Compute Reality Gap Analysis (Phase E.2)
   * Measures the difference between expected and observed reality.
   */
  private computeRealityGapAnalysis(feedback: RealityCycleFeedback): RealityGapAnalysis {
    const expected = feedback.expectedReality || "No expected reality specified";
    const observed = feedback.observedReality || "No observed reality specified";

    // Estimate difference magnitude from rating
    const magnitudeMap: Record<string, number> = { yes: 0.1, partial: 0.5, no: 0.9 };
    const differenceMagnitude = magnitudeMap[feedback.userRating] ?? 0.5;

    const causes: string[] = [];
    if (feedback.gaps.length > 0) {
      causes.push(...feedback.gaps.slice(0, 3));
    }
    if (feedback.userRating === "no") {
      causes.push("SPYRAL may have misidentified the domain");
      causes.push("Insufficient context provided in the goal");
    } else if (feedback.userRating === "partial") {
      causes.push("Some assumptions may not match reality");
    }
    if (causes.length === 0) {
      causes.push("Reality aligned with prediction — no significant gap detected");
    }

    // Generate recommended action
    const recommendedAction = this.generateGapAction(feedback, differenceMagnitude);

    return {
      predictionId: feedback.cycleId,
      expectedOutcome: expected,
      observedOutcome: observed,
      difference: this.describeDifference(feedback.userRating),
      differenceMagnitude,
      possibleCauses: causes,
      recommendedAction,
    };
  }

  /**
   * Compute Cycle Quality scores from feedback (Phase E.2).
   */
  private computeCycleQuality(feedback: RealityCycleFeedback): CycleQuality {
    const ratingMap: Record<string, number> = { yes: 4.5, partial: 3.0, no: 1.5 };
    const baseScore = ratingMap[feedback.userRating] ?? 3.0;

    // Adjust based on how much feedback the user provided (more feedback = more engaged)
    const engagementBonus = Math.min(1.0, (feedback.gaps.length + feedback.corrections.length) * 0.2);

    return {
      understanding: Math.min(5, baseScore + (feedback.expectedReality ? 0.5 : 0)),
      strategy: Math.min(5, baseScore + engagementBonus * 0.3),
      actionability: Math.min(5, baseScore + engagementBonus * 0.2),
      confidence: Math.min(5, baseScore - (feedback.gaps.length > 0 ? 0.5 : 0) + (feedback.corrections.length > 0 ? 0.3 : 0)),
      userTrust: Math.min(5, baseScore + engagementBonus * 0.2),
      overall: 0,
    };
  }

  /**
   * Build a human-readable feedback message with gap analysis.
   */
  private buildFeedbackMessage(feedback: RealityCycleFeedback, gap: RealityGapAnalysis): string {
    const ratingEmoji: Record<string, string> = { yes: "👍", partial: "⚠️", no: "👎" };
    const emoji = ratingEmoji[feedback.userRating] ?? "📝";

    const parts: string[] = [
      `${emoji} Feedback recorded (${feedback.userRating}).`,
    ];

    if (gap.differenceMagnitude > 0.5) {
      parts.push(`Reality gap detected: ${gap.difference}`);
    } else if (gap.differenceMagnitude < 0.2) {
      parts.push("Reality closely aligned with prediction.");
    } else {
      parts.push(`Partial alignment: ${gap.difference}`);
    }

    if (feedback.gaps.length > 0) {
      parts.push(`Identified ${feedback.gaps.length} gap(s) and ${feedback.corrections.length} correction(s).`);
    }

    if (gap.possibleCauses.length > 0) {
      parts.push(`Analysis: ${gap.possibleCauses.slice(0, 2).join("; ")}.`);
    }

    parts.push(`Recommendation: ${gap.recommendedAction}`);

    return parts.join(" ");
  }

  /**
   * Describe the difference between expected and observed reality.
   */
  private describeDifference(rating: UserRating): string {
    switch (rating) {
      case "yes": return "Minimal gap — SPYRAL's understanding aligned well with reality";
      case "partial": return "Moderate gap — Some aspects aligned, others diverged";
      case "no": return "Significant gap — SPYRAL's understanding did not match reality";
    }
  }

  /**
   * Generate a recommended action based on the gap analysis.
   */
  private generateGapAction(feedback: RealityCycleFeedback, magnitude: number): string {
    if (magnitude > 0.7) {
      return "Rephrase goal with more specific context. Include domain, constraints, and desired outcomes clearly.";
    } else if (magnitude > 0.3) {
      if (feedback.gaps.length > 0) {
        return `Address key gaps: ${feedback.gaps.slice(0, 2).join(", ")}. Provide more context before the next cycle.`;
      }
      return "Refine the goal with additional details and run a new reality cycle.";
    }
    return "Good alignment. Execute the recommended plan and return with observed outcomes.";
  }

  /**
   * Convert a user rating to a confidence score.
   */
  private ratingToConfidence(rating: UserRating): number {
    switch (rating) {
      case "yes": return 0.85;
      case "partial": return 0.5;
      case "no": return 0.15;
    }
  }

  /**
   * Format feedback content for learning record storage.
   */
  private formatFeedbackContent(feedback: RealityCycleFeedback): string {
    const parts: string[] = [
      `User rating: ${feedback.userRating}`,
    ];
    if (feedback.expectedReality) parts.push(`Expected: ${feedback.expectedReality}`);
    if (feedback.observedReality) parts.push(`Observed: ${feedback.observedReality}`);
    if (feedback.gaps.length > 0) parts.push(`Gaps: ${feedback.gaps.join(", ")}`);
    if (feedback.corrections.length > 0) parts.push(`Corrections: ${feedback.corrections.join(", ")}`);
    return parts.join(" | ");
  }
}
