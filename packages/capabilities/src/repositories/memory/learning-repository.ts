/**
 * In-memory implementation of LearningRecordRepository and PatternRepository.
 *
 * Phase 2 — Milestone B.3 (Persistence)
 */

import type {
  TenantContext,
  LearningRecord,
  LearningRecordRepository,
  Pattern,
  PatternRepository,
} from "@spyral/kernel";

export class MemoryLearningRecordRepository implements LearningRecordRepository {
  private store = new Map<string, LearningRecord>();

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
    return updated;
  }

  async delete(ctx: TenantContext, id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  /** For testing: clear all data */
  clear(): void {
    this.store.clear();
  }
}

export class MemoryPatternRepository implements PatternRepository {
  private store = new Map<string, Pattern>();

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
    return Array.from(this.store.values()).find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
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
    return updated;
  }

  async delete(ctx: TenantContext, id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  /** For testing: clear all data */
  clear(): void {
    this.store.clear();
  }
}
