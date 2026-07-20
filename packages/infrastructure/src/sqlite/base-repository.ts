/**
 * Base repository class for SQLite-backed repositories.
 *
 * Provides common CRUD helpers and manages the shared connection.
 *
 * Phase D.3 — Infrastructure Adapters
 */

import type { SQLiteConnection } from "./connection.js";

export abstract class BaseSqliteRepository {
  protected readonly connection: SQLiteConnection;

  constructor(connection: SQLiteConnection) {
    this.connection = connection;
  }

  /** Get the raw connection for direct operations. */
  protected get db() {
    return this.connection.getRaw();
  }
}
