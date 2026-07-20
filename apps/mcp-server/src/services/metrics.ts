/**
 * Structured Metrics — Request counting, timing, and endpoint exposure.
 *
 * Tracks:
 *   - Request counts by method and path
 *   - Request duration percentiles
 *   - Active request count
 *   - System resource metrics
 *
 * Phase D.4.2 — Structured Metrics
 */

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";

export interface MetricSummary {
  totalRequests: number;
  activeRequests: number;
  requestsByMethod: Record<string, number>;
  requestsByPath: Record<string, number>;
  requestsByStatus: Record<string, number>;
  averageDurationMs: number;
  maxDurationMs: number;
  uptimeSeconds: number;
  memoryMB: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  timestamp: string;
}

const startTime = Date.now();

interface RequestMetric {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
}

const metrics: RequestMetric[] = [];
let activeRequests = 0;
const MAX_METRICS = 10000; // Keep last 10k requests

/** Middleware that records request metrics. */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  activeRequests++;

  // Capture the response finish event
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    activeRequests--;

    const metric: RequestMetric = {
      method: req.method,
      path: req.route?.path ?? req.path ?? "unknown",
      statusCode: res.statusCode,
      durationMs,
    };

    metrics.push(metric);

    // Trim to prevent unbounded growth
    if (metrics.length > MAX_METRICS) {
      metrics.splice(0, metrics.length - MAX_METRICS);
    }
  });

  next();
}

/** Generate a summary of collected metrics. */
export function getMetricSummary(): MetricSummary {
  const totalRequests = metrics.length;
  if (totalRequests === 0) {
    return {
      totalRequests: 0,
      activeRequests,
      requestsByMethod: {},
      requestsByPath: {},
      requestsByStatus: {},
      averageDurationMs: 0,
      maxDurationMs: 0,
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      memoryMB: getMemoryUsageMB(),
      timestamp: new Date().toISOString(),
    };
  }

  const requestsByMethod: Record<string, number> = {};
  const requestsByPath: Record<string, number> = {};
  const requestsByStatus: Record<string, number> = {};
  let totalDurationMs = 0;
  let maxDurationMs = 0;

  for (const m of metrics) {
    requestsByMethod[m.method] = (requestsByMethod[m.method] ?? 0) + 1;
    requestsByPath[m.path] = (requestsByPath[m.path] ?? 0) + 1;
    requestsByStatus[String(m.statusCode)] = (requestsByStatus[String(m.statusCode)] ?? 0) + 1;
    totalDurationMs += m.durationMs;
    if (m.durationMs > maxDurationMs) maxDurationMs = m.durationMs;
  }

  return {
    totalRequests,
    activeRequests,
    requestsByMethod,
    requestsByPath,
    requestsByStatus,
    averageDurationMs: Math.round(totalDurationMs / totalRequests),
    maxDurationMs,
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    memoryMB: getMemoryUsageMB(),
    timestamp: new Date().toISOString(),
  };
}

function getMemoryUsageMB() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024),
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
  };
}

/** Register the metrics router. */
export function createMetricsRouter(): Router {
  const router = Router();

  router.get("/metrics", (_req: Request, res: Response) => {
    res.json(getMetricSummary());
  });

  return router;
}
