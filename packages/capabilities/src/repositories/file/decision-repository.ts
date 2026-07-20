/**
 * File-based implementation of DecisionRepository.
 *
 * Persists decisions to a JSON file on disk.
 * Follows the ports/adapters pattern — same interface as MemoryDecisionRepository.
 *
 * Phase C.3 — Persistence
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { TenantContext, Decision, DecisionOption, DecisionRepository } from "@spyral/kernel";

export class FileDecisionRepository implements DecisionRepository {
  private store: Map<string, Decision>;
  private filePath: string;

  constructor(dataDir?: string) {
    this.filePath = join(dataDir ?? process.cwd(), "data", "decisions.json");
    this.store = new Map();
    this.load();
  }

  async findById(ctx: TenantContext, id: string): Promise<Decision | undefined> {
    return this.store.get(id);
  }

  async findAll(ctx: TenantContext): Promise<Decision[]> {
    return Array.from(this.store.values());
  }

  async findByWorkspaceId(ctx: TenantContext, workspaceId: string): Promise<Decision[]> {
    return Array.from(this.store.values()).filter(
      (d) => d.workspaceId === workspaceId,
    );
  }

  async findByStatus(ctx: TenantContext, status: Decision["status"]): Promise<Decision[]> {
    return Array.from(this.store.values()).filter((d) => d.status === status);
  }

  async save(ctx: TenantContext, decision: Decision): Promise<Decision> {
    const now = new Date().toISOString();
    const existing = this.store.get(decision.id);

    const updated: Decision = {
      ...decision,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.store.set(decision.id, updated);
    this.saveToDisk();
    return updated;
  }

  async delete(ctx: TenantContext, id: string): Promise<boolean> {
    const result = this.store.delete(id);
    if (result) this.saveToDisk();
    return result;
  }

  async addOption(ctx: TenantContext, decisionId: string, option: DecisionOption): Promise<Decision> {
    const decision = this.store.get(decisionId);
    if (!decision) throw new Error(`Decision not found: ${decisionId}`);

    const updated: Decision = {
      ...decision,
      options: [...decision.options, option],
      updatedAt: new Date().toISOString(),
    };

    this.store.set(decisionId, updated);
    this.saveToDisk();
    return updated;
  }

  async selectOption(ctx: TenantContext, decisionId: string, optionId: string): Promise<Decision> {
    const decision = this.store.get(decisionId);
    if (!decision) throw new Error(`Decision not found: ${decisionId}`);

    const option = decision.options.find((o) => o.id === optionId);
    if (!option) throw new Error(`Option not found: ${optionId}`);

    const updated: Decision = {
      ...decision,
      selectedOptionId: optionId,
      status: "executing",
      updatedAt: new Date().toISOString(),
    };

    this.store.set(decisionId, updated);
    this.saveToDisk();
    return updated;
  }

  /** For testing: clear all data */
  clear(): void {
    this.store.clear();
    this.saveToDisk();
  }

  // ─── File I/O ──────────────────────────────────────────────────────────────

  private load(): void {
    try {
      if (existsSync(this.filePath)) {
        const raw = readFileSync(this.filePath, "utf-8");
        const data = JSON.parse(raw) as Decision[];
        this.store = new Map(data.map((d) => [d.id, d]));
      } else {
        this.store = new Map();
      }
    } catch {
      this.store = new Map();
    }
  }

  private saveToDisk(): void {
    try {
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      const data = Array.from(this.store.values());
      writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("[FileDecisionRepository] Failed to persist:", err);
    }
  }
}
