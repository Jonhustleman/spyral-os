/**
 * Root-level error boundary for SPYRAL OS.
 *
 * Next.js App Router: global-error.tsx catches errors in the root layout
 * (app/layout.tsx). Unlike error.tsx, this must include its own <html>
 * and <body> tags because it replaces the entire layout.
 *
 * This is the last line of defense — if this fails, the app shows a
 * browser-level error page.
 */

"use client";

import { AlertTriangle, RefreshCw, Compass } from "lucide-react";
import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log critical errors to console (logger may not be available if layout failed)
    console.error("[SPYRAL] Unhandled error in root layout:", error.message);
  }, [error]);

  return (
    <html lang="en">
      <body className="h-full bg-black">
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-black">
          {/* Icon */}
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-900/20 border border-red-800/30">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-white mb-2 text-center">
            SPYRAL encountered a critical error
          </h1>

          {/* Message */}
          <p className="text-sm text-zinc-400 max-w-md text-center mb-8 leading-relaxed">
            {process.env.NODE_ENV === "development"
              ? error.message
              : "A critical error occurred. Please try reloading the application."}
          </p>

          {/* Error digest */}
          {error.digest && (
            <p className="text-xs text-zinc-700 mb-8 font-mono">
              Reference: {error.digest}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>

          {/* Footer */}
          <div className="mt-12 flex items-center gap-2 text-xs text-zinc-700">
            <Compass className="w-3.5 h-3.5" />
            <span>SPYRAL OS — Reality Navigation Platform</span>
          </div>
        </div>
      </body>
    </html>
  );
}
