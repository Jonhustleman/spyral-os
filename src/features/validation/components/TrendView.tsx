/**
 * TrendView — Historical validation trend for a decision or execution plan.
 *
 * Shows how validation results have changed over time across multiple runs.
 * Per ADR-0034, forecast accuracy will eventually be measured here.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, AlertCircle, CheckCircle2, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ValidationStore, type Outcome } from "../validation.store";

// ─── Props ──────────────────────────────────────────────────────────────

interface TrendViewProps {
  runId: string;
}

// ─── Result Badge ───────────────────────────────────────────────────────

function ResultBadge({ result }: { result: string }) {
  const config: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    expected_met: { label: "Expected Met", icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10" },
    partial: { label: "Partial", icon: AlertCircle, color: "text-amber-400 bg-amber-500/10" },
    missed: { label: "Missed", icon: AlertCircle, color: "text-red-400 bg-red-500/10" },
    inconclusive: { label: "Inconclusive", icon: Minus, color: "text-zinc-500 bg-zinc-500/10" },
  };
  const c = config[result] || config.inconclusive;
  const Icon = c.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]", c.color)}>
      <Icon className="w-2.5 h-2.5" />
      {c.label}
    </span>
  );
}

// ─── Component ──────────────────────────────────────────────────────────

export function TrendView({ runId }: TrendViewProps) {
  const [run, setRun] = useState<any>(null);
  const [allOutcomes, setAllOutcomes] = useState<Outcome[]>([]);

  const refresh = useCallback(() => {
    const r = ValidationStore.getRunById(runId);
    setRun(r || null);
    if (r) {
      const outcomes = ValidationStore.getOutcomes().filter((o) => o.validationRunId === r.id);
      setAllOutcomes(outcomes);
    }
  }, [runId]);

  useEffect(() => {
    refresh();
    const unsub = ValidationStore.subscribe(refresh);
    return unsub;
  }, [refresh]);

  return (
    <div className="space-y-4">
      {/* Trend chart (simplified as a timeline list for now) */}
      {allOutcomes.length > 0 ? (
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-medium text-zinc-400">Validation History</h3>
          <div className="space-y-2">
            {allOutcomes.map((outcome, index) => (
              <div key={outcome.id} className="flex items-start gap-3">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5",
                    outcome.result === "expected_met" ? "bg-emerald-500" :
                    outcome.result === "partial" ? "bg-amber-500" :
                    outcome.result === "missed" ? "bg-red-500" : "bg-zinc-600"
                  )} />
                  {index < allOutcomes.length - 1 && (
                    <div className="w-px h-8 bg-zinc-800" />
                  )}
                </div>

                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <ResultBadge result={outcome.result} />
                    <span className="text-[10px] text-zinc-600">
                      {outcome.createdAt.toLocaleDateString?.() || new Date(outcome.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {outcome.summary && (
                    <p className="text-xs text-zinc-400 mt-1">{outcome.summary}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-zinc-600">
                      Confidence: <span className="text-zinc-400">{(outcome.confidence.value * 100).toFixed(0)}%</span>
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      Variances: <span className="text-zinc-400">{outcome.variances.length}</span>
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      Insights: <span className="text-zinc-400">{outcome.insights.length}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-700">
          <TrendingUp className="w-8 h-8 mb-3" />
          <p className="text-sm">Complete a validation run to see trend data.</p>
        </div>
      )}

      {/* Raw outcomes */}
      {allOutcomes.length > 0 && (
        <details className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4">
          <summary className="text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-300">
            Outcome Details ({allOutcomes.length})
          </summary>
          <div className="mt-3 space-y-2">
            {allOutcomes.map((outcome) => (
              <pre key={outcome.id} className="text-[10px] text-zinc-600 bg-zinc-900 p-2 rounded-lg overflow-x-auto">
                {JSON.stringify(outcome, null, 2)}
              </pre>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
