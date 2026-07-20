/**
 * File-based implementations of LearningRecordRepository and PatternRepository.
 *
 * Persists learning records and patterns to JSON files on disk.
 *
 * Phase C.3 — Persistence
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type {
  TenantContext,
  LearningRecord,
  LearningRecordRepository,
  Pattern,
  PatternRepository,
} from "@spyral/kernel";

export class FileLearningRecordRepository implements LearningRecordRepository {
  private store: Map<string, LearningRecord>;
  private filePath: string;

  constructor(dataDir?: string) {
    this.filePath = join(dataDir ?? process.cwd(), "data", "learning.json");
    this.store = new Map();
    this.load();
  }

  async findById(ctx: TenantContext, id: string): Promise<LearningRecord | undefined> {
    return this.store.get(id);
  }

  async findAll(ctx: TenantContext): Promise<LearningRecord[]> {
    return Array.from(this.store.values());
  }

  async findByDecisionId(ctx: TenantContext, decisionId: string): Promise<LearningRecord[]> {
    return Array.from(this.store.values()).filter(
      (r) => r.decisionId === decisionId,
    );
  }

  async findByPatternId(ctx: TenantContext, patternId: string): Promise<LearningRecord[]> {
    return Array.from(this.store.values()).filter(
      (r) => r.patternIds.includes(patternId),
    );
  }

  async findByType(ctx: TenantContext, type: LearningRecord["type"]): Promise<LearningRecord[]> {
    return Array.from(this.store.values()).filter((r) => r.type === type);
  }

  async save(ctx: TenantContext, record: LearningRecord): Promise<LearningRecord> {
    const now = new Date().toISOString();
    const existing = this.store.get(record.id);

    const updated: LearningRecord = {
      ...record,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.store.set(record.id, updated);
    this.saveToDisk();
    return updated;
  }

  async delete(ctx: TenantContext, id: string): Promise<boolean> {
    const result = this.store.delete(id);
    if (result) this.saveToDisk();
    return result;
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
        const data = JSON.parse(raw) as LearningRecord[];
        this.store = new Map(data.map((r) => [r.id, r]));
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
      console.error("[FileLearningRecordRepository] Failed to persist:", err);
    }
  }
}

export class FilePatternRepository implements PatternRepository {
  private store: Map<string, Pattern>;
  private filePath: string;

  constructor(dataDir?: string) {
    this.filePath = join(dataDir ?? process.cwd(), "data", "patterns.json");
    this.store = new Map();
    this.load();
  }

  async findById(ctx: TenantContext, id: string): Promise<Pattern | undefined> {
    return this.store.get(id);
  }

  async findAll(ctx: TenantContext): Promise<Pattern[]> {
    return Array.from(this.store.values());
  }

  async findByFrequency(ctx: TenantContext, minFrequency: number): Promise<Pattern[]> {
    return Array.from(this.store.values()).filter(
      (p) => p.frequency >= minFrequency,
    );
  }

  async findByName(ctx: TenantContext, name: string): Promise<Pattern | undefined> {
    return Array.from(this.store.values()).find((p) => p.name === name);
  }

  async save(ctx: TenantContext, pattern: Pattern): Promise<Pattern> {
    const now = new Date().toISOString();
    const existing = this.store.get(pattern.id);

    const updated: Pattern = {
      ...pattern,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.store.set(pattern.id, updated);
    this.saveToDisk();
    return updated;
  }

  async delete(ctx: TenantContext, id: string): Promise<boolean> {
    const result = this.store.delete(id);
    if (result) this.saveToDisk();
    return result;
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
        const data = JSON.parse(raw) as Pattern[];
        this.store = new Map(data.map((p) => [p.id, p]));
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
      console.error("[FilePatternRepository] Failed to persist:", err);
    }
  }
}
