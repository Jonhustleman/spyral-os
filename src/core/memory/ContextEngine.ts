/**
 * SPYRAL OS — ContextEngine
 *
 * Before every response, retrieve the right context.
 * Dynamic, not static.
 *
 * Retrieves:
 * - Identity (who is this user?)
 * - Current Project
 * - Recent Investigations
 * - Related Knowledge
 * - Past Decisions
 * - Patterns
 * - Goals
 * - Open Questions
 * - Writing Style
 * - Thinking Style
 *
 * Never retrieves everything.
 * Retrieves only: Most Relevant, Most Recent, Most Similar, Most Important, Highest Confidence.
 */

"use client";

import { MemoryStore } from "./MemoryStore";
import { MemoryIndex } from "./MemoryIndex";
import { SemanticSearch } from "./SemanticSearch";
import type {
  RetrievedContext,
  ContextOptions,
  IdentityMemory,
  WorkingMemory,
  EpisodeMemory,
  SemanticFact,
  DetectedPattern,
  ProjectMemory,
  InvestigationMemory,
} from "./types";

export const ContextEngine = {
  /**
   * Build context for a given query/topic.
   * This is what SPYRAL knows before generating a response.
   */
  retrieve(query: string = "", options: ContextOptions = {}): RetrievedContext {
    const opts: ContextOptions = {
      includeIdentity: true,
      includeWorking: true,
      includeRecentEpisodes: true,
      includeRelatedKnowledge: true,
      includePastDecisions: true,
      includePatterns: true,
      includeGoals: true,
      includeOpenQuestions: true,
      maxItems: 10,
      ...options,
    };

    const identity = opts.includeIdentity ? MemoryStore.getIdentity() : null;
    const working = opts.includeWorking ? MemoryStore.getWorkingMemory() : null;

    // Recent episodes (non-archived, non-mistake for context freshness)
    const recentEpisodes = opts.includeRecentEpisodes
      ? MemoryStore.getRecentEpisodes(opts.maxItems || 10)
      : [];

    // Related facts via semantic search
    const relatedFacts = query
      ? SemanticSearch.searchFacts(query, opts.maxItems || 5)
      : [];

    // Past decisions (episodes of type "decision")
    const pastDecisions = opts.includePastDecisions
      ? MemoryStore.getEpisodes()
          .filter((e) => e.type === "decision" && !e.archived)
          .slice(0, opts.maxItems || 5)
      : [];

    // Detected patterns
    const patterns = opts.includePatterns
      ? MemoryStore.getPatterns()
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, opts.maxItems || 5)
      : [];

    // Goals from identity
    const goals: string[] = [];
    if (opts.includeGoals && identity) {
      goals.push(...identity.goals);
    }

    // Open questions from working memory
    const openQuestions: string[] = [];
    if (opts.includeOpenQuestions && working) {
      openQuestions.push(...working.openQuestions);
    }

    // Get recent projects (active first)
    const projects = MemoryStore.getProjects()
      .sort((a, b) => (a.status === "active" ? -1 : 1))
      .slice(0, opts.maxItems || 3);

    // Get active investigations
    const investigations = MemoryStore.getInvestigations()
      .filter((i) => i.status === "active")
      .slice(0, opts.maxItems || 3);

    return {
      identity,
      working,
      recentEpisodes,
      relatedFacts,
      pastDecisions,
      patterns,
      goals,
      openQuestions,
      projects,
      investigations,
    };
  },

  /**
   * Generate a context summary string suitable for LLM prompts.
   */
  summarize(query: string = "", options: ContextOptions = {}): string {
    const ctx = this.retrieve(query, options);
    const parts: string[] = [];

    // Identity
    if (ctx.identity) {
      parts.push(`USER: ${ctx.identity.name}`);
      parts.push(`ROLE: ${ctx.identity.role}`);
      parts.push(`THINKING STYLE: ${ctx.identity.preferredThinkingStyle}`);
      parts.push(`WRITING STYLE: ${ctx.identity.preferredWritingStyle}`);
    }

    // Working memory
    if (ctx.working) {
      if (ctx.working.currentMission) parts.push(`MISSION: ${ctx.working.currentMission}`);
      if (ctx.working.currentInvestigation) parts.push(`INVESTIGATING: ${ctx.working.currentInvestigation}`);
      if (ctx.working.currentProject) parts.push(`PROJECT: ${ctx.working.currentProject}`);
      if (ctx.working.currentObstacles.length > 0) {
        parts.push(`OBSTACLES: ${ctx.working.currentObstacles.join(", ")}`);
      }
      if (ctx.working.currentPriorities.length > 0) {
        parts.push(`PRIORITIES: ${ctx.working.currentPriorities.join(", ")}`);
      }
    }

    // Projects
    if (ctx.projects.length > 0) {
      parts.push(`PROJECTS: ${ctx.projects.map((p) => `[${p.status}] ${p.name}`).join(", ")}`);
    }

    // Investigations
    if (ctx.investigations.length > 0) {
      parts.push(`INVESTIGATIONS: ${ctx.investigations.map((i) => i.question).join(", ")}`);
    }

    // Recent context
    if (ctx.recentEpisodes.length > 0) {
      parts.push(`RECENT: ${ctx.recentEpisodes.map((e) => e.summary).join(" | ")}`);
    }

    // Patterns
    if (ctx.patterns.length > 0) {
      parts.push(`PATTERNS: ${ctx.patterns.map((p) => p.pattern).join(", ")}`);
    }

    // Goals
    if (ctx.goals.length > 0) {
      parts.push(`GOALS: ${ctx.goals.join(", ")}`);
    }

    // Open questions
    if (ctx.openQuestions.length > 0) {
      parts.push(`OPEN QUESTIONS: ${ctx.openQuestions.join(", ")}`);
    }

    return parts.join("\n");
  },
};
