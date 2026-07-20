/**
 * ConfidenceView — Confidence evolution visualization.
 *
 * Shows how validation confidence changes over time.
 * Per ADR-0033, confidence is dynamic and context-specific.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Gauge, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ValidationStore, type Outcome } from "../validation.store";

// ─── Props ──────────────────────────────────────────────────────────────

interface ConfidenceViewProps {
  runId: string;
}

// ─── Component ──────────────────────────────────────────────────────────

export function ConfidenceView({ runId }: ConfidenceViewProps) {
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

  // Calculate confidence metrics
  const avgConfidence = allOutcomes.length > 0
    ? allOutcomes.reduce((sum, o) => sum + o.confidence.value, 0) / allOutcomes.length
    : 0;

  const latestConfidence = allOutcomes[allOutcomes.length - 1]?.confidence.value || 0;
  const confidenceTrend = allOutcomes.length >= 2
    ? (allOutcomes[allOutcomes.length - 1].confidence.value - allOutcomes[0].confidence.value)
    : 0;

  const getBarColor = (value: number) => {
    if (value >= 0.75) return "bg-emerald-500";
    if (value >= 0.5) return "bg-amber-500";
    if (value >= 0.25) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-4">
      {/* Confidence stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500">Latest Confidence</div>
          <div className="text-lg font-semibold text-white mt-1">
            {(latestConfidence * 100).toFixed(0)}%
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
            <div
              className={cn("h-full rounded-full", getBarColor(latestConfidence))}
              style={{ width: `${latestConfidence * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500">Average Confidence</div>
          <div className="text-lg font-semibold text-white mt-1">
            {(avgConfidence * 100).toFixed(0)}%
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
            <div
              className={cn("h-full rounded-full", getBarColor(avgConfidence))}
              style={{ width: `${avgConfidence * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500">Trend</div>
          <div className={cn(
            "text-lg font-semibold mt-1",
            confidenceTrend > 0 ? "text-emerald-400" :
            confidenceTrend < 0 ? "text-red-400" : "text-zinc-400"
          )}>
            {confidenceTrend > 0 ? "↑ Improving" : confidenceTrend < 0 ? "↓ Declining" : "→ Stable"}
          </div>
          <div className="text-[10px] text-zinc-600 mt-1">
            {allOutcomes.length} outcome{allOutcomes.length !== 1 ? "s" : ""} measured
          </div>
        </div>
      </div>

      {/* Confidence history */}
      {allOutcomes.length > 0 ? (
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-medium text-zinc-400">Confidence History</h3>
          <div className="space-y-2">
            {allOutcomes.map((outcome, index) => {
              const pct = (outcome.confidence.value * 100).toFixed(0);
              return (
                <div key={outcome.id} className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-600 w-16 shrink-0">
                    {new Date(outcome.createdAt).toLocaleDateString?.() || "N/A"}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", getBarColor(outcome.confidence.value))}
                          style={{ width: `${outcome.confidence.value * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-300 w-10 text-right">{pct}%</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-zinc-600">{outcome.confidence.label}</span>
                      <span className="text-[10px] text-zinc-700">•</span>
                      <span className="text-[10px] text-zinc-600 capitalize">{outcome.result.replace("_", " ")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-700">
          <Gauge className="w-8 h-8 mb-3" />
          <p className="text-sm">Complete a validation run to see confidence data.</p>
        </div>
      )}

      {/* Per-metric confidence (from current run) */}
      {run && run.metrics.length > 0 && (
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-medium text-zinc-400">Per-Metric Confidence (Current Run)</h3>
          {run.metrics.map((metric: any) => (
            <div key={metric.metricId} className="flex items-center gap-3">
              <span className="text-xs text-zinc-300 w-24 truncate">{metric.metricId}</span>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", getBarColor(metric.confidence))}
                  style={{ width: `${metric.confidence * 100}%` }}
                />
              </div>
              <span className="text-xs text-zinc-400 w-10 text-right">{(metric.confidence * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
