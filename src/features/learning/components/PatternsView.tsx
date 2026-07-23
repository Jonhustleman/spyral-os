/**
 * PatternsView — Displays discovered patterns.
 *
 * Per ADR-0037, Patterns are discovered, not authored.
 * Patterns display basic info only — internal confidence is not exposed.
 */

"use client";

import { useState } from "react";
import { Brain, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { LearningStore } from "../learning.store";
import type { Pattern } from "@/kernel/contracts/Pattern";

// ─── Props ──────────────────────────────────────────────────────────────

interface PatternsViewProps {
  patterns: Pattern[];
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

            {/* Expanded: details */}
            {isExpanded && (
              <div className="px-3 pb-3 border-t border-zinc-800 pt-3 space-y-3">
                {pattern.description && (
                  <p className="text-xs text-zinc-400">{pattern.description}</p>
                )}
                <div className="text-xs text-zinc-600 space-y-1">
                  <p>Observed {pattern.occurrenceCount} times</p>
                  <p>Last observed: {new Date(pattern.lastObserved).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
