/**
 * Request Correlation — Assigns and propagates trace IDs for every request.
 *
 * Each incoming request gets a unique correlation ID (trace ID).
 * The ID is attached to the response headers and made available
 * on the request object for downstream use.
 *
 * Phase D.4.3 — Request Correlation
 */

import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

// Extend Express Request to include correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

const CORRELATION_HEADER = "X-Correlation-Id";

/** Middleware that ensures every request has a correlation ID. */
export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Use an existing correlation ID from the client, or generate a new one
  const existingId = req.headers[CORRELATION_HEADER.toLowerCase()] as string | undefined;
  req.correlationId = existingId ?? randomUUID();

  // Set the response header for tracing
  res.setHeader(CORRELATION_HEADER, req.correlationId);

  next();
}
