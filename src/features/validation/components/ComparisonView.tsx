/**
 * ComparisonView — Expected vs Observed vs Variance comparison table.
 *
 * Per ADR-0032, Validation compares:
 *   Expected → Observed → Variance → Confidence
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ValidationStore, type ValidationRun, type ValidationMetric } from "../validation.store";

// ─── Props ──────────────────────────────────────────────────────────────

interface ComparisonViewProps {
  runId: string;
}

// ─── Direction icon ─────────────────────────────────────────────────────

function DirectionIcon({ direction }: { direction: string }) {
  switch (direction) {
    case "improved":
      return <ArrowUp className="w-3 h-3 text-emerald-400" />;
    case "regressed":
      return <ArrowDown className="w-3 h-3 text-red-400" />;
    default:
      return <Minus className="w-3 h-3 text-zinc-500" />;
  }
}

// ─── Component ──────────────────────────────────────────────────────────

export function ComparisonView({ runId }: ComparisonViewProps) {
  const [run, setRun] = useState<ValidationRun | null>(null);
  const [newMetricId, setNewMetricId] = useState("");
  const [newExpected, setNewExpected] = useState("100");
  const [newObserved, setNewObserved] = useState("85");
  const [newConfidence, setNewConfidence] = useState("0.75");

  const refresh = useCallback(() => {
    const r = ValidationStore.getRunById(runId);
    setRun(r || null);
  }, [runId]);

  useEffect(() => {
    refresh();
    const unsub = ValidationStore.subscribe(refresh);
    return unsub;
  }, [refresh]);

  const handleAddMetric = () => {
    if (!newMetricId.trim()) return;
    const metric = ValidationStore.createMetric(
      newMetricId.trim(),
      parseFloat(newExpected) || 0,
      parseFloat(newObserved) || 0,
      parseFloat(newConfidence) || 0
    );
    if (run) {
      ValidationStore.updateRun(run.id, {
        metrics: [...run.metrics, metric],
      });
    }
    setNewMetricId("");
    setNewExpected("100");
    setNewObserved("85");
    setNewConfidence("0.75");
  };

  const handleRemoveMetric = (metricId: string) => {
    if (run) {
      ValidationStore.updateRun(run.id, {
        metrics: run.metrics.filter((m) => m.metricId !== metricId),
      });
    }
  };

  if (!run) return null;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      {run.metrics.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4">
            <div className="text-xs text-zinc-500">Total Metrics</div>
            <div className="text-lg font-semibold text-white mt-1">{run.metrics.length}</div>
          </div>
          <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4">
            <div className="text-xs text-zinc-500">Improved</div>
            <div className="text-lg font-semibold text-emerald-400 mt-1">
              {run.metrics.filter((m) => m.variance.direction === "improved").length}
            </div>
          </div>
          <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4">
            <div className="text-xs text-zinc-500">Regressed</div>
            <div className="text-lg font-semibold text-red-400 mt-1">
              {run.metrics.filter((m) => m.variance.direction === "regressed").length}
            </div>
          </div>
          <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4">
            <div className="text-xs text-zinc-500">Unchanged</div>
            <div className="text-lg font-semibold text-zinc-400 mt-1">
              {run.metrics.filter((m) => m.variance.direction === "unchanged").length}
            </div>
          </div>
        </div>
      )}

      {/* Add metric form */}
      <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4">
        <h3 className="text-xs font-medium text-zinc-400 mb-3">Add Metric</h3>
        <div className="grid grid-cols-5 gap-2">
          <input
            value={newMetricId}
            onChange={(e) => setNewMetricId(e.target.value)}
            placeholder="Metric ID..."
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500"
          />
          <input
            value={newExpected}
            onChange={(e) => setNewExpected(e.target.value)}
            placeholder="Expected"
            type="number"
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500"
          />
          <input
            value={newObserved}
            onChange={(e) => setNewObserved(e.target.value)}
            placeholder="Observed"
            type="number"
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500"
          />
          <input
            value={newConfidence}
            onChange={(e) => setNewConfidence(e.target.value)}
            placeholder="Confidence (0-1)"
            type="number"
            step="0.05"
            min="0"
            max="1"
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500"
          />
          <button
            onClick={handleAddMetric}
            className="flex items-center justify-center gap-1 px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-white transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
      </div>

      {/* Metrics table */}
      {run.metrics.length > 0 ? (
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Metric</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Expected</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Observed</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Variance (Abs)</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Variance (%)</th>
                <th className="text-center px-4 py-3 text-zinc-500 font-medium">Direction</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Confidence</th>
                <th className="w-8 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {run.metrics.map((metric) => (
                <tr key={metric.metricId} className="border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 text-zinc-200 font-medium">{metric.metricId}</td>
                  <td className="px-4 py-3 text-right text-zinc-300">{metric.expectedValue}</td>
                  <td className="px-4 py-3 text-right text-zinc-300">{metric.observedValue}</td>
                  <td className={cn(
                    "px-4 py-3 text-right",
                    metric.variance.direction === "improved" ? "text-emerald-400" :
                    metric.variance.direction === "regressed" ? "text-red-400" : "text-zinc-400"
                  )}>
                    {metric.variance.absolute > 0 ? "+" : ""}{metric.variance.absolute.toFixed(2)}
                  </td>
                  <td className={cn(
                    "px-4 py-3 text-right",
                    metric.variance.direction === "improved" ? "text-emerald-400" :
                    metric.variance.direction === "regressed" ? "text-red-400" : "text-zinc-400"
                  )}>
                    {metric.variance.percentage > 0 ? "+" : ""}{metric.variance.percentage.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <DirectionIcon direction={metric.variance.direction} />
                      <span className={cn(
                        "text-[10px]",
                        metric.variance.direction === "improved" ? "text-emerald-400" :
                        metric.variance.direction === "regressed" ? "text-red-400" : "text-zinc-500"
                      )}>
                        {metric.variance.direction}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            metric.confidence >= 0.75 ? "bg-emerald-500" :
                            metric.confidence >= 0.5 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${metric.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-zinc-400 w-8 text-right">{(metric.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRemoveMetric(metric.metricId)}
                      className="opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-zinc-600 hover:text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-700">
          <BarChart3 className="w-8 h-8 mb-3" />
          <p className="text-sm">No metrics yet. Add expected and observed values above.</p>
        </div>
      )}

      {/* Run info */}
      <div className="flex items-center gap-4 text-[10px] text-zinc-700">
        <span>Run: {run.id}</span>
        <span>Status: {run.status.replace("_", " ")}</span>
        <span>Plan: {run.executionPlanId}</span>
      </div>
    </div>
  );
}

// Need BarChart3 for the empty state
import { BarChart3 } from "lucide-react";
