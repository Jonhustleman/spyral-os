/**
 * PatternsView — Displays discovered patterns with confidence visualization.
 *
 * Per ADR-0036 (Learning Is Bayesian), every repeated Outcome should
 * increase or decrease confidence in a Pattern.
 * Per ADR-0037, Patterns are discovered, not authored.
 */

"use client";

import { useState } from "react";
import { Brain, TrendingUp, TrendingDown, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LearningStore } from "../learning.store";
import type { Pattern } from "@/kernel/contracts/Pattern";

// ─── Props ──────────────────────────────────────────────────────────────

interface PatternsViewProps {
  patterns: Pattern[];
}

// ─── Confidence color helper ────────────────────────────────────────────

function confidenceColor(value: number): string {
  if (value >= 0.7) return "bg-emerald-500";
  if (value >= 0.4) return "bg-amber-500";
  return "bg-red-500";
}

function confidenceTextColor(value: number): string {
  if (value >= 0.7) return "text-emerald-400";
  if (value >= 0.4) return "text-amber-400";
  return "text-red-400";
}

// ─── Component ──────────────────────────────────────────────────────────

export function PatternsView({ patterns }: PatternsViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localPatterns, setLocalPatterns] = useState(patterns);

  // Keep local state in sync
  if (patterns !== localPatterns) {
    setLocalPatterns(patterns);
  }

  const handleDelete = (id: string) => {
    LearningStore.deletePattern(id);
  };

  const handleUpdateConfidence = (id: string, outcomeMatch: boolean) => {
    LearningStore.updatePatternConfidence(id, outcomeMatch);
  };

  if (localPatterns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
        <Brain className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-sm">No patterns discovered yet</p>
        <p className="text-xs mt-1">Click "Discover Pattern" to begin learning</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {localPatterns.map((pattern) => {
        const isExpanded = expandedId === pattern.id;
        const pct = Math.round(pattern.confidence * 100);

        return (
          <div
            key={pattern.id}
            className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/50 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : pattern.id)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                )}
                <Brain className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{pattern.title}</p>
                  {pattern.description && (
                    <p className="text-xs text-zinc-500 truncate">{pattern.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Confidence bar */}
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", confidenceColor(pattern.confidence))}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={cn("text-xs font-medium w-8 text-right", confidenceTextColor(pattern.confidence))}>
                    {pct}%
                  </span>
                </div>

                {/* Occurrence count */}
                <span className="text-xs text-zinc-500">{pattern.occurrenceCount}x</span>

                {/* Category */}
                {pattern.category && (
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                    {pattern.category}
                  </span>
                )}

                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(pattern.id);
                  }}
                  className="p-1 hover:bg-zinc-700 rounded text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Expanded: confidence controls + evidence */}
            {isExpanded && (
              <div className="px-3 pb-3 border-t border-zinc-800 pt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateConfidence(pattern.id, true);
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-emerald-900/50 rounded text-xs text-zinc-400 hover:text-emerald-400 transition-colors"
                  >
                    <TrendingUp className="w-3 h-3" />
                    Confirm Pattern
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateConfidence(pattern.id, false);
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-red-900/50 rounded text-xs text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <TrendingDown className="w-3 h-3" />
                    Contradict Pattern
                  </button>
                </div>

                <div className="text-xs text-zinc-600 space-y-1">
                  <p>Evidence Sources: {pattern.evidenceIds.length}</p>
                  <p>Last Observed: {new Date(pattern.lastObserved).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
