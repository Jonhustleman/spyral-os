/**
 * SPYRAL OS — PredictionEngine
 *
 * Using accumulated memory, predict:
 * - Likely Next Project
 * - Likely Next Question
 * - Likely Needed Tool
 * - Likely Roadblock
 * - Likely Success
 * - Likely Failure
 *
 * Display gently. Never pretend certainty.
 */

"use client";

import { MemoryStore } from "./MemoryStore";
import type { Prediction, DetectedPattern, EpisodeMemory, SemanticFact, ProjectMemory } from "./types";

export const PredictionEngine = {
  /**
   * Generate predictions based on all accumulated memory.
   */
  generate(): Prediction[] {
    const predictions: Prediction[] = [];
    const patterns = MemoryStore.getPatterns();
    const episodes = MemoryStore.getEpisodes();
    const facts = MemoryStore.getSemanticFacts();
    const projects = MemoryStore.getProjects();
    const investigations = MemoryStore.getInvestigations();

    // Predict next project type
    const projectPrediction = this.predictNextProject(patterns, episodes, projects);
    if (projectPrediction) predictions.push(projectPrediction);

    // Predict next question
    const questionPrediction = this.predictNextQuestion(investigations, facts);
    if (questionPrediction) predictions.push(questionPrediction);

    // Predict roadblocks
    const roadblockPrediction = this.predictRoadblocks(episodes, patterns);
    if (roadblockPrediction) predictions.push(roadblockPrediction);

    // Predict success probability
    const successPrediction = this.predictSuccess(episodes, patterns);
    if (successPrediction) predictions.push(successPrediction);

    // Predict from patterns
    for (const p of patterns.slice(0, 5)) {
      if (p.prediction) {
        const existing = MemoryStore.getPredictions().find(
          (pr) => pr.title === p.pattern && pr.type === "next_question",
        );
        if (!existing) {
          predictions.push({
            id: "",
            type: "next_question",
            title: p.pattern,
            description: p.prediction,
            confidence: p.confidence * 0.8,
            evidence: p.evidence.slice(0, 3),
            relatedPatternIds: [p.id],
            createdAt: Date.now(),
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week
          });
        }
      }
    }

    return predictions;
  },

  /**
   * Predict the user's next likely project focus.
   */
  predictNextProject(
    patterns: DetectedPattern[],
    episodes: EpisodeMemory[],
    projects: ProjectMemory[],
  ): Prediction | null {
    // Find the most common topic pattern
    const topicPatterns = patterns.filter((p) => p.category === "topic" || p.category === "interest");
    if (topicPatterns.length === 0) return null;

    const topPattern = topicPatterns.sort((a, b) => b.confidence - a.confidence)[0];
    const now = Date.now();
    const existing = MemoryStore.getPredictions().find((p) => p.type === "next_project");

    if (existing) return null; // Already predicted

    return {
      id: "",
      type: "next_project",
      title: `Likely focus: ${topPattern.pattern}`,
      description: `Based on repeated ${topPattern.category} activity, you may focus on "${topPattern.pattern}" next.`,
      confidence: topPattern.confidence * 0.7,
      evidence: topPattern.evidence.slice(0, 3),
      relatedPatternIds: [topPattern.id],
      createdAt: now,
      expiresAt: now + 14 * 24 * 60 * 60 * 1000, // 2 weeks
    };
  },

  /**
   * Predict what question the user might ask next.
   */
  predictNextQuestion(
    investigations: import("./types").InvestigationMemory[],
    facts: SemanticFact[],
  ): Prediction | null {
    // Check for open questions in active investigations
    const activeInvs = investigations.filter((i) => i.status === "active");
    if (activeInvs.length === 0) return null;

    const topInv = activeInvs.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (topInv.openQuestions.length === 0) return null;

    const now = Date.now();

    return {
      id: "",
      type: "next_question",
      title: topInv.openQuestions[0],
      description: `From investigation "${topInv.question}": ${topInv.openQuestions[0]}`,
      confidence: 0.6,
      evidence: [topInv.question],
      relatedPatternIds: [],
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
    };
  },

  /**
   * Predict likely roadblocks based on past mistakes.
   */
  predictRoadblocks(
    episodes: EpisodeMemory[],
    patterns: DetectedPattern[],
  ): Prediction | null {
    const mistakes = episodes.filter((e) => e.type === "mistake");
    if (mistakes.length < 2) return null;

    const recentMistake = mistakes.sort((a, b) => b.timestamp - a.timestamp)[0];
    const now = Date.now();

    return {
      id: "",
      type: "roadblock",
      title: `Risk: ${recentMistake.summary.slice(0, 60)}`,
      description: `Similar to a past obstacle: "${recentMistake.summary}"`,
      confidence: 0.4,
      evidence: [recentMistake.summary],
      relatedPatternIds: [],
      createdAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
    };
  },

  /**
   * Predict success probability based on past patterns.
   */
  predictSuccess(
    episodes: EpisodeMemory[],
    patterns: DetectedPattern[],
  ): Prediction | null {
    const successes = episodes.filter((e) => e.type === "success");
    const failures = episodes.filter((e) => e.type === "mistake" || e.type === "experiment");

    if (successes.length + failures.length < 3) return null;

    const ratio = successes.length / (successes.length + failures.length);
    const now = Date.now();

    return {
      id: "",
      type: "success",
      title: `${Math.round(ratio * 100)}% historical success rate`,
      description: `Past performance: ${successes.length} successes vs ${failures.length} challenges. Maintain current approach.`,
      confidence: Math.min(0.7, ratio * 0.8),
      evidence: [
        `${successes.length} successful episodes`,
        `${failures.length} challenging episodes`,
      ],
      relatedPatternIds: [],
      createdAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
    };
  },

  /**
   * Update all predictions (generate new ones, expire old ones).
   * Returns count of updated predictions.
   */
  updateAll(): number {
    const newPredictions = this.generate();
    let count = 0;

    for (const pred of newPredictions) {
      MemoryStore.addPrediction(pred);
      count++;
    }

    // Expire old predictions
    const all = MemoryStore.getPredictions();
    const now = Date.now();
    for (const p of all) {
      if (p.expiresAt < now && p.verified === undefined) {
        MemoryStore.updatePrediction(p.id, { verified: false, verifiedAt: now });
        count++;
      }
    }

    return count;
  },

  /**
   * Get active (non-expired, non-verified) predictions.
   */
  getActive(): Prediction[] {
    const now = Date.now();
    return MemoryStore.getPredictions()
      .filter((p) => p.expiresAt > now && p.verified === undefined)
      .sort((a, b) => b.confidence - a.confidence);
  },
};
