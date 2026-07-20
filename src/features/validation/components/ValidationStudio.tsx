/**
 * ValidationStudio — Main container for the Validation Studio.
 *
 * Provides tabbed access to:
 * - Comparison (Expected vs Observed vs Variance)
 * - Trend (historical validations)
 * - Confidence (confidence evolution)
 * - Outcome Summary (traffic-light visualization)
 *
 * Per ADR-0032, Validation is a comparison engine.
 * Per ADR-0035, Validation produces Outcomes for the Learning Engine.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, TrendingUp, Gauge, Target, Plus, Play, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ValidationStore, type ValidationRun } from "../validation.store";
import { ComparisonView } from "./ComparisonView";
import { TrendView } from "./TrendView";
import { ConfidenceView } from "./ConfidenceView";
import { OutcomeSummary } from "./OutcomeSummary";

// ─── Tab config ─────────────────────────────────────────────────────────

type Tab = "comparison" | "trend" | "confidence" | "outcomes";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "comparison", label: "Comparison", icon: BarChart3 },
  { id: "trend", label: "Trend", icon: TrendingUp },
  { id: "confidence", label: "Confidence", icon: Gauge },
  { id: "outcomes", label: "Outcomes", icon: Target },
];

// ─── Props ──────────────────────────────────────────────────────────────

interface ValidationStudioProps {
  workspaceId?: string;
}

// ─── Component ──────────────────────────────────────────────────────────

export function ValidationStudio({ workspaceId }: ValidationStudioProps) {
  const [activeTab, setActiveTab] = useState<Tab>("comparison");
  const [runs, setRuns] = useState<ValidationRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [showCreateRun, setShowCreateRun] = useState(false);
  const [newRunPlanId, setNewRunPlanId] = useState("");
  const [newRunSnapshotBefore, setNewRunSnapshotBefore] = useState("");
  const [newRunSnapshotAfter, setNewRunSnapshotAfter] = useState("");

  const refresh = useCallback(() => {
    setRuns(ValidationStore.getRuns());
  }, []);

  useEffect(() => {
    refresh();
    const unsub = ValidationStore.subscribe(refresh);
    return unsub;
  }, [refresh]);

  // Auto-select first run
  useEffect(() => {
    if (!selectedRunId && runs.length > 0) {
      setSelectedRunId(runs[0].id);
    }
  }, [runs, selectedRunId]);

  const handleCreateRun = () => {
    if (!newRunPlanId.trim()) return;
    const run = ValidationStore.createRun({
      executionPlanId: newRunPlanId.trim(),
      realitySnapshotBefore: newRunSnapshotBefore.trim() || "snapshot_before",
      realitySnapshotAfter: newRunSnapshotAfter.trim() || "snapshot_after",
      timestamp: new Date().toISOString(),
      validator: "manual",
      status: "in_progress",
      metrics: [],
    });
    setSelectedRunId(run.id);
    setNewRunPlanId("");
    setNewRunSnapshotBefore("");
    setNewRunSnapshotAfter("");
    setShowCreateRun(false);
  };

  const handleCompleteRun = (runId: string) => {
    ValidationStore.completeRun(runId);
    // Add a sample metric if none exist
    const run = ValidationStore.getRunById(runId);
    if (run && run.metrics.length === 0) {
      const metric = ValidationStore.createMetric("metric_1", 100, 85, 0.75);
      ValidationStore.updateRun(runId, {
        metrics: [metric],
        status: "in_progress",
      });
      ValidationStore.completeRun(runId);
    }
  };

  const selectedRun = runs.find((r) => r.id === selectedRunId);
  const outcomes = selectedRun ? ValidationStore.getOutcomes().filter((o) => o.validationRunId === selectedRun.id) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Validation Studio</h1>
          <p className="text-xs text-zinc-600 mt-0.5">Compare expected vs observed results</p>
        </div>
        <button
          onClick={() => setShowCreateRun(!showCreateRun)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Validation
        </button>
      </div>

      {/* Create run form */}
      {showCreateRun && (
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4 space-y-3">
          <input
            value={newRunPlanId}
            onChange={(e) => setNewRunPlanId(e.target.value)}
            placeholder="Execution Plan ID..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500"
            onKeyDown={(e) => e.key === "Enter" && handleCreateRun()}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={newRunSnapshotBefore}
              onChange={(e) => setNewRunSnapshotBefore(e.target.value)}
              placeholder="Before snapshot ID..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500"
            />
            <input
              value={newRunSnapshotAfter}
              onChange={(e) => setNewRunSnapshotAfter(e.target.value)}
              placeholder="After snapshot ID..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500"
            />
          </div>
          <button
            onClick={handleCreateRun}
            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-white transition-colors"
          >
            Create Validation Run
          </button>
        </div>
      )}

      {/* Run selector */}
      {runs.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {runs.map((run) => (
            <button
              key={run.id}
              onClick={() => setSelectedRunId(run.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors whitespace-nowrap",
                selectedRunId === run.id
                  ? "bg-zinc-800 text-white border border-zinc-700"
                  : "bg-[#1a1a1a] text-zinc-500 border border-zinc-800 hover:text-zinc-300 hover:border-zinc-700"
              )}
            >
              <CheckCircle2 className={cn(
                "w-3 h-3",
                run.status === "completed" ? "text-emerald-400" :
                run.status === "in_progress" ? "text-amber-400" : "text-zinc-600"
              )} />
              <span>Validation {run.id.slice(-6)}</span>
              <span className="text-[10px] text-zinc-600">{run.status.replace("_", " ")}</span>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {runs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-700">
          <BarChart3 className="w-12 h-12 mb-4" />
          <p className="text-sm mb-1">No validation runs yet</p>
          <p className="text-xs mb-6">Create a validation run to compare expected vs observed results</p>
          <button
            onClick={() => setShowCreateRun(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Validation
          </button>
        </div>
      )}

      {/* Tabs and content */}
      {selectedRun && (
        <>
          {/* Action bar */}
          {selectedRun.status !== "completed" && (
            <div className="flex justify-end">
              <button
                onClick={() => handleCompleteRun(selectedRun.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs text-white transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Complete & Generate Outcome
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-zinc-800">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 transition-colors",
                    isActive
                      ? "border-white text-zinc-200"
                      : "border-transparent text-zinc-600 hover:text-zinc-400"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div>
            {activeTab === "comparison" && <ComparisonView runId={selectedRun.id} />}
            {activeTab === "trend" && <TrendView runId={selectedRun.id} />}
            {activeTab === "confidence" && <ConfidenceView runId={selectedRun.id} />}
            {activeTab === "outcomes" && <OutcomeSummary runId={selectedRun.id} />}
          </div>
        </>
      )}
    </div>
  );
}
