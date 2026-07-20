/**
 * OutcomeSummary — Traffic-light visualization of validation outcomes.
 *
 * Per ADR-0032 and ADR-0035, validation produces Outcomes which are
 * consumed by the Learning Engine.
 *
 * Traffic-light system:
 *   🟢 Green  = Expected Met
 *   🟡 Yellow = Partial
 *   🔴 Red    = Missed
 *   ⚪ Grey   = Inconclusive
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Target, CheckCircle2, AlertCircle, HelpCircle, Lightbulb, TrendingUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ValidationStore, type Outcome } from "../validation.store";

// ─── Props ──────────────────────────────────────────────────────────────

interface OutcomeSummaryProps {
  runId: string;
}

// ─── Traffic light config ───────────────────────────────────────────────

const TRAFFIC_LIGHT: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string; borderColor: string }> = {
  expected_met: {
    label: "Expected Met",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
  partial: {
    label: "Partial",
    icon: AlertCircle,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  missed: {
    label: "Missed",
    icon: AlertCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
  inconclusive: {
    label: "Inconclusive",
    icon: HelpCircle,
    color: "text-zinc-500",
    bgColor: "bg-zinc-500/10",
    borderColor: "border-zinc-500/30",
  },
};

// ─── Component ──────────────────────────────────────────────────────────

export function OutcomeSummary({ runId }: OutcomeSummaryProps) {
  const [run, setRun] = useState<any>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);

  const refresh = useCallback(() => {
    const r = ValidationStore.getRunById(runId);
    setRun(r || null);
    if (r) {
      setOutcomes(ValidationStore.getOutcomes().filter((o) => o.validationRunId === r.id));
    }
  }, [runId]);

  useEffect(() => {
    refresh();
    const unsub = ValidationStore.subscribe(refresh);
    return unsub;
  }, [refresh]);

  // Current run result
  const currentResult = run?.result || null;
  const currentConfig = currentResult ? TRAFFIC_LIGHT[currentResult] : null;

  return (
    <div className="space-y-4">
      {/* Current traffic light */}
      {currentResult && currentConfig ? (
        <div className={cn(
          "rounded-xl border p-6 text-center space-y-3 transition-all",
          currentConfig.bgColor,
          currentConfig.borderColor
        )}>
          <div className="flex items-center justify-center gap-2">
            {React.createElement(currentConfig.icon, { className: cn("w-6 h-6", currentConfig.color) })}
            <span className={cn("text-lg font-semibold", currentConfig.color)}>
              {currentConfig.label}
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            {currentResult === "expected_met" && "Reality changed as expected. The execution achieved its intended effect."}
            {currentResult === "partial" && "Some metrics improved but others regressed. Review the comparison view for details."}
            {currentResult === "missed" && "Reality did not change as expected. The execution did not achieve its intended effect."}
            {currentResult === "inconclusive" && "Insufficient data to determine whether the execution achieved its effect."}
          </p>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-6 text-center space-y-2">
          <Target className="w-6 h-6 text-zinc-700 mx-auto" />
          <p className="text-sm text-zinc-600">No outcome yet. Complete a validation run to generate one.</p>
        </div>
      )}

      {/* Outcome details */}
      {outcomes.length > 0 && (
        <div className="space-y-3">
          {outcomes.map((outcome) => {
            const config = TRAFFIC_LIGHT[outcome.result] || TRAFFIC_LIGHT.inconclusive;
            const Icon = config.icon;

            return (
              <div key={outcome.id} className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-lg", config.bgColor)}>
                      <Icon className={cn("w-4 h-4", config.color)} />
                    </div>
                    <div>
                      <span className={cn("text-sm font-medium", config.color)}>{config.label}</span>
                      <span className="text-[10px] text-zinc-600 ml-2">
                        {new Date(outcome.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500">
                    Confidence: <span className="text-zinc-300">{(outcome.confidence.value * 100).toFixed(0)}%</span>
                  </span>
                </div>

                {/* Summary */}
                {outcome.summary && (
                  <p className="text-xs text-zinc-400 bg-zinc-900 rounded-lg p-3">{outcome.summary}</p>
                )}

                {/* Insights */}
                {outcome.insights.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                      <Lightbulb className="w-3 h-3" />
                      Insights
                    </div>
                    <ul className="space-y-1">
                      {outcome.insights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                          <span className="text-zinc-700 mt-0.5">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Variances */}
                {outcome.variances.length > 0 && (
                  <details>
                    <summary className="text-[10px] text-zinc-600 cursor-pointer hover:text-zinc-400">
                      Variances ({outcome.variances.length})
                    </summary>
                    <div className="mt-2 space-y-1">
                      {outcome.variances.map((v, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] text-zinc-600">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            v.direction === "improved" ? "bg-emerald-500" :
                            v.direction === "regressed" ? "bg-red-500" : "bg-zinc-600"
                          )} />
                          <span>Abs: {v.absolute.toFixed(2)}</span>
                          <span>%: {v.percentage.toFixed(1)}%</span>
                          <span className="capitalize">{v.direction}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Platform readiness note */}
      <div className="text-[10px] text-zinc-700 text-center pt-4 border-t border-zinc-800/50">
        <span className="text-zinc-600">ADR-0035: </span>
        Validation produces Outcomes → Learning consumes Outcomes
      </div>
    </div>
  );
}

// Need React for createElement
import React from "react";
