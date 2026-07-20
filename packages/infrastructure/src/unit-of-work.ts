/**
 * SQLite-backed Unit of Work implementation.
 *
 * Wraps SQLite transactions to provide atomic commit/rollback
 * across multiple repository operations.
 *
 * Phase D.3 — Infrastructure Adapters
 */

import type { UnitOfWork } from "@spyral/kernel";
import type { SQLiteConnection } from "./sqlite/connection.js";

export class SqliteUnitOfWork implements UnitOfWork {
  private readonly connection: SQLiteConnection;
  private active: boolean = false;

  constructor(connection: SQLiteConnection) {
    this.connection = connection;
  }

  async begin(): Promise<void> {
    if (this.active) {
      throw new Error("Transaction already active");
    }
    this.connection.exec("BEGIN TRANSACTION");
    this.active = true;
  }

  async commit(): Promise<void> {
    if (!this.active) {
      throw new Error("No active transaction to commit");
    }
    this.connection.exec("COMMIT");
    this.active = false;
  }

  async rollback(): Promise<void> {
    if (!this.active) {
      throw new Error("No active transaction to roll back");
    }
    this.connection.exec("ROLLBACK");
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  async executeInTransaction<T>(work: () => Promise<T>): Promise<T> {
    const wasAlreadyActive = this.active;
    if (!wasAlreadyActive) {
      await this.begin();
    }

    try {
      const result = await work();
      if (!wasAlreadyActive) {
        await this.commit();
      }
      return result;
    } catch (error) {
      if (!wasAlreadyActive && this.active) {
        await this.rollback();
      }
      throw error;
    }
  }
}
