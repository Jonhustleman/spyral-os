/**
 * InsightsView — Displays human-readable observations generated from Patterns.
 *
 * Per ADR-0037, Insights are observations, not advice.
 * Per ADR-0038, Insights sit between Patterns and Recommendations in the pipeline.
 */

"use client";

import { Lightbulb, Trash2 } from "lucide-react";
import { LearningStore } from "../learning.store";
import type { Insight } from "@/kernel/contracts/Insight";

// ─── Props ──────────────────────────────────────────────────────────────

interface InsightsViewProps {
  insights: Insight[];
}

// ─── Component ──────────────────────────────────────────────────────────

export function InsightsView({ insights }: InsightsViewProps) {
  const handleDelete = (id: string) => {
    LearningStore.deleteInsight(id);
  };

  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
        <Lightbulb className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-sm">No insights generated yet</p>
        <p className="text-xs mt-1">Click "Generate Insights" to derive observations from patterns</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => {
        return (
          <div
            key={insight.id}
            className="bg-zinc-900 rounded-lg border border-zinc-800 p-3"
          >
            <div className="flex items-start gap-3">
              <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{insight.description}</p>

                {/* Tags */}
                {insight.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {insight.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Evidence */}
                {insight.evidence && (
                  <p className="text-xs text-zinc-600 mt-2 italic">
                    {insight.evidence}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {insight.category && (
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                    {insight.category}
                  </span>
                )}
                <button
                  onClick={() => handleDelete(insight.id)}
                  className="p-1 hover:bg-zinc-700 rounded text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
