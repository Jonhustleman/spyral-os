/**
 * Learning Studio Page — SPYRAL OS
 *
 * Per ADR-0037, Patterns are discovered, not authored.
 * Per ADR-0038, pipeline is: Outcome → Pattern → Insight → Recommendation
 * Per ADR-0040, Intelligence (Learning) is read-only across the pipeline.
 */

"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { LearningStudio } from "@/features/learning/components/LearningStudio";

export default function LearningPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white">Learning</h1>
            <p className="text-sm text-zinc-500">
              Discovered patterns, insights, and recommendations from your SPYRAL sessions
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-sm"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>
        <LearningStudio />
      </div>
    </div>
  );
}
