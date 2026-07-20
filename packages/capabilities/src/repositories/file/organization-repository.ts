/**
 * @spyral/capabilities — File-based Organization Repository
 *
 * Phase D.1 — Persistent organization storage using JSON files.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { Organization, OrganizationRepository } from "@spyral/kernel";

export class FileOrganizationRepository implements OrganizationRepository {
  private store: Map<string, Organization>;
  private filePath: string;

  constructor(dataDir?: string) {
    this.filePath = join(dataDir ?? process.cwd(), "data", "organizations.json");
    this.store = new Map();
    this.load();
  }

  async findById(id: string): Promise<Organization | undefined> {
    return this.store.get(id);
  }

  async findBySlug(slug: string): Promise<Organization | undefined> {
    return Array.from(this.store.values()).find((o) => o.slug === slug);
  }

  async findByOwnerId(ownerId: string): Promise<Organization[]> {
    return Array.from(this.store.values()).filter((o) => o.ownerId === ownerId);
  }

  async findAll(): Promise<Organization[]> {
    return Array.from(this.store.values());
  }

  async save(org: Organization): Promise<Organization> {
    this.store.set(org.id, org);
    this.saveToDisk();
    return org;
  }

  async delete(id: string): Promise<boolean> {
    const existed = this.store.has(id);
    this.store.delete(id);
    this.saveToDisk();
    return existed;
  }

  private load(): void {
    try {
      if (existsSync(this.filePath)) {
        const data = JSON.parse(readFileSync(this.filePath, "utf-8"));
        if (Array.isArray(data)) {
          for (const org of data) {
            this.store.set(org.id, org);
          }
        }
      }
    } catch (err) {
      console.error(`[FileOrganizationRepository] Failed to load: ${err}`);
    }
  }

  private saveToDisk(): void {
    try {
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(this.filePath, JSON.stringify(Array.from(this.store.values()), null, 2));
    } catch (err) {
      console.error(`[FileOrganizationRepository] Failed to save: ${err}`);
    }
  }
}
