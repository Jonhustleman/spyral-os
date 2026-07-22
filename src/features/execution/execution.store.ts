/**
 * ExecutionStore — localStorage-persisted CRUD for execution data.
 *
 * Manages ExecutionPlans, Milestones, Tasks, and ExecutionReports.
 * Per ADR-0024, Execution is independent from Decision.
 * Per ADR-0027, every object has a trace back to its source.
 */

"use client";

import type { ExecutionPlan } from "@/kernel/contracts/ExecutionPlan";
import type { Milestone } from "@/kernel/contracts/Milestone";
import type { Task } from "@/kernel/contracts/Task";
import type { ExecutionReport } from "@/kernel/contracts/ExecutionReport";
import type { TraceReference, TraceSourceType } from "@/kernel/contracts/TraceReference";
import { ExecutionStatus } from "@/kernel/contracts/ExecutionStatus";

const STORAGE_KEY_PLANS = "spyral_execution_plans";
const STORAGE_KEY_MILESTONES = "spyral_execution_milestones";
const STORAGE_KEY_TASKS = "spyral_execution_tasks";
const STORAGE_KEY_REPORTS = "spyral_execution_reports";

// ─── Helpers ────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function now(): Date {
  return new Date();
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

// ─── Subscriber pattern ─────────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

// ─── Store ──────────────────────────────────────────────────────────────

export const ExecutionStore = {
  // ── Subscribe ────────────────────────────────────────────────────────

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // ── Execution Plans ──────────────────────────────────────────────────

  getPlans(): ExecutionPlan[] {
    return load<ExecutionPlan[]>(STORAGE_KEY_PLANS, []);
  },

  /** Get plans that are in an active (non-terminal) state. */
  getActivePlans(): ExecutionPlan[] {
    const terminal = new Set([
      ExecutionStatus.COMPLETED,
      ExecutionStatus.CANCELLED,
      ExecutionStatus.FAILED,
    ]);
    return this.getPlans().filter((p) => !terminal.has(p.status));
  },

  getPlanById(id: string): ExecutionPlan | undefined {
    return this.getPlans().find((p) => p.id === id);
  },

  createPlan(plan: Omit<ExecutionPlan, "id" | "createdAt" | "updatedAt">): ExecutionPlan {
    const all = this.getPlans();
    const newPlan: ExecutionPlan = {
      ...plan,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    all.push(newPlan);
    save(STORAGE_KEY_PLANS, all);
    notify();
    return newPlan;
  },

  updatePlan(id: string, updates: Partial<Pick<ExecutionPlan, "title" | "description" | "milestoneIds" | "status">>): ExecutionPlan | undefined {
    const all = this.getPlans();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...updates, updatedAt: now() };
    save(STORAGE_KEY_PLANS, all);
    notify();
    return all[idx];
  },

  deletePlan(id: string): void {
    const all = this.getPlans().filter((p) => p.id !== id);
    save(STORAGE_KEY_PLANS, all);
    // Cascade delete milestones and tasks
    const milestones = this.getMilestones().filter((m) => m.executionPlanId !== id);
    save(STORAGE_KEY_MILESTONES, milestones);
    const taskMilestoneIds = milestones.map((m) => m.id);
    const tasks = this.getTasks().filter((t) => !taskMilestoneIds.includes(t.workItemId));
    save(STORAGE_KEY_TASKS, tasks);
    notify();
  },

  // ── Milestones ───────────────────────────────────────────────────────

  getMilestones(): Milestone[] {
    return load<Milestone[]>(STORAGE_KEY_MILESTONES, []);
  },

  getMilestonesByPlan(executionPlanId: string): Milestone[] {
    return this.getMilestones().filter((m) => m.executionPlanId === executionPlanId);
  },

  getMilestoneById(id: string): Milestone | undefined {
    return this.getMilestones().find((m) => m.id === id);
  },

  createMilestone(milestone: Omit<Milestone, "id" | "createdAt" | "updatedAt">): Milestone {
    const all = this.getMilestones();
    const newMilestone: Milestone = {
      ...milestone,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    all.push(newMilestone);
    save(STORAGE_KEY_MILESTONES, all);
    // Link to plan
    const plan = this.getPlanById(milestone.executionPlanId);
    if (plan) {
      this.updatePlan(plan.id, { milestoneIds: [...plan.milestoneIds, newMilestone.id] });
    }
    notify();
    return newMilestone;
  },

  updateMilestone(id: string, updates: Partial<Omit<Milestone, "id" | "createdAt" | "executionPlanId" | "trace">>): Milestone | undefined {
    const all = this.getMilestones();
    const idx = all.findIndex((m) => m.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...updates, updatedAt: now() };
    save(STORAGE_KEY_MILESTONES, all);
    notify();
    return all[idx];
  },

  deleteMilestone(id: string): void {
    const milestone = this.getMilestoneById(id);
    if (milestone) {
      // Remove from plan
      const plan = this.getPlanById(milestone.executionPlanId);
      if (plan) {
        this.updatePlan(plan.id, {
          milestoneIds: plan.milestoneIds.filter((mid) => mid !== id),
        });
      }
    }
    const all = this.getMilestones().filter((m) => m.id !== id);
    save(STORAGE_KEY_MILESTONES, all);
    // Cascade delete tasks
    const tasks = this.getTasks().filter((t) => t.workItemId !== id);
    save(STORAGE_KEY_TASKS, tasks);
    notify();
  },

  // ── Tasks ────────────────────────────────────────────────────────────

  getTasks(): Task[] {
    return load<Task[]>(STORAGE_KEY_TASKS, []);
  },

  getTasksByMilestone(milestoneId: string): Task[] {
    return this.getTasks().filter((t) => t.workItemId === milestoneId);
  },

  getTaskById(id: string): Task | undefined {
    return this.getTasks().find((t) => t.id === id);
  },

  createTask(task: Omit<Task, "id" | "createdAt" | "updatedAt">): Task {
    const all = this.getTasks();
    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    all.push(newTask);
    save(STORAGE_KEY_TASKS, all);
    // Link to milestone
    const milestone = this.getMilestoneById(task.workItemId);
    if (milestone) {
      this.updateMilestone(milestone.id, {
        workItemIds: [...milestone.workItemIds, newTask.id],
      });
    }
    notify();
    return newTask;
  },

  updateTask(id: string, updates: Partial<Omit<Task, "id" | "createdAt" | "workItemId" | "trace">>): Task | undefined {
    const all = this.getTasks();
    const idx = all.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...updates, updatedAt: now() };
    save(STORAGE_KEY_TASKS, all);
    notify();
    return all[idx];
  },

  deleteTask(id: string): void {
    const task = this.getTaskById(id);
    if (task) {
      // Remove from milestone
      const milestone = this.getMilestoneById(task.workItemId);
      if (milestone) {
        this.updateMilestone(milestone.id, {
          workItemIds: milestone.workItemIds.filter((wid) => wid !== id),
        });
      }
    }
    const all = this.getTasks().filter((t) => t.id !== id);
    save(STORAGE_KEY_TASKS, all);
    notify();
  },

  // ── Reports ──────────────────────────────────────────────────────────

  getReports(): ExecutionReport[] {
    return load<ExecutionReport[]>(STORAGE_KEY_REPORTS, []);
  },

  getReportsByPlan(executionPlanId: string): ExecutionReport[] {
    return this.getReports().filter((r) => r.executionPlanId === executionPlanId);
  },

  generateReport(executionPlanId: string): ExecutionReport {
    const plan = this.getPlanById(executionPlanId);
    if (!plan) throw new Error(`Plan ${executionPlanId} not found`);

    const milestones = this.getMilestonesByPlan(executionPlanId);
    const allTasks = milestones.flatMap((m) => this.getTasksByMilestone(m.id));
    const completedTasks = allTasks.filter((t) => t.status === ExecutionStatus.COMPLETED);
    const blockedTasks = allTasks.filter((t) => t.status === ExecutionStatus.BLOCKED);
    const totalTasks = allTasks.length;
    const completionPercent = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
    const blockers = blockedTasks.map((t) => `${t.title} (${t.id})`);
    const velocity = completedTasks.length; // simple velocity for now

    // Risk assessment
    const riskLevel = blockedTasks.length > 0 ? "high" : completionPercent < 25 ? "medium" : "low" as "low" | "medium" | "high";

    const reports = this.getReports();
    const report: ExecutionReport = {
      id: generateId(),
      executionPlanId,
      completedTasks: completedTasks.length,
      totalTasks,
      velocity,
      blockers,
      completionPercent,
      risk: riskLevel,
      forecast: velocity > 0
        ? `~${Math.ceil((totalTasks - completedTasks.length) / velocity)} cycles remaining`
        : "Not enough data",
      generatedAt: new Date().toISOString(),
      createdAt: now(),
      updatedAt: now(),
    };
    reports.push(report);
    save(STORAGE_KEY_REPORTS, reports);
    notify();
    return report;
  },

  // ── Dashboard helpers ────────────────────────────────────────────────

  getDashboardData(executionPlanId: string) {
    const plan = this.getPlanById(executionPlanId);
    if (!plan) return null;

    const milestones = this.getMilestonesByPlan(executionPlanId);
    const allTasks = milestones.flatMap((m) => this.getTasksByMilestone(m.id));

    const statusCounts = {
      planned: allTasks.filter((t) => t.status === ExecutionStatus.PLANNED).length,
      approved: allTasks.filter((t) => t.status === ExecutionStatus.APPROVED).length,
      ready: allTasks.filter((t) => t.status === ExecutionStatus.READY).length,
      inProgress: allTasks.filter((t) => t.status === ExecutionStatus.IN_PROGRESS).length,
      blocked: allTasks.filter((t) => t.status === ExecutionStatus.BLOCKED).length,
      completed: allTasks.filter((t) => t.status === ExecutionStatus.COMPLETED).length,
      cancelled: allTasks.filter((t) => t.status === ExecutionStatus.CANCELLED).length,
      failed: allTasks.filter((t) => t.status === ExecutionStatus.FAILED).length,
    };

    const totalEffort = allTasks.reduce((sum, t) => sum + t.estimate, 0);
    const completedEffort = allTasks
      .filter((t) => t.status === ExecutionStatus.COMPLETED)
      .reduce((sum, t) => sum + (t.actual || t.estimate), 0);

    return {
      plan,
      milestones,
      tasks: allTasks,
      statusCounts,
      totalEffort,
      completedEffort,
      completionPercent: allTasks.length > 0
        ? Math.round((statusCounts.completed / allTasks.length) * 100)
        : 0,
    };
  },
};

// Export types for components
export type { ExecutionPlan, Milestone, Task, ExecutionReport, TraceReference };
