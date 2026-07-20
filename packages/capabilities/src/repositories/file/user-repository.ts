/**
 * @spyral/capabilities — File-based User Repository
 *
 * Phase D.1 — Persistent user storage using JSON files.
 * Follows the same pattern as other File*Repository classes.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { User, UserRepository } from "@spyral/kernel";

export class FileUserRepository implements UserRepository {
  private store: Map<string, User>;
  private filePath: string;

  constructor(dataDir?: string) {
    this.filePath = join(dataDir ?? process.cwd(), "data", "users.json");
    this.store = new Map();
    this.load();
  }

  async findById(id: string): Promise<User | undefined> {
    return this.store.get(id);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.store.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async findByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.store.values()).find(
      (u) => u.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.store.values());
  }

  async save(user: User): Promise<User> {
    this.store.set(user.id, user);
    this.saveToDisk();
    return user;
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
          for (const user of data) {
            this.store.set(user.id, user);
          }
        }
      }
    } catch (err) {
      console.error(`[FileUserRepository] Failed to load: ${err}`);
    }
  }

  private saveToDisk(): void {
    try {
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(this.filePath, JSON.stringify(Array.from(this.store.values()), null, 2));
    } catch (err) {
      console.error(`[FileUserRepository] Failed to save: ${err}`);
    }
  }
}
