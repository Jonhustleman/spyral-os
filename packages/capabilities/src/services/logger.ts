/**
 * @spyral/capabilities — Logger Service
 *
 * Phase D.1 — Structured logging with levels.
 * Provides consistent logging across all services.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getTimestamp(): string {
  return new Date().toISOString();
}

function getMinLevel(): LogLevel {
  const env = process.env.SPYRAL_LOG_LEVEL || "info";
  if (env in LOG_LEVELS) return env as LogLevel;
  return "info";
}

export class Logger {
  private minLevel: number;

  constructor(private readonly context: string) {
    this.minLevel = LOG_LEVELS[getMinLevel()];
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log("warn", message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log("error", message, data);
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (LOG_LEVELS[level] < this.minLevel) return;

    const entry = {
      timestamp: getTimestamp(),
      level,
      context: this.context,
      message,
      ...(data ? { data } : {}),
    };

    const output = process.env.SPYRAL_LOG_FORMAT === "json"
      ? JSON.stringify(entry)
      : `[${entry.timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}${data ? " " + JSON.stringify(data) : ""}`;

    switch (level) {
      case "error":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }
}
