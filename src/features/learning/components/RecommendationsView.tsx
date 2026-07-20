/**
 * RecommendationsView — Displays evidence-backed suggestions with status tracking.
 *
 * Per ADR-0037, Recommendations derive from Insights.
 * Per ADR-0019 (Explainability), every Recommendation must contain
 * explanation, confidence, supporting evidence, and alternative interpretations.
 * Per ADR-0039 (Recursive Explainability), every Recommendation should be
 * traceable back through the full pipeline.
 */

"use client";

import { Target, Trash2, CheckCircle2, XCircle, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { LearningStore } from "../learning.store";
import type { Recommendation } from "@/kernel/contracts/Recommendation";

// ─── Props ──────────────────────────────────────────────────────────────

interface RecommendationsViewProps {
  recommendations: Recommendation[];
}

// ─── Status config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Recommendation["status"], { label: string; color: string; icon: React.ElementType }> = {
  active: { label: "Active", color: "text-emerald-400", icon: Target },
  implemented: { label: "Implemented", color: "text-blue-400", icon: CheckCircle2 },
  dismissed: { label: "Dismissed", color: "text-zinc-500", icon: XCircle },
  superseded: { label: "Superseded", color: "text-amber-400", icon: Archive },
};

const PRIORITY_COLORS: Record<Recommendation["priority"], string> = {
  critical: "bg-red-900/50 text-red-400",
  high: "bg-amber-900/50 text-amber-400",
  medium: "bg-blue-900/50 text-blue-400",
  low: "bg-zinc-800 text-zinc-400",
};

// ─── Component ──────────────────────────────────────────────────────────

export function RecommendationsView({ recommendations }: RecommendationsViewProps) {
  const handleStatusChange = (id: string, status: Recommendation["status"]) => {
    LearningStore.updateRecommendationStatus(id, status);
  };

  const handleDelete = (id: string) => {
    LearningStore.deleteRecommendation(id);
  };

  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
        <Target className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-sm">No recommendations generated yet</p>
        <p className="text-xs mt-1">Click "Generate Recommendations" to create evidence-backed suggestions</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => {
        const StatusIcon = STATUS_CONFIG[rec.status].icon;

        return (
          <div
            key={rec.id}
            className="bg-zinc-900 rounded-lg border border-zinc-800 p-3"
          >
            <div className="flex items-start gap-3">
              <StatusIcon className={cn("w-4 h-4 mt-0.5 shrink-0", STATUS_CONFIG[rec.status].color)} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{rec.title}</p>
                  <span className={cn("text-xs px-1.5 py-0.5 rounded", PRIORITY_COLORS[rec.priority])}>
                    {rec.priority}
                  </span>
                  <span className={cn("text-xs", STATUS_CONFIG[rec.status].color)}>
                    {STATUS_CONFIG[rec.status].label}
                  </span>
                </div>

                {rec.description && (
                  <p className="text-xs text-zinc-400 mt-1">{rec.description}</p>
                )}

                {/* Explainability section */}
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-zinc-600">
                    <span className="text-zinc-500">Reasoning: </span>
                    {rec.explanation.reasoning}
                  </p>
                  {rec.explanation.evidence && (
                    <p className="text-xs text-zinc-600">
                      <span className="text-zinc-500">Evidence: </span>
                      {rec.explanation.evidence}
                    </p>
                  )}
                  <p className="text-xs text-zinc-600">
                    <span className="text-zinc-500">Confidence: </span>
                    {Math.round(rec.explanation.confidence * 100)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Status actions */}
                {rec.status === "active" && (
                  <>
                    <button
                      onClick={() => handleStatusChange(rec.id, "implemented")}
                      className="p-1 hover:bg-zinc-700 rounded text-zinc-600 hover:text-blue-400 transition-colors"
                      title="Mark implemented"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleStatusChange(rec.id, "dismissed")}
                      className="p-1 hover:bg-zinc-700 rounded text-zinc-600 hover:text-zinc-400 transition-colors"
                      title="Dismiss"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                {rec.status === "implemented" && (
                  <button
                    onClick={() => handleStatusChange(rec.id, "superseded")}
                    className="p-1 hover:bg-zinc-700 rounded text-zinc-600 hover:text-amber-400 transition-colors"
                    title="Mark superseded"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(rec.id)}
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
