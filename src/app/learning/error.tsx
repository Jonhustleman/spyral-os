"use client";

import { ErrorFallback } from "@/components/ErrorFallback";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LearningError({ error, reset }: ErrorProps) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      context="LearningStudio"
    />
  );
}
