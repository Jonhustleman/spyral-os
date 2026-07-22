/**
 * SPYRAL OS — ReflectionEngine
 *
 * At scheduled intervals, SPYRAL asks itself:
 * - What did I learn?
 * - What surprised me?
 * - What patterns are emerging?
 * - What assumptions changed?
 * - What projects became connected?
 * - What should the user know?
 *
 * Produces: Weekly Reflection, Monthly Reflection, Workspace Reflection, Project Reflection
 */

"use client";

import { MemoryStore } from "./MemoryStore";
import { RelationshipEngine } from "./RelationshipEngine";
import { PatternEngine } from "./PatternEngine";
import { KnowledgeGraph } from "./KnowledgeGraph";
import type { Reflection, ReflectionType, EpisodeMemory } from "./types";

export const ReflectionEngine = {
  /**
   * Generate a reflection for the given type and period.
   */
  generate(type: ReflectionType, period: { start: number; end: number }): Reflection {
    const episodes = MemoryStore.getEpisodes().filter(
      (e) => e.timestamp >= period.start && e.timestamp <= period.end,
    );
    const patterns = MemoryStore.getPatterns();
    const projects = MemoryStore.getProjects();
    const facts = MemoryStore.getSemanticFacts();
    const relationships = RelationshipEngine.analyze();
    const graphSummary = KnowledgeGraph.getSummary();

    // What did I learn?
    const learned = facts
      .filter((f) => f.createdAt >= period.start)
      .slice(0, 5)
      .map((f) => f.statement);

    // What surprised me?
    const surprises = relationships.unexpectedConnections
      .slice(0, 3)
      .map((c) => `"${c.nodeA.label}" connected to "${c.nodeB.label}" via ${c.suggestedEdge}`);

    // What patterns are emerging?
    const emergingPatterns = patterns
      .filter((p) => p.lastDetected >= period.start)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map((p) => `${p.pattern} (${Math.round(p.confidence * 100)}% confidence)`);

    // What assumptions changed?
    const contradictions = relationships.contradictions
      .slice(0, 3)
      .map((c) => c.reason);

    // What projects became connected?
    const projectConnections = this.findProjectConnections(projects, episodes);

    // Recommendations
    const recommendations = relationships.emergingThemes
      .slice(0, 3)
      .map((t) => `Consider exploring "${t.theme}" further — ${t.evidence.length} related instances found`);

    const title = this.getReflectionTitle(type, period);

    const reflection: Reflection = {
      id: "",
      type,
      title,
      content: this.buildContent(type, period, {
        learned,
        surprises,
        emergingPatterns,
        assumptionsChanged: contradictions,
        projectConnections,
      }),
      learned,
      surprises,
      patterns: emergingPatterns,
      assumptionsChanged: contradictions,
      connectionsMade: projectConnections,
      recommendations,
      period,
      createdAt: Date.now(),
    };

    return MemoryStore.addReflection(reflection);
  },

  /**
   * Generate a weekly reflection.
   */
  generateWeekly(): Reflection {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    return this.generate("weekly", { start: weekAgo, end: now });
  },

  /**
   * Generate a monthly reflection.
   */
  generateMonthly(): Reflection {
    const now = Date.now();
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
    return this.generate("monthly", { start: monthAgo, end: now });
  },

  /**
   * Generate a workspace reflection.
   */
  generateWorkspace(): Reflection {
    const now = Date.now();
    const start = MemoryStore.getMetrics().lastConsolidation || now - 90 * 24 * 60 * 60 * 1000;
    return this.generate("workspace", { start, end: now });
  },

  /**
   * Generate a project reflection.
   */
  generateProject(projectId: string): Reflection | null {
    const project = MemoryStore.getProject(projectId);
    if (!project) return null;

    const episodes = MemoryStore.getEpisodes().filter((e) => e.projectId === projectId);
    const period = { start: project.createdAt, end: Date.now() };

    return this.generate("project", period);
  },

  /**
   * Find connections between projects.
   */
  findProjectConnections(
    projects: import("./types").ProjectMemory[],
    episodes: EpisodeMemory[],
  ): string[] {
    const connections: string[] = [];
    const activeProjects = projects.filter((p) => p.status === "active");

    for (let i = 0; i < activeProjects.length; i++) {
      for (let j = i + 1; j < activeProjects.length; j++) {
        const a = activeProjects[i];
        const b = activeProjects[j];

        // Check for shared tags in episodes
        const aEpisodes = episodes.filter((e) => e.projectId === a.id);
        const bEpisodes = episodes.filter((e) => e.projectId === b.id);
        const aTags = new Set(aEpisodes.flatMap((e) => e.tags));
        const bTags = new Set(bEpisodes.flatMap((e) => e.tags));
        const sharedTags = [...aTags].filter((t) => bTags.has(t));

        if (sharedTags.length > 0) {
          connections.push(
            `"${a.name}" and "${b.name}" share topics: ${sharedTags.slice(0, 3).join(", ")}`,
          );
        }
      }
    }

    return connections;
  },

  /**
   * Get the reflection title.
   */
  getReflectionTitle(type: ReflectionType, period: { start: number; end: number }): string {
    const startDate = new Date(period.start);
    const endDate = new Date(period.end);

    switch (type) {
      case "weekly":
        return `Weekly Reflection (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`;
      case "monthly":
        return `Monthly Reflection - ${endDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
      case "workspace":
        return `Workspace Reflection - ${endDate.toLocaleDateString()}`;
      case "project":
        return `Project Reflection - ${endDate.toLocaleDateString()}`;
    }
  },

  /**
   * Build the full reflection content.
   */
  buildContent(
    type: ReflectionType,
    period: { start: number; end: number },
    data: {
      learned: string[];
      surprises: string[];
      emergingPatterns: string[];
      assumptionsChanged: string[];
      projectConnections: string[];
    },
  ): string {
    const parts: string[] = [];

    parts.push(`# ${this.getReflectionTitle(type, period)}`);
    parts.push("");

    if (data.learned.length > 0) {
      parts.push("## What I Learned");
      data.learned.forEach((l) => parts.push(`- ${l}`));
      parts.push("");
    }

    if (data.surprises.length > 0) {
      parts.push("## What Surprised Me");
      data.surprises.forEach((s) => parts.push(`- ${s}`));
      parts.push("");
    }

    if (data.emergingPatterns.length > 0) {
      parts.push("## Emerging Patterns");
      data.emergingPatterns.forEach((p) => parts.push(`- ${p}`));
      parts.push("");
    }

    if (data.assumptionsChanged.length > 0) {
      parts.push("## Assumptions That Changed");
      data.assumptionsChanged.forEach((a) => parts.push(`- ${a}`));
      parts.push("");
    }

    if (data.projectConnections.length > 0) {
      parts.push("## Project Connections");
      data.projectConnections.forEach((c) => parts.push(`- ${c}`));
      parts.push("");
    }

    return parts.join("\n");
  },

  /**
   * Get the latest reflection of a given type.
   */
  getLatest(type: ReflectionType): Reflection | null {
    return MemoryStore.getReflections()
      .filter((r) => r.type === type)
      .sort((a, b) => b.createdAt - a.createdAt)[0] || null;
  },
};
