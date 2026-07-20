/**
 * SQLite Connection Manager
 *
 * Manages the SQLite database connection lifecycle.
 * Uses better-sqlite3 for synchronous operations.
 *
 * Phase D.3 — Infrastructure Adapters
 */

import Database from "better-sqlite3";
import type { Database as DatabaseType, Statement } from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export class SQLiteConnection {
  private db: DatabaseType | null = null;
  private readonly dbPath: string;
  private readonly options: Database.Options;

  constructor(dbPath: string, options?: Database.Options) {
    this.dbPath = dbPath;
    this.options = {
      // Enable WAL mode for better concurrent read performance
      ...options,
    };
  }

  /** Open the database connection, creating the directory if needed. */
  open(): void {
    if (this.db) return;

    // Ensure the directory exists
    const dir = dirname(this.dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(this.dbPath, this.options);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
  }

  /** Get the underlying better-sqlite3 Database instance. */
  getRaw(): DatabaseType {
    if (!this.db) {
      throw new Error("SQLiteConnection not opened. Call open() first.");
    }
    return this.db;
  }

  /**
   * Prepare a SQL statement.
   * Use this for parameterized queries where you pass params to all/run/get.
   */
  prepare<Result = unknown>(sql: string): Statement<unknown[], Result> {
    if (!this.db) {
      throw new Error("SQLiteConnection not opened. Call open() first.");
    }
    return this.db.prepare(sql) as unknown as Statement<unknown[], Result>;
  }

  /** Execute a statement that doesn't return rows (INSERT, UPDATE, DELETE, CREATE, etc.). */
  exec(sql: string): void {
    if (!this.db) {
      throw new Error("SQLiteConnection not opened. Call open() first.");
    }
    this.db.exec(sql);
  }

  /** Check if the connection is open. */
  isOpen(): boolean {
    return this.db !== null;
  }

  /** Close the database connection. */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /** Get the database path. */
  getPath(): string {
    return this.dbPath;
  }
}
