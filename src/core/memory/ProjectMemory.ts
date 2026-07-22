/**
 * SPYRAL OS — ProjectMemory
 *
 * Every project has its own memory context.
 * Manages project-specific episodes, facts, and relationships.
 */

"use client";

import { MemoryStore } from "./MemoryStore";
import { KnowledgeGraph } from "./KnowledgeGraph";
import { TimelineEngine } from "./TimelineEngine";
import type { ProjectMemory, EpisodeMemory } from "./types";

export const ProjectMemoryManager = {
  /**
   * Create a new project in memory.
   */
  create(
    name: string,
    mission: string,
    goal: string,
    options: {
      researchFindings?: string[];
      strategies?: string[];
      decisions?: string[];
      assets?: string[];
    } = {},
  ): ProjectMemory {
    const project = MemoryStore.addProject({
      name,
      mission,
      goal,
      timeline: { start: Date.now() },
      researchFindings: options.researchFindings || [],
      contentCreated: [],
      strategies: options.strategies || [],
      decisions: options.decisions || [],
      experiments: [],
      failures: [],
      successes: [],
      assets: options.assets || [],
      learnings: [],
      relatedProjectIds: [],
      status: "active",
    });

    // Add to knowledge graph
    KnowledgeGraph.addNode("project", name, mission, {
      goal,
      status: "active",
    });

    // Record timeline
    TimelineEngine.recordProject(project.id, `Project created: ${name}`, mission);

    return project;
  },

  /**
   * Get a project by ID.
   */
  get(id: string): ProjectMemory | undefined {
    return MemoryStore.getProject(id);
  },

  /**
   * Get all projects.
   */
  getAll(): ProjectMemory[] {
    return MemoryStore.getProjects();
  },

  /**
   * Get active projects.
   */
  getActive(): ProjectMemory[] {
    return MemoryStore.getProjects().filter((p) => p.status === "active");
  },

  /**
   * Record a research finding for a project.
   */
  addResearchFinding(projectId: string, finding: string): void {
    const project = this.get(projectId);
    if (!project) return;

    MemoryStore.updateProject(projectId, {
      researchFindings: [...project.researchFindings, finding],
    });
    TimelineEngine.recordProject(projectId, "Research finding", finding);
  },

  /**
   * Record content created for a project.
   */
  addContent(projectId: string, contentRef: string): void {
    const project = this.get(projectId);
    if (!project) return;

    MemoryStore.updateProject(projectId, {
      contentCreated: [...project.contentCreated, contentRef],
    });
  },

  /**
   * Record a decision made for this project.
   */
  addDecision(projectId: string, decision: string): void {
    const project = this.get(projectId);
    if (!project) return;

    MemoryStore.updateProject(projectId, {
      decisions: [...project.decisions, decision],
    });
    TimelineEngine.recordProject(projectId, "Decision made", decision);
  },

  /**
   * Record a failure for this project.
   */
  addFailure(projectId: string, failure: string): void {
    const project = this.get(projectId);
    if (!project) return;

    MemoryStore.updateProject(projectId, {
      failures: [...project.failures, failure],
    });
    TimelineEngine.recordProject(projectId, "Failure", failure);
  },

  /**
   * Record a success for this project.
   */
  addSuccess(projectId: string, success: string): void {
    const project = this.get(projectId);
    if (!project) return;

    MemoryStore.updateProject(projectId, {
      successes: [...project.successes, success],
    });
    TimelineEngine.recordProject(projectId, "Success", success);
  },

  /**
   * Update project status.
   */
  setStatus(projectId: string, status: ProjectMemory["status"]): void {
    MemoryStore.updateProject(projectId, {
      status,
      timeline: {
        start: this.get(projectId)?.timeline?.start ?? Date.now(),
        end: status === "completed" || status === "archived" ? Date.now() : undefined,
      },
    });

    // Update knowledge graph
    const project = this.get(projectId);
    if (project) {
      const node = KnowledgeGraph.findNode("project", project.name);
      if (node) {
        KnowledgeGraph.updateNodeMetadata(node.id, { status });
      }
    }

    TimelineEngine.recordProject(projectId, `Status changed: ${status}`, "");
  },

  /**
   * Get project summary.
   */
  getSummary(projectId: string): string {
    const project = this.get(projectId);
    if (!project) return "Project not found.";

    const parts: string[] = [
      `# ${project.name}`,
      `**Mission:** ${project.mission}`,
      `**Goal:** ${project.goal}`,
      `**Status:** ${project.status}`,
      ``,
      `**Research:** ${project.researchFindings.length} findings`,
      `**Content:** ${project.contentCreated.length} items`,
      `**Decisions:** ${project.decisions.length}`,
      `**Successes:** ${project.successes.length}`,
      `**Failures:** ${project.failures.length}`,
    ];

    return parts.join("\n");
  },

  /**
   * Link two projects together.
   */
  linkProjects(projectIdA: string, projectIdB: string): void {
    const a = this.get(projectIdA);
    const b = this.get(projectIdB);
    if (!a || !b) return;

    // Update both projects
    MemoryStore.updateProject(projectIdA, {
      relatedProjectIds: [...new Set([...a.relatedProjectIds, projectIdB])],
    });
    MemoryStore.updateProject(projectIdB, {
      relatedProjectIds: [...new Set([...b.relatedProjectIds, projectIdA])],
    });

    // Add knowledge graph edge
    const nodeA = KnowledgeGraph.findNode("project", a.name);
    const nodeB = KnowledgeGraph.findNode("project", b.name);
    if (nodeA && nodeB) {
      KnowledgeGraph.addEdge(nodeA.id, nodeB.id, "related_to", 0.7, {
        reason: "Explicitly linked by user",
      });
    }
  },
};
