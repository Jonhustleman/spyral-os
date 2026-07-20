/**
 * Configuration Validation — Runtime schema validation for SpyralConfig.
 *
 * Validates the full configuration object at startup or on request.
 * Returns structured validation results with actionable error messages.
 *
 * Phase D.4.4 — Configuration Validation
 */

import type {
  SpyralConfig,
  SecretsConfig,
  LoggingConfig,
  ServerConfig,
  DatabaseConfig,
  MigrationConfig,
} from "@spyral/kernel";

export interface ConfigValidationResult {
  valid: boolean;
  section: string;
  errors: ConfigError[];
  warnings: ConfigWarning[];
}

export interface ConfigError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ConfigWarning {
  field: string;
  message: string;
  value?: unknown;
}

export interface ConfigValidationReport {
  valid: boolean;
  timestamp: string;
  results: ConfigValidationResult[];
}

/**
 * Validate the entire SpyralConfig object.
 */
export function validateConfig(config: SpyralConfig): ConfigValidationReport {
  const results: ConfigValidationResult[] = [];

  results.push(validateSecretsConfig(config.secrets));
  results.push(validateLoggingConfig(config.logging));
  results.push(validateServerConfig(config.server));
  results.push(validateDatabaseConfig(config.database));
  if (config.migrations) {
    results.push(validateMigrationConfig(config.migrations));
  }

  return {
    valid: results.every((r) => r.valid),
    timestamp: new Date().toISOString(),
    results,
  };
}

function validateSecretsConfig(secrets: SecretsConfig): ConfigValidationResult {
  const errors: ConfigError[] = [];
  const warnings: ConfigWarning[] = [];

  if (!secrets.jwtSecret) {
    errors.push({ field: "secrets.jwtSecret", message: "JWT secret is required" });
  } else if (secrets.jwtSecret === "spyral-dev-secret-do-not-use-in-production") {
    warnings.push({
      field: "secrets.jwtSecret",
      message: "Using default development JWT secret — not suitable for production",
      value: secrets.jwtSecret.substring(0, 20) + "…",
    });
  }

  if (secrets.sessionExpiryMs <= 0) {
    errors.push({
      field: "secrets.sessionExpiryMs",
      message: "Session expiry must be a positive number",
      value: secrets.sessionExpiryMs,
    });
  }

  if (secrets.bcryptRounds !== undefined && (secrets.bcryptRounds < 4 || secrets.bcryptRounds > 16)) {
    warnings.push({
      field: "secrets.bcryptRounds",
      message: "bcrypt rounds should be between 4 and 16 for security/performance balance",
      value: secrets.bcryptRounds,
    });
  }

  return { valid: errors.length === 0, section: "secrets", errors, warnings };
}

function validateLoggingConfig(logging: LoggingConfig): ConfigValidationResult {
  const errors: ConfigError[] = [];
  const warnings: ConfigWarning[] = [];

  const validLevels = ["debug", "info", "warn", "error"];
  if (!validLevels.includes(logging.level)) {
    errors.push({
      field: "logging.level",
      message: `Invalid log level "${logging.level}". Must be one of: ${validLevels.join(", ")}`,
      value: logging.level,
    });
  }

  const validFormats = ["json", "text"];
  if (!validFormats.includes(logging.format)) {
    errors.push({
      field: "logging.format",
      message: `Invalid log format "${logging.format}". Must be one of: ${validFormats.join(", ")}`,
      value: logging.format,
    });
  }

  const validOutputs = ["console", "file"];
  if (!validOutputs.includes(logging.output)) {
    errors.push({
      field: "logging.output",
      message: `Invalid log output "${logging.output}". Must be one of: ${validOutputs.join(", ")}`,
      value: logging.output,
    });
  }

  if (logging.output === "file" && !logging.filePath) {
    errors.push({
      field: "logging.filePath",
      message: "File path is required when log output is 'file'",
    });
  }

  return { valid: errors.length === 0, section: "logging", errors, warnings };
}

function validateServerConfig(server: ServerConfig): ConfigValidationResult {
  const errors: ConfigError[] = [];
  const warnings: ConfigWarning[] = [];

  if (server.port < 1 || server.port > 65535) {
    errors.push({
      field: "server.port",
      message: "Port must be between 1 and 65535",
      value: server.port,
    });
  }

  if (!server.host) {
    errors.push({ field: "server.host", message: "Host is required" });
  }

  if (!server.corsOrigins || server.corsOrigins.length === 0) {
    warnings.push({
      field: "server.corsOrigins",
      message: "No CORS origins configured — API will not be accessible from browsers",
    });
  }

  if (server.corsOrigins?.includes("*")) {
    warnings.push({
      field: "server.corsOrigins",
      message: "CORS configured with wildcard — not suitable for production",
    });
  }

  return { valid: errors.length === 0, section: "server", errors, warnings };
}

function validateDatabaseConfig(database: DatabaseConfig): ConfigValidationResult {
  const errors: ConfigError[] = [];
  const warnings: ConfigWarning[] = [];

  const validTypes = ["file", "sqlite", "postgres"];
  if (!validTypes.includes(database.type)) {
    errors.push({
      field: "database.type",
      message: `Invalid database type "${database.type}". Must be one of: ${validTypes.join(", ")}`,
      value: database.type,
    });
  }

  if (database.type === "sqlite" && !database.sqlitePath) {
    errors.push({
      field: "database.sqlitePath",
      message: "sqlitePath is required when database type is 'sqlite'",
    });
  }

  if (database.type === "postgres" && !database.connectionString) {
    errors.push({
      field: "database.connectionString",
      message: "connectionString is required when database type is 'postgres'",
    });
  }

  if (database.type === "file" && !database.filePath) {
    warnings.push({
      field: "database.filePath",
      message: "No filePath specified for file-based storage — using default",
    });
  }

  return { valid: errors.length === 0, section: "database", errors, warnings };
}

function validateMigrationConfig(migrations: MigrationConfig): ConfigValidationResult {
  const errors: ConfigError[] = [];
  const warnings: ConfigWarning[] = [];

  if (!migrations.directory) {
    errors.push({ field: "migrations.directory", message: "Migration directory path is required" });
  }

  return { valid: errors.length === 0, section: "migrations", errors, warnings };
}
