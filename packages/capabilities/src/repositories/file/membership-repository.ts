/**
 * @spyral/capabilities — File-based Membership Repository
 *
 * Phase D.1 — Persistent membership storage using JSON files.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { Membership, MembershipRepository } from "@spyral/kernel";

export class FileMembershipRepository implements MembershipRepository {
  private store: Map<string, Membership>;
  private filePath: string;

  constructor(dataDir?: string) {
    this.filePath = join(dataDir ?? process.cwd(), "data", "memberships.json");
    this.store = new Map();
    this.load();
  }

  private key(userId: string, orgId: string): string {
    return `${userId}:${orgId}`;
  }

  async findByUserId(userId: string): Promise<Membership[]> {
    return Array.from(this.store.values()).filter((m) => m.userId === userId);
  }

  async findByOrgId(orgId: string): Promise<Membership[]> {
    return Array.from(this.store.values()).filter((m) => m.orgId === orgId);
  }

  async findOne(userId: string, orgId: string): Promise<Membership | undefined> {
    return this.store.get(this.key(userId, orgId));
  }

  async save(membership: Membership): Promise<Membership> {
    this.store.set(this.key(membership.userId, membership.orgId), membership);
    this.saveToDisk();
    return membership;
  }

  async delete(userId: string, orgId: string): Promise<boolean> {
    const existed = this.store.has(this.key(userId, orgId));
    this.store.delete(this.key(userId, orgId));
    this.saveToDisk();
    return existed;
  }

  private load(): void {
    try {
      if (existsSync(this.filePath)) {
        const data = JSON.parse(readFileSync(this.filePath, "utf-8"));
        if (Array.isArray(data)) {
          for (const membership of data) {
            this.store.set(this.key(membership.userId, membership.orgId), membership);
          }
        }
      }
    } catch (err) {
      console.error(`[FileMembershipRepository] Failed to load: ${err}`);
    }
  }

  private saveToDisk(): void {
    try {
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(this.filePath, JSON.stringify(Array.from(this.store.values()), null, 2));
    } catch (err) {
      console.error(`[FileMembershipRepository] Failed to save: ${err}`);
    }
  }
}
