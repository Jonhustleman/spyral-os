/**
 * ErrorFallback — Reusable error fallback UI for SPYRAL OS.
 *
 * Used by error.tsx, global-error.tsx, and any component-level error boundaries.
 * Per ADR-0048, the UI is a projection of state — even error state.
 *
 * Design principles:
 * - Clear, human-readable error messaging (no stack traces in production)
 * - Actionable recovery options
 * - Consistent with SPYRAL's brand (dark theme, minimal, compass iconography)
 * - Logs errors for diagnostics without exposing internals to the user
 */

"use client";

import { AlertTriangle, RefreshCw, Home, Compass } from "lucide-react";
import { useEffect } from "react";
import { logger } from "@/lib/logger";

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset?: () => void;
  /** Optional context label for logging (e.g., "DecisionStudio", "NavigationStudio") */
  context?: string;
}

export function ErrorFallback({ error, reset, context = "unknown" }: ErrorFallbackProps) {
  useEffect(() => {
    // Log the error for diagnostics
    logger.error(context, {
      digest: error.digest,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }, [error, context]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
      {/* Icon */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-900/20 border border-red-800/30">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>

      {/* Heading */}
      <h2 className="text-xl font-semibold text-white mb-2 text-center">
        Something unexpected happened
      </h2>

      {/* Message */}
      <p className="text-sm text-zinc-400 max-w-md text-center mb-8 leading-relaxed">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "SPYRAL encountered an unexpected issue. Your data is safe, and you can try again."}
      </p>

      {/* Error digest (for support) */}
      {error.digest && (
        <p className="text-xs text-zinc-700 mb-8 font-mono">
          Reference: {error.digest}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {reset && (
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        )}

        <a
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 text-zinc-300 text-sm hover:bg-zinc-900 transition-colors"
        >
          <Home className="w-4 h-4" />
          Go home
        </a>
      </div>

      {/* Footer */}
      <div className="mt-12 flex items-center gap-2 text-xs text-zinc-700">
        <Compass className="w-3.5 h-3.5" />
        <span>SPYRAL OS — Reality Navigation Platform</span>
      </div>
    </div>
  );
}
