/**
 * Migration Manager for SQLite databases.
 *
 * Discovers and runs pending migrations against the database.
 * Each migration is tracked in the _migrations table.
 *
 * Phase D.3 — Infrastructure Adapters
 */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { SQLiteConnection } from "../sqlite/connection.js";

export interface Migration {
  /** Unique migration ID (e.g., "001", "002") */
  id: string;
  /** Human-readable description */
  description: string;
  /** Migration SQL to apply */
  up: string;
  /** Rollback SQL (optional) */
  down?: string;
}

export class MigrationManager {
  private readonly connection: SQLiteConnection;
  private readonly migrationsDir: string;
  private readonly tableName: string;

  constructor(
    connection: SQLiteConnection,
    options?: { migrationsDir?: string; tableName?: string },
  ) {
    this.connection = connection;
    this.migrationsDir = options?.migrationsDir ?? join(process.cwd(), "data", "migrations");
    this.tableName = options?.tableName ?? "_migrations";
  }

  /** Ensure the migrations tracking table exists. */
  private ensureTrackingTable(): void {
    this.connection.exec(`
      CREATE TABLE IF NOT EXISTS "${this.tableName}" (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at TEXT NOT NULL,
        checksum TEXT NOT NULL
      )
    `);
  }

  /** Compute a checksum for a migration SQL string. */
  private computeChecksum(sql: string): string {
    return createHash("sha256").update(sql).digest("hex").substring(0, 16);
  }

  /** Get all migrations that have already been applied. */
  private getAppliedMigrations(): Map<string, { checksum: string }> {
    this.ensureTrackingTable();
    const rows = this.connection.prepare(
      `SELECT id, checksum FROM "${this.tableName}" ORDER BY id ASC`,
    ).all() as { id: string; checksum: string }[];

    const applied = new Map<string, { checksum: string }>();
    for (const row of rows) {
      applied.set(row.id, { checksum: row.checksum });
    }
    return applied;
  }

  /** Register a single migration directly (not from file). */
  registerMigration(migration: Migration): void {
    const applied = this.getAppliedMigrations();
    const checksum = this.computeChecksum(migration.up);

    if (applied.has(migration.id)) {
      const existing = applied.get(migration.id)!;
      if (existing.checksum !== checksum) {
        throw new Error(
          `Migration "${migration.id}" has a different checksum than the applied version. ` +
          `Expected: ${existing.checksum}, got: ${checksum}`,
        );
      }
      return; // Already applied with matching checksum
    }

    // Apply the migration
    this.connection.exec(migration.up);

    // Record it
    this.connection.prepare(
      `INSERT INTO "${this.tableName}" (id, description, applied_at, checksum) VALUES (?, ?, ?, ?)`,
    ).run(migration.id, migration.description, new Date().toISOString(), checksum);
  }

  /** Run all pending migrations. */
  async runPending(): Promise<void> {
    this.ensureTrackingTable();

    // Discover migration files from the migrations directory
    if (!existsSync(this.migrationsDir)) {
      return; // No migrations directory yet
    }

    const files = readdirSync(this.migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      return;
    }

    const applied = this.getAppliedMigrations();

    for (const file of files) {
      const id = file.replace(/\.sql$/, "");
      if (applied.has(id)) continue;

      const fullPath = join(this.migrationsDir, file);
      const sql = readFileSync(fullPath, "utf-8");
      const checksum = this.computeChecksum(sql);

      this.connection.exec(sql);

      this.connection.prepare(
        `INSERT INTO "${this.tableName}" (id, description, applied_at, checksum) VALUES (?, ?, ?, ?)`,
      ).run(id, `Migration ${id}`, new Date().toISOString(), checksum);

      console.log(`[Migrations] Applied: ${id}`);
    }
  }

  /** Register migrations from programmatic Migration objects. */
  registerMigrations(migrations: Migration[]): void {
    for (const migration of migrations) {
      this.registerMigration(migration);
    }
  }

  /** Get the list of all migrations with their status. */
  getStatus(): { id: string; applied: boolean; appliedAt?: string; checksum?: string }[] {
    this.ensureTrackingTable();
    const applied = this.getAppliedMigrations();

    // Read migration files
    const migrationIds: string[] = [];
    if (existsSync(this.migrationsDir)) {
      const files = readdirSync(this.migrationsDir)
        .filter((f) => f.endsWith(".sql"))
        .sort();
      for (const file of files) {
        migrationIds.push(file.replace(/\.sql$/, ""));
      }
    }

    return migrationIds.map((id) => {
      const record = applied.get(id);
      return {
        id,
        applied: !!record,
        appliedAt: record ? undefined : undefined,
        checksum: record?.checksum,
      };
    });
  }
}
