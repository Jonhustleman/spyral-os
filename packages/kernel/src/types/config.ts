/**
 * @spyral/kernel — Configuration types (Phase D.1)
 */

export interface SecretsConfig {
  jwtSecret: string;
  sessionExpiryMs: number;
  bcryptRounds?: number;
}

export interface LoggingConfig {
  level: "debug" | "info" | "warn" | "error";
  format: "json" | "text";
  output: "console" | "file";
  filePath?: string;
}

export interface ServerConfig {
  port: number;
  host: string;
  corsOrigins: string[];
}

export interface DatabaseConfig {
  type: "file" | "sqlite" | "postgres";
  connectionString?: string;
  filePath?: string;
  /** For SQLite: path to the database file (e.g., "./data/spyral.db") */
  sqlitePath?: string;
}

export interface MigrationConfig {
  /** Directory containing migration files */
  directory: string;
  /** Table name for tracking applied migrations (default: "_migrations") */
  tableName?: string;
}

export interface SpyralConfig {
  secrets: SecretsConfig;
  logging: LoggingConfig;
  server: ServerConfig;
  database: DatabaseConfig;
  migrations?: MigrationConfig;
}

export const DEFAULT_CONFIG: SpyralConfig = {
  secrets: {
    jwtSecret: "spyral-dev-secret-do-not-use-in-production",
    sessionExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  logging: {
    level: "info",
    format: "text",
    output: "console",
  },
  server: {
    port: 3001,
    host: "0.0.0.0",
    corsOrigins: ["*"],
  },
  database: {
    type: "file",
    filePath: "./data",
  },
  migrations: {
    directory: "./data/migrations",
    tableName: "_migrations",
  },
};
