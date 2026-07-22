/**
 * SPYRAL OS — TimelineEngine
 *
 * Every event becomes part of:
 * - Personal Timeline
 * - Project Timeline
 * - Research Timeline
 * - Learning Timeline
 * - Company Timeline
 *
 * Users can replay their thinking.
 */

"use client";

import { MemoryStore } from "./MemoryStore";
import type { TimelineEntry, TimelineType, EpisodeMemory } from "./types";

export const TimelineEngine = {
  /**
   * Record an event in the timeline.
   */
  record(
    type: TimelineType,
    title: string,
    description: string,
    options: {
      episodeId?: string;
      projectId?: string;
      investigationId?: string;
      tags?: string[];
      importance?: number;
    } = {},
  ): TimelineEntry {
    return MemoryStore.addTimelineEntry({
      type,
      title,
      description,
      episodeId: options.episodeId,
      projectId: options.projectId,
      investigationId: options.investigationId,
      tags: options.tags || [],
      importance: options.importance ?? 0.5,
    });
  },

  /**
   * Record a personal event.
   */
  recordPersonal(title: string, description: string, options: Partial<TimelineEntry> = {}): TimelineEntry {
    return this.record("personal", title, description, options);
  },

  /**
   * Record a project event.
   */
  recordProject(projectId: string, title: string, description: string): TimelineEntry {
    return this.record("project", title, description, { projectId });
  },

  /**
   * Record a research event.
   */
  recordResearch(investigationId: string, title: string, description: string): TimelineEntry {
    return this.record("research", title, description, { investigationId });
  },

  /**
   * Record a learning event.
   */
  recordLearning(title: string, description: string): TimelineEntry {
    return this.record("learning", title, description);
  },

  /**
   * Get timeline entries, optionally filtered by type.
   */
  getTimeline(type?: TimelineType, limit: number = 50): TimelineEntry[] {
    const all = MemoryStore.getTimeline();
    if (type) return all.filter((t) => t.type === type).slice(0, limit);
    return all.slice(0, limit);
  },

  /**
   * Get timeline entries for a specific project.
   */
  getProjectTimeline(projectId: string): TimelineEntry[] {
    return MemoryStore.getTimeline()
      .filter((t) => t.projectId === projectId)
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  /**
   * Get timeline entries for a specific investigation.
   */
  getInvestigationTimeline(investigationId: string): TimelineEntry[] {
    return MemoryStore.getTimeline()
      .filter((t) => t.investigationId === investigationId)
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  /**
   * Get timeline entries grouped by date.
   */
  getTimelineByDate(limit: number = 100): Map<string, TimelineEntry[]> {
    const entries = MemoryStore.getTimeline().slice(0, limit);
    const grouped = new Map<string, TimelineEntry[]>();

    for (const entry of entries) {
      const dateKey = new Date(entry.timestamp).toLocaleDateString();
      const group = grouped.get(dateKey) || [];
      group.push(entry);
      grouped.set(dateKey, group);
    }

    return grouped;
  },

  /**
   * Get timeline summary (counts by type).
   */
  getSummary(): { type: TimelineType; count: number }[] {
    const all = MemoryStore.getTimeline();
    const counts = new Map<TimelineType, number>();

    for (const entry of all) {
      counts.set(entry.type, (counts.get(entry.type) || 0) + 1);
    }

    return [...counts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  },
};
