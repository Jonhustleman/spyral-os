/**
 * ProductResearchEngine (PRE) — SPYRAL Researches Itself
 *
 * Treats SPYRAL as a research subject. Investigates:
 * - Why users leave, return, abandon, succeed, become confused
 *
 * Generates:
 * - Research Questions
 * - Hypotheses
 * - Evidence
 * - Unknown Variables
 * - Experiments
 * - Competing Explanations
 * - Confidence
 *
 * SPYRAL researches itself exactly as it researches user problems.
 */

"use client";

import { ExperienceRecorder, type ExperienceEvent, type ExperienceSession } from "./ExperienceRecorder";
import { ExperienceAdaptationEngine } from "./ExperienceAdaptationEngine";

// ─── Types ─────────────────────────────────────────────────────────────

export interface ResearchQuestion {
  id: string;
  question: string;
  category: "retention" | "abandonment" | "confusion" | "success" | "engagement";
  generatedAt: number;
  hypotheses: Hypothesis[];
  status: "uninvestigated" | "collecting_data" | "analyzing" | "concluded";
}

export interface Hypothesis {
  id: string;
  statement: string;
  evidence: EvidenceItem[];
  unknownVariables: string[];
  competingExplanations: string[];
  confidence: number; // 0-1
  experiments: Experiment[];
}

export interface EvidenceItem {
  observation: string;
  source: string;
  strength: "strong" | "moderate" | "weak";
}

export interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  prediction: string;
  evidenceRequired: string;
  sessionsRequired: number;
  status: "proposed" | "collecting_data" | "completed" | "cancelled";
  result?: string;
  confidenceDelta?: number;
}

// ─── Storage ───────────────────────────────────────────────────────────

const STORAGE_KEY_QUESTIONS = "spyral_pre_questions";

function generateId(): string {
  return `pre_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

export const ProductResearchEngine = {
  /**
   * Run PRE analysis — generate research questions from session data.
   */
  analyze(): ResearchQuestion[] {
    const sessions = ExperienceRecorder.getSessions();
    const events = ExperienceRecorder.getEvents();
    const frictionRecs = ExperienceAdaptationEngine.getFrictionRecommendations();

    const questions: ResearchQuestion[] = [];

    // ── Q1: Why do users abandon early? ─────────────────────────────
    const abandonedSessions = sessions.filter((s) => {
      if (!s.endTime) return false;
      return (s.duration ?? 0) < 30000 && !s.projectCreated && !s.assetsGenerated;
    });

    if (abandonedSessions.length >= 2) {
      const abandonRate = abandonedSessions.length / sessions.length;
      const evidence: EvidenceItem[] = [
        {
          observation: `${abandonedSessions.length} of ${sessions.length} sessions (${Math.round(abandonRate * 100)}%) abandoned within 30s with no output.`,
          source: "ExperienceRecorder sessions analysis",
          strength: abandonRate > 0.3 ? "strong" : abandonRate > 0.15 ? "moderate" : "weak",
        },
      ];

      // Add friction evidence if available
      const frictionEvidence = frictionRecs.filter((r) =>
        r.observedFriction.toLowerCase().includes("abandon"),
      );
      for (const rec of frictionEvidence) {
        evidence.push({
          observation: rec.observedFriction,
          source: "ExperienceAdaptationEngine",
          strength: rec.confidence > 0.7 ? "strong" : "moderate",
        });
      }

      const hypothesis: Hypothesis = {
        id: generateId(),
        statement: `Users abandon early because the initial cognitive load exceeds their available time or attention.`,
        evidence,
        unknownVariables: [
          "Whether users are distracted or intentionally leaving",
          "Whether the UI is unclear on first visit",
          "Whether users find what they need quickly elsewhere",
        ],
        competingExplanations: [
          "Users may be exploring and plan to return later",
          "Users may have accidentally opened the app",
          "Users may have found the answer immediately and left satisfied",
        ],
        confidence: Math.min(0.3 + abandonRate * 0.5, 0.85),
        experiments: [
          {
            id: generateId(),
            name: "Simplify initial interaction",
            hypothesis: "Reducing the initial input prompt to a single click instead of a text input will decrease abandonment.",
            prediction: "Early abandonment drops by 20%",
            evidenceRequired: "Compare abandonment rates before/after change over 50 sessions",
            sessionsRequired: 50,
            status: "proposed",
          },
        ],
      };

      questions.push({
        id: generateId(),
        question: `Why do ${Math.round(abandonRate * 100)}% of users abandon SPYRAL within 30 seconds?`,
        category: "abandonment",
        generatedAt: Date.now(),
        hypotheses: [hypothesis],
        status: "uninvestigated",
      });
    }

    // ── Q2: What drives users to return? ────────────────────────────
    const returnedSessions = sessions.filter((s) => s.returnedLater);
    const returnRate = sessions.length > 0 ? returnedSessions.length / sessions.length : 0;

    if (returnedSessions.length >= 2) {
      const retEvidence: EvidenceItem[] = [
        {
          observation: `${returnedSessions.length} users returned (${Math.round(returnRate * 100)}% return rate).`,
          source: "ExperienceRecorder sessions analysis",
          strength: returnRate > 0.3 ? "strong" : returnRate > 0.15 ? "moderate" : "weak",
        },
      ];

      // Check what those users did
      const retEventTypes: Record<string, number> = {};
      for (const session of returnedSessions) {
        const sessionEvents = events.filter((e) => e.sessionId === session.id);
        for (const evt of sessionEvents) {
          retEventTypes[evt.type] = (retEventTypes[evt.type] ?? 0) + 1;
        }
      }

      const topRetAction = Object.entries(retEventTypes).sort((a, b) => b[1] - a[1]).slice(0, 3);

      const hypothesis: Hypothesis = {
        id: generateId(),
        statement: `Users return when their first session involved ${topRetAction.length > 0 ? topRetAction[0][0].replace(/_/g, ' ') : 'productive work'}.`,
        evidence: retEvidence,
        unknownVariables: [
          "What external factors trigger return visits",
          "Whether users remember specific outcomes from first session",
        ],
        competingExplanations: [
          "Users may return due to external reminders, not product quality",
          "Users may have bookmarked the app for future reference",
        ],
        confidence: 0.5,
        experiments: [
          {
            id: generateId(),
            name: "Track return triggers",
            hypothesis: "Users who create a project in their first session are 2x more likely to return.",
            prediction: "Project creation increases return rate by 50%",
            evidenceRequired: "Compare return rates between users who created projects vs those who didn't",
            sessionsRequired: 100,
            status: "proposed",
          },
        ],
      };

      questions.push({
        id: generateId(),
        question: `What drives ${returnedSessions.length} users to return to SPYRAL?`,
        category: "retention",
        generatedAt: Date.now(),
        hypotheses: [hypothesis],
        status: "uninvestigated",
      });
    }

    // ── Q3: Which agent provides the most value? ───────────────────
    const agentTypes = ["research", "content", "navigation", "consultant"];
    const agentCompletions: Record<string, number> = {};
    for (const agent of agentTypes) {
      agentCompletions[agent] = events.filter(
        (e) => e.type === `${agent}_completed` || e.agentType === agent,
      ).length;
    }

    const sortedAgents = Object.entries(agentCompletions).sort((a, b) => b[1] - a[1]);
    if (sortedAgents.length >= 2 && sortedAgents[0][1] > 0) {
      const topAgent = sortedAgents[0];
      const bottomAgent = sortedAgents[sortedAgents.length - 1];

      const hypothesis: Hypothesis = {
        id: generateId(),
        statement: `Users find the "${topAgent[0]}" agent most useful (used ${topAgent[1]} times) and "${bottomAgent[0]}" least useful (used ${bottomAgent[1]} times).`,
        evidence: [
          {
            observation: `"${topAgent[0]}" completed: ${topAgent[1]} times`,
            source: "ExperienceRecorder event analysis",
            strength: topAgent[1] > bottomAgent[1] * 3 ? "strong" : "moderate",
          },
          {
            observation: `"${bottomAgent[0]}" completed: ${bottomAgent[1]} times`,
            source: "ExperienceRecorder event analysis",
            strength: "moderate",
          },
        ],
        unknownVariables: [
          "Whether low usage means low value or low discoverability",
          "Whether users understand what each agent does",
        ],
        competingExplanations: [
          `"${bottomAgent[0]}" may be harder to find in the UI`,
          `"${bottomAgent[0]}" may require more effort to use`,
          "Users may not understand the purpose of each agent",
        ],
        confidence: 0.6,
        experiments: [
          {
            id: generateId(),
            name: `Improve ${bottomAgent[0]} discoverability`,
            hypothesis: `Adding a shortcut to ${bottomAgent[0]} from the home page will increase usage by 50%.`,
            prediction: `50% increase in ${bottomAgent[0]} usage`,
            evidenceRequired: `Compare ${bottomAgent[0]} usage before/after adding shortcut over 2 weeks`,
            sessionsRequired: 100,
            status: "proposed",
          },
        ],
      };

      questions.push({
        id: generateId(),
        question: `Why is "${topAgent[0]}" used ${(topAgent[1] / Math.max(bottomAgent[1], 1)).toFixed(1)}x more than "${bottomAgent[0]}"?`,
        category: "engagement",
        generatedAt: Date.now(),
        hypotheses: [hypothesis],
        status: "uninvestigated",
      });
    }

    // ── Q4: Do users complete productive outcomes? ──────────────────
    const sessionsWithProjects = sessions.filter((s) => s.projectCreated).length;
    const sessionsWithAssets = sessions.filter((s) => s.assetsGenerated).length;

    if (sessions.length >= 5) {
      const productiveRate = (sessionsWithProjects + sessionsWithAssets) / sessions.length;

      const hypothesis: Hypothesis = {
        id: generateId(),
        statement: `${Math.round(productiveRate * 100)}% of sessions result in productive outcomes (projects or assets).`,
        evidence: [
          {
            observation: `Sessions with projects: ${sessionsWithProjects}`,
            source: "ExperienceRecorder",
            strength: sessionsWithProjects > sessions.length * 0.3 ? "strong" : "moderate",
          },
          {
            observation: `Sessions with assets: ${sessionsWithAssets}`,
            source: "ExperienceRecorder",
            strength: sessionsWithAssets > sessions.length * 0.3 ? "strong" : "moderate",
          },
        ],
        unknownVariables: [
          "Whether users consider their sessions productive even without creating projects/assets",
          "What users do after a session ends",
        ],
        competingExplanations: [
          "Users may use SPYRAL for learning/conversation, not just project creation",
          "Productive outcomes may happen outside the tracked session",
        ],
        confidence: 0.55,
        experiments: [
          {
            id: generateId(),
            name: "Session outcome survey",
            hypothesis: "Users who don't create projects still find SPYRAL valuable for learning and exploration.",
            prediction: "60%+ of users without projects report high satisfaction",
            evidenceRequired: "Survey users after sessions without project creation for 2 weeks",
            sessionsRequired: 50,
            status: "proposed",
          },
        ],
      };

      questions.push({
        id: generateId(),
        question: `Are users being productive? Only ${sessionsWithProjects + sessionsWithAssets} of ${sessions.length} sessions produce tangible outputs.`,
        category: "success",
        generatedAt: Date.now(),
        hypotheses: [hypothesis],
        status: "uninvestigated",
      });
    }

    // ── Save ───────────────────────────────────────────────────────
    const existing = this.getResearchQuestions();
    const all = [...questions, ...existing].slice(0, 20);
    save(STORAGE_KEY_QUESTIONS, all);

    return questions;
  },

  /**
   * Get all research questions.
   */
  getResearchQuestions(): ResearchQuestion[] {
    return load<ResearchQuestion[]>(STORAGE_KEY_QUESTIONS, []);
  },

  /**
   * Update the status of a research question.
   */
  updateQuestionStatus(id: string, status: ResearchQuestion["status"]): void {
    const questions = this.getResearchQuestions();
    const idx = questions.findIndex((q) => q.id === id);
    if (idx !== -1) {
      questions[idx].status = status;
      save(STORAGE_KEY_QUESTIONS, questions);
    }
  },

  /**
   * Add a new experiment to a hypothesis.
   */
  addExperiment(questionId: string, hypothesisId: string, experiment: Experiment): void {
    const questions = this.getResearchQuestions();
    const qIdx = questions.findIndex((q) => q.id === questionId);
    if (qIdx !== -1) {
      const hIdx = questions[qIdx].hypotheses.findIndex((h) => h.id === hypothesisId);
      if (hIdx !== -1) {
        questions[qIdx].hypotheses[hIdx].experiments.push(experiment);
        save(STORAGE_KEY_QUESTIONS, questions);
      }
    }
  },

  /**
   * Get count of active research questions.
   */
  getQuestionCount(): number {
    return this.getResearchQuestions().length;
  },

  /**
   * Get count of proposed experiments.
   */
  getExperimentCount(): number {
    const questions = this.getResearchQuestions();
    return questions.reduce((sum, q) => sum + q.hypotheses.reduce((s, h) => s + h.experiments.length, 0), 0);
  },
};
