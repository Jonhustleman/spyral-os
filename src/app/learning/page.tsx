/**
 * Learning Studio Page — SPYRAL OS
 *
 * Per ADR-0037, Patterns are discovered, not authored.
 * Per ADR-0038, pipeline is: Outcome → Pattern → Insight → Recommendation
 * Per ADR-0040, Intelligence (Learning) is read-only across the pipeline.
 */

"use client";

import { LearningStudio } from "@/features/learning/components/LearningStudio";

export default function LearningPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <LearningStudio />
      </div>
    </div>
  );
}
