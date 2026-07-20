/**
 * SPYRAL OS — Workspace Store
 *
 * CRUD operations for workspaces with localStorage persistence.
 * Future: swap localStorage for a database without changing the API.
 */

import { Workspace, WorkspaceStatus } from "@/kernel/contracts/Workspace";
import type { WorkspaceDNA } from "@/kernel/contracts/Workspace";
import { WorkspaceRegistry } from "./WorkspaceRegistry";

const STORAGE_KEY = "spyral_workspaces";

// ─── Persistence ───────────────────────────────────────────────────────────

function loadAll(): Workspace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WorkspaceRaw[];
    return parsed.map(deserialize);
  } catch {
    return [];
  }
}

function saveAll(workspaces: Workspace[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces.map(serialize)));
  } catch (e) {
    console.error("Failed to persist workspaces:", e);
  }
}

// ─── Serialization helpers ────────────────────────────────────────────────

interface WorkspaceRaw {
  id: string;
  name: string;
  type: string;
  description: string;
  goal: string;
  dna: WorkspaceDNA;
  status: WorkspaceStatus;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

function serialize(w: Workspace): WorkspaceRaw {
  return {
    ...w,
    createdAt: w.createdAt instanceof Date ? w.createdAt.toISOString() : w.createdAt,
    updatedAt: w.updatedAt instanceof Date ? w.updatedAt.toISOString() : w.updatedAt,
  };
}

function deserialize(r: WorkspaceRaw): Workspace {
  return {
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

// ─── ID generation ─────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Store ─────────────────────────────────────────────────────────────────

class WorkspaceStoreImpl {
  private workspaces: Workspace[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.workspaces = loadAll();
  }

  // ── Subscriptions ──────────────────────────────────────────────────────

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  // ── Queries ────────────────────────────────────────────────────────────

  /** Get all workspaces. */
  getAll(): Workspace[] {
    return [...this.workspaces];
  }

  /** Get a workspace by ID. */
  getById(id: string): Workspace | undefined {
    return this.workspaces.find((w) => w.id === id);
  }

  /** Get active workspaces (ACTIVE + PAUSED). */
  getActive(): Workspace[] {
    return this.workspaces.filter(
      (w) => w.status === WorkspaceStatus.ACTIVE || w.status === WorkspaceStatus.PAUSED
    );
  }

  /** Get pinned workspaces. */
  getPinned(): Workspace[] {
    return this.workspaces.filter((w) => w.pinned);
  }

  /** Get archived workspaces. */
  getArchived(): Workspace[] {
    return this.workspaces.filter((w) => w.status === WorkspaceStatus.ARCHIVED);
  }

  /** Get the most recently updated workspaces. */
  getRecent(count = 5): Workspace[] {
    return [...this.workspaces]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, count);
  }

  // ── Commands ───────────────────────────────────────────────────────────

  /**
   * Create a new workspace.
   * Returns the created workspace.
   */
  create(params: {
    name: string;
    type: string;
    description: string;
    goal: string;
    dna: WorkspaceDNA;
  }): Workspace {
    const now = new Date();
    const workspace: Workspace = {
      id: generateId(),
      name: params.name,
      type: params.type,
      description: params.description,
      goal: params.goal,
      dna: params.dna,
      status: WorkspaceStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };

    this.workspaces.push(workspace);
    this.persist();
    return workspace;
  }

  /**
   * Update an existing workspace. Only provided fields are changed.
   * Returns the updated workspace, or undefined if not found.
   */
  update(
    id: string,
    changes: Partial<Pick<Workspace, "name" | "description" | "goal" | "dna" | "status" | "pinned">>
  ): Workspace | undefined {
    const index = this.workspaces.findIndex((w) => w.id === id);
    if (index === -1) return undefined;

    this.workspaces[index] = {
      ...this.workspaces[index],
      ...changes,
      updatedAt: new Date(),
    };

    this.persist();
    return this.workspaces[index];
  }

  /**
   * Delete a workspace by ID.
   * Returns true if deleted, false if not found.
   */
  delete(id: string): boolean {
    const index = this.workspaces.findIndex((w) => w.id === id);
    if (index === -1) return false;

    this.workspaces.splice(index, 1);
    this.persist();
    return true;
  }

  /**
   * Archive a workspace (soft delete).
   */
  archive(id: string): boolean {
    const ws = this.getById(id);
    if (!ws) return false;
    this.update(id, { status: WorkspaceStatus.ARCHIVED });
    return true;
  }

  /**
   * Toggle the pinned state of a workspace.
   */
  togglePin(id: string): boolean {
    const ws = this.getById(id);
    if (!ws) return false;
    this.update(id, { pinned: !ws.pinned });
    return true;
  }

  // ── Persistence ────────────────────────────────────────────────────────

  private persist(): void {
    saveAll(this.workspaces);
    this.notify();
  }
}

/** Singleton store instance. */
export const WorkspaceStore = new WorkspaceStoreImpl();
