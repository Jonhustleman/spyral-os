/**
 * Backup & Restore — Database backup and restore operations.
 *
 * Supports:
 *   - SQLite: uses better-sqlite3 .backup API for consistent online backups
 *   - File-based: JSON file copy with atomic rename
 *
 * Phase D.4.5 — Backup/Restore
 */

import { existsSync, mkdirSync, copyFileSync, unlinkSync, writeFileSync, readFileSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import type { InfrastructureProvider } from "@spyral/kernel";
import type { DatabaseConfig } from "@spyral/kernel";

export interface BackupResult {
  success: boolean;
  path: string;
  sizeBytes: number;
  timestamp: string;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface BackupMetadata {
  version: string;
  timestamp: string;
  type: "sqlite" | "file";
  files: string[];
  checksum?: string;
}

/**
 * Create a backup of the current database state.
 */
export async function createBackup(
  config: DatabaseConfig,
  provider: InfrastructureProvider | null,
  backupDir?: string,
): Promise<BackupResult> {
  const dir = backupDir ?? "./backups";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const version = "0.1.0";

  // Ensure backup directory exists
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  try {
    if (config.type === "sqlite" && config.sqlitePath) {
      return await backupSqlite(config.sqlitePath, dir, timestamp, version);
    } else if (config.type === "file" && config.filePath) {
      return backupFileStorage(config.filePath, dir, timestamp, version);
    } else {
      return {
        success: false,
        path: "",
        sizeBytes: 0,
        timestamp: new Date().toISOString(),
        error: `Unsupported database type for backup: ${config.type}`,
      };
    }
  } catch (err) {
    return {
      success: false,
      path: "",
      sizeBytes: 0,
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Restore the database from a backup file.
 */
export async function restoreFromBackup(
  config: DatabaseConfig,
  backupPath: string,
  provider: InfrastructureProvider | null,
): Promise<RestoreResult> {
  try {
    if (!existsSync(backupPath)) {
      return { success: false, message: "", error: `Backup file not found: ${backupPath}` };
    }

    if (config.type === "sqlite" && config.sqlitePath) {
      return restoreSqlite(backupPath, config.sqlitePath);
    } else if (config.type === "file" && config.filePath) {
      return restoreFileStorage(backupPath, config.filePath);
    } else {
      return {
        success: false,
        message: "",
        error: `Unsupported database type for restore: ${config.type}`,
      };
    }
  } catch (err) {
    return {
      success: false,
      message: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── SQLite Backup ──────────────────────────────────────────────────────────

async function backupSqlite(
  dbPath: string,
  backupDir: string,
  timestamp: string,
  version: string,
): Promise<BackupResult> {
  // Use better-sqlite3 backup API for consistent backups
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3") as typeof import("better-sqlite3").default;
  const src = new Database(dbPath, { readonly: true });

  const backupFilename = `spyral-backup-${timestamp}.db`;
  const backupPath = join(backupDir, backupFilename);

  try {
    src.backup(backupPath);
    const stats = existsSync(backupPath) ? (await import("node:fs")).statSync(backupPath) : null;
    const sizeBytes = stats?.size ?? 0;

    // Write metadata
    const metadata: BackupMetadata = {
      version,
      timestamp: new Date().toISOString(),
      type: "sqlite",
      files: [backupFilename, `${backupFilename}.meta.json`],
    };
    writeFileSync(join(backupDir, `${backupFilename}.meta.json`), JSON.stringify(metadata, null, 2));

    return { success: true, path: backupPath, sizeBytes, timestamp: new Date().toISOString() };
  } finally {
    src.close();
  }
}

async function restoreSqlite(backupPath: string, targetPath: string): Promise<RestoreResult> {
  // Create target directory if it doesn't exist
  const targetDir = dirname(targetPath);
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  // Copy backup to target location
  const tempPath = targetPath + ".restore-tmp";
  copyFileSync(backupPath, tempPath);
  renameSync(tempPath, targetPath);

  return {
    success: true,
    message: `Database restored from ${backupPath} to ${targetPath}`,
  };
}

// ─── File-Based Backup ──────────────────────────────────────────────────────

async function backupFileStorage(
  dataDir: string,
  backupDir: string,
  timestamp: string,
  version: string,
): Promise<BackupResult> {
  if (!existsSync(dataDir)) {
    return {
      success: false,
      path: "",
      sizeBytes: 0,
      timestamp: new Date().toISOString(),
      error: `Data directory not found: ${dataDir}`,
    };
  }

  const backupFilename = `spyral-backup-${timestamp}`;
  const backupPath = join(backupDir, backupFilename);

  // Create a subdirectory for the backup
  mkdirSync(backupPath, { recursive: true });

  // Copy JSON files
  const { readdirSync } = await import("node:fs");
  const files = readdirSync(dataDir).filter((f: string) => f.endsWith(".json"));
  let totalBytes = 0;

  for (const file of files) {
    const srcPath = join(dataDir, file);
    const destPath = join(backupPath, file);
    copyFileSync(srcPath, destPath);
    const stats = (await import("node:fs")).statSync(destPath);
    totalBytes += stats.size;
  }

  // Write metadata
  const metadata: BackupMetadata = {
    version,
    timestamp: new Date().toISOString(),
    type: "file",
    files: [backupFilename, ...files],
  };
  writeFileSync(join(backupPath, "backup.meta.json"), JSON.stringify(metadata, null, 2));

  return {
    success: true,
    path: backupPath,
    sizeBytes: totalBytes,
    timestamp: new Date().toISOString(),
  };
}

async function restoreFileStorage(backupPath: string, targetDir: string): Promise<RestoreResult> {
  if (!existsSync(backupPath)) {
    return { success: false, message: "", error: `Backup not found: ${backupPath}` };
  }

  // Ensure target directory exists
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  // Read metadata to know which files to restore
  const metaPath = join(backupPath, "backup.meta.json");
  if (!existsSync(metaPath)) {
    return {
      success: false,
      message: "",
      error: `Backup metadata not found at ${metaPath}`,
    };
  }

  const metadata: BackupMetadata = JSON.parse(readFileSync(metaPath, "utf-8"));

  // Restore each file
  const { readdirSync } = await import("node:fs");
  const files = readdirSync(backupPath).filter((f: string) => f !== "backup.meta.json");

  for (const file of files) {
    const srcPath = join(backupPath, file);
    const destPath = join(targetDir, file);
    const tempPath = destPath + ".restore-tmp";
    copyFileSync(srcPath, tempPath);
    renameSync(tempPath, destPath);
  }

  return {
    success: true,
    message: `Restored ${files.length} file(s) from ${backupPath} to ${targetDir}`,
  };
}
