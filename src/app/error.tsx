/**
 * Global error boundary for SPYRAL OS route segments.
 *
 * Next.js App Router: error.tsx wraps its route segment (and children)
 * in a React error boundary. This file catches errors in all routes
 * under the root layout (layout.tsx).
 *
 * For errors in the root layout itself, see global-error.tsx.
 */

"use client";

import { ErrorFallback } from "@/components/ErrorFallback";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      context="global"
    />
  );
}
