/**
 * @spyral/capabilities — File-based Session Repository
 *
 * Phase D.1 — Persistent session storage using JSON files.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { Session, SessionRepository } from "@spyral/kernel";

export class FileSessionRepository implements SessionRepository {
  private store: Map<string, Session>;
  private filePath: string;

  constructor(dataDir?: string) {
    this.filePath = join(dataDir ?? process.cwd(), "data", "sessions.json");
    this.store = new Map();
    this.load();
  }

  async findById(id: string): Promise<Session | undefined> {
    return this.store.get(id);
  }

  async findByToken(token: string): Promise<Session | undefined> {
    return Array.from(this.store.values()).find((s) => s.token === token);
  }

  async findByUserId(userId: string): Promise<Session[]> {
    return Array.from(this.store.values()).filter((s) => s.userId === userId);
  }

  async save(session: Session): Promise<Session> {
    this.store.set(session.id, session);
    this.saveToDisk();
    return session;
  }

  async delete(id: string): Promise<boolean> {
    const existed = this.store.has(id);
    this.store.delete(id);
    this.saveToDisk();
    return existed;
  }

  async revoke(id: string): Promise<Session> {
    const session = this.store.get(id);
    if (!session) throw new Error(`Session not found: ${id}`);
    session.revoked = true;
    session.updatedAt = new Date().toISOString();
    this.store.set(id, session);
    this.saveToDisk();
    return session;
  }

  private load(): void {
    try {
      if (existsSync(this.filePath)) {
        const data = JSON.parse(readFileSync(this.filePath, "utf-8"));
        if (Array.isArray(data)) {
          for (const session of data) {
            this.store.set(session.id, session);
          }
        }
      }
    } catch (err) {
      console.error(`[FileSessionRepository] Failed to load: ${err}`);
    }
  }

  private saveToDisk(): void {
    try {
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(this.filePath, JSON.stringify(Array.from(this.store.values()), null, 2));
    } catch (err) {
      console.error(`[FileSessionRepository] Failed to save: ${err}`);
    }
  }
}
