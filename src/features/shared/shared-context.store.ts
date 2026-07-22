/**
 * SPYRAL OS — Shared Context Store
 *
 * All agents share the same memory, workspaces, learning records,
 * predictions and knowledge. This store provides a unified view.
 */

import type { NavigationSession } from "@/kernel/contracts/NavigationSession";
import { WorkspaceStore } from "@/features/workspace";
import { RealityStore } from "@/features/reality";
import { NavigationStore } from "@/features/navigation";
import { LearningStore } from "@/features/learning";
import { ExecutionStore } from "@/features/execution";
import { DecisionStore } from "@/features/decisions";
import { ValidationStore } from "@/features/validation";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AgentContext {
  // Workspaces
  activeWorkspaces: number;
  totalWorkspaces: number;

  // Navigation
  activeSessions: number;
  recentDestinations: NavigationSession[];

  // Reality
  hasReports: boolean;

  // Learning
  patternCount: number;
  insightCount: number;
  recommendationCount: number;

  // Execution
  activePlans: number;
  pendingTasks: number;

  // Decisions
  pendingDecisions: number;

  // Validation
  pendingValidations: number;

  // Cross-agent context
  lastActivity: {
    agent: string;
    action: string;
    timestamp: string;
  }[];
}

export interface AgentMemory {
  id: string;
  agent: string;
  type: "research" | "content" | "navigation" | "consultation" | "insight";
  title: string;
  summary: string;
  data: Record<string, unknown>;
  createdAt: string;
  sharedWith: string[];
}

// ─── Storage ───────────────────────────────────────────────────────────────

const MEMORY_KEY = "spyral_agent_memory";
const ACTIVITY_KEY = "spyral_activity";

function loadMemory(): AgentMemory[] {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveMemory(memories: AgentMemory[]): void {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
  } catch (e) {
    console.error("Failed to persist agent memory:", e);
  }
}

type ActivityEntry = { agent: string; action: string; timestamp: string };

function loadActivity(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveActivity(activity: ActivityEntry[]): void {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
  } catch (e) {
    console.error("Failed to persist activity:", e);
  }
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Store ─────────────────────────────────────────────────────────────────

type SharedListener = () => void;

class SharedContextStoreImpl {
  private listeners: Set<SharedListener> = new Set();

  // ── Subscriptions ──────────────────────────────────────────────────────

  subscribe(listener: SharedListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  // ── Context ────────────────────────────────────────────────────────────

  /**
   * Get unified context across all agents.
   */
  getContext(): AgentContext {
    const workspaces = WorkspaceStore.getAll();
    const activeWorkspaces = WorkspaceStore.getActive();
    const navSessions = NavigationStore.getAll();
    const activeSessions = NavigationStore.getActiveSessions();
    const recentDestinations = NavigationStore.getRecentDestinations();
    const activePlans = ExecutionStore.getActivePlans();
    const pendingDecisions = DecisionStore.getPending();

    return {
      activeWorkspaces: activeWorkspaces.length,
      totalWorkspaces: workspaces.length,
      activeSessions: activeSessions.length,
      recentDestinations,
      hasReports: activeWorkspaces.some((ws) => RealityStore.hasReport(ws.id)),
      patternCount: 0, // Would need LearningStore patterns
      insightCount: 0,
      recommendationCount: 0,
      activePlans: activePlans.length,
      pendingTasks: 0,
      pendingDecisions: pendingDecisions.length,
      pendingValidations: 0,
      lastActivity: [],
    };
  }

  // ── Agent Memory ───────────────────────────────────────────────────────

  /**
   * Save memory from an agent that can be shared with others.
   */
  saveMemory(memory: Omit<AgentMemory, "id" | "createdAt">): AgentMemory {
    const memories = loadMemory();
    const newMemory: AgentMemory = {
      ...memory,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    memories.push(newMemory);
    saveMemory(memories);
    this.notify();
    return newMemory;
  }

  /**
   * Get all memories, optionally filtered by agent or type.
   */
  getMemories(filter?: { agent?: string; type?: AgentMemory["type"] }): AgentMemory[] {
    const memories = loadMemory();
    if (!filter) return memories;
    return memories.filter((m) => {
      if (filter.agent && m.agent !== filter.agent) return false;
      if (filter.type && m.type !== filter.type) return false;
      return true;
    });
  }

  /**
   * Get memories shared with a specific agent.
   */
  getSharedMemories(agent: string): AgentMemory[] {
    const memories = loadMemory();
    return memories.filter((m) => m.sharedWith.includes(agent) || m.agent === agent);
  }

  /**
   * Delete a memory by ID.
   */
  deleteMemory(id: string): boolean {
    const memories = loadMemory();
    const index = memories.findIndex((m) => m.id === id);
    if (index === -1) return false;
    memories.splice(index, 1);
    saveMemory(memories);
    this.notify();
    return true;
  }

  // ── Activity Log ───────────────────────────────────────────────────────

  /**
   * Log an activity for cross-agent awareness.
   */
  logActivity(agent: string, action: string): void {
    const activity = loadActivity();
    activity.push({ agent, action, timestamp: new Date().toISOString() });
    // Keep last 50 activities
    if (activity.length > 50) activity.splice(0, activity.length - 50);
    saveActivity(activity);
    this.notify();
  }

  /**
   * Get recent activities.
   */
  getRecentActivity(count = 10): { agent: string; action: string; timestamp: string }[] {
    const activity = loadActivity();
    return activity.slice(-count).reverse();
  }

  /**
   * Clear all agent memory (for logout).
   */
  clearAll(): void {
    localStorage.removeItem(MEMORY_KEY);
    localStorage.removeItem(ACTIVITY_KEY);
    this.notify();
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────────

export const SharedContextStore = new SharedContextStoreImpl();
