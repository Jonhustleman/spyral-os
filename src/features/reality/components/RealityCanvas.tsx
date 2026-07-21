/**
 * RealityCanvas — The main Reality Engine UI.
 *
 * Displays:
 *   - Current Reality (metrics with confidence)
 *   - Desired Reality (goals with targets)
 *   - Gap Summary (automatically calculated)
 *   - Evidence
 *   - Constraints
 *
 * Users can edit all sections directly.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import type { RealitySnapshot } from "@/kernel/contracts/RealitySnapshot";
import type { RealityMetric, MetricConfidence } from "@/kernel/contracts/RealityMetric";
import { StatementType } from "@/kernel/contracts/StatementType";
import type { RealityGoal, RealityTargetMetric } from "@/kernel/contracts/RealityGoal";
import type { RealityGap } from "@/kernel/contracts/RealityGap";
import { RealityStore } from "@/features/reality/reality.store";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  TrendingUp,
  Target,
  AlertTriangle,
  FileText,
  Shield,
  BarChart3,
  RefreshCw,
} from "lucide-react";

// ─── Props ─────────────────────────────────────────────────────────────────

interface RealityCanvasProps {
  workspaceId: string;
}

// ─── Confidence badge colors ───────────────────────────────────────────────

const confidenceColors: Record<MetricConfidence, string> = {
  measured: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  estimated: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  inferred: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  unknown: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const statementTypeColors: Record<StatementType, string> = {
  fact: "bg-emerald-500/10 text-emerald-400",
  assumption: "bg-amber-500/10 text-amber-400",
  inference: "bg-blue-500/10 text-blue-400",
  recommendation: "bg-purple-500/10 text-purple-400",
};

const gapSeverityColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  significant: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  moderate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  minor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

// ─── Component ─────────────────────────────────────────────────────────────

export function RealityCanvas({ workspaceId }: RealityCanvasProps) {
  const [snapshot, setSnapshot] = useState<RealitySnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<string>("metrics");

  const refresh = useCallback(() => {
    const s = RealityStore.ensureSnapshot(workspaceId);
    setSnapshot({ ...s });
  }, [workspaceId]);

  useEffect(() => {
    refresh();
    const unsub = RealityStore.subscribe(refresh);
    return unsub;
  }, [refresh]);

  // ── Metric form ────────────────────────────────────────────────────────

  const [newMetric, setNewMetric] = useState({
    name: "",
    value: "",
    unit: "",
    confidence: "estimated" as MetricConfidence,
    statementType: StatementType.FACT,
    source: "",
  });

  const handleAddMetric = () => {
    if (!newMetric.name || !newMetric.value) return;
    RealityStore.addMetric(workspaceId, {
      workspaceId,
      name: newMetric.name,
      value: parseFloat(newMetric.value),
      unit: newMetric.unit || undefined,
      confidence: newMetric.confidence,
      statementType: newMetric.statementType as StatementType,
      source: newMetric.source || "Manual entry",
      tags: [],
    });
    setNewMetric({ name: "", value: "", unit: "", confidence: "estimated", statementType: StatementType.FACT, source: "" });
  };

  // ── Goal form ──────────────────────────────────────────────────────────

  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    targetName: "",
    targetValue: "",
    targetUnit: "",
  });

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.targetName || !newGoal.targetValue) return;
    const target: RealityTargetMetric = {
      name: newGoal.targetName,
      targetValue: parseFloat(newGoal.targetValue),
      unit: newGoal.targetUnit || undefined,
    };
    RealityStore.setGoal(workspaceId, {
      workspaceId,
      title: newGoal.title,
      description: newGoal.description,
      targetMetrics: [target],
      isPrimary: snapshot !== null && snapshot.goals.length === 0,
    });
    setNewGoal({ title: "", description: "", targetName: "", targetValue: "", targetUnit: "" });
  };

  // ── Calculate gaps ─────────────────────────────────────────────────────

  const handleCalculateGaps = () => {
    RealityStore.calculateGaps(workspaceId);
  };

  if (!snapshot) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  // ── Tabs ───────────────────────────────────────────────────────────────

  const tabs = [
    { id: "metrics", label: "Current Reality", icon: BarChart3 },
    { id: "goals", label: "Desired Reality", icon: Target },
    { id: "gaps", label: "Gap Summary", icon: AlertTriangle },
    { id: "evidence", label: "Evidence", icon: FileText },
    { id: "constraints", label: "Constraints", icon: Shield },
  ];

  // ── Render tab content ─────────────────────────────────────────────────

  const renderTabContent = () => {
    switch (activeTab) {
      case "metrics":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                {snapshot.metrics.length} metric{snapshot.metrics.length !== 1 ? "s" : ""} tracked
              </p>
            </div>

            {/* Metric list */}
            {snapshot.metrics.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-6 text-center">
                <BarChart3 className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No metrics yet. Add your first data point.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {snapshot.metrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{metric.name}</p>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium uppercase",
                            statementTypeColors[metric.statementType]
                          )}
                        >
                          {metric.statementType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-lg font-semibold text-white">
                          {metric.value}
                          {metric.unit && <span className="text-sm text-zinc-500 ml-0.5">{metric.unit}</span>}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium",
                            confidenceColors[metric.confidence]
                          )}
                        >
                          {metric.confidence}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-0.5">Source: {metric.source}</p>
                    </div>
                    <button
                      onClick={() => RealityStore.deleteMetric(workspaceId, metric.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-800 hover:text-red-400 transition-colors"
                      aria-label="Delete metric"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add metric form */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
              <p className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">Add Metric</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  value={newMetric.name}
                  onChange={(e) => setNewMetric((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Metric name"
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                />
                <input
                  type="number"
                  value={newMetric.value}
                  onChange={(e) => setNewMetric((p) => ({ ...p, value: e.target.value }))}
                  placeholder="Value"
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  value={newMetric.unit}
                  onChange={(e) => setNewMetric((p) => ({ ...p, unit: e.target.value }))}
                  placeholder="Unit (e.g. USD)"
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                />
                <select
                  value={newMetric.confidence}
                  onChange={(e) => setNewMetric((p) => ({ ...p, confidence: e.target.value as MetricConfidence }))}
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
                >
                  <option value="measured">Measured</option>
                  <option value="estimated">Estimated</option>
                  <option value="inferred">Inferred</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <select
                  value={newMetric.statementType}
                  onChange={(e) => setNewMetric((p) => ({ ...p, statementType: e.target.value as unknown as StatementType }))}
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
                >
                  <option value="fact">Fact</option>
                  <option value="assumption">Assumption</option>
                  <option value="inference">Inference</option>
                  <option value="recommendation">Recommendation</option>
                </select>
                <input
                  type="text"
                  value={newMetric.source}
                  onChange={(e) => setNewMetric((p) => ({ ...p, source: e.target.value }))}
                  placeholder="Source"
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                />
              </div>
              <button
                onClick={handleAddMetric}
                disabled={!newMetric.name || !newMetric.value}
                className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add Metric
              </button>
            </div>
          </div>
        );

      case "goals":
        return (
          <div className="space-y-4">
            {snapshot.goals.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-6 text-center">
                <Target className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No goals defined. Set your first target.</p>
              </div>
            ) : (
              snapshot.goals.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{goal.title}</p>
                        {goal.isPrimary && (
                          <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400 uppercase">
                            Primary
                          </span>
                        )}
                      </div>
                      {goal.description && (
                        <p className="text-xs text-zinc-500 mt-0.5">{goal.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => RealityStore.deleteGoal(workspaceId, goal.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-800 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {goal.targetMetrics.map((tm, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-500">{tm.name}:</span>
                        <span className="text-white font-medium">
                          {tm.targetValue}{tm.unit ?? ""}
                        </span>
                      </div>
                    ))}
                  </div>
                  {!goal.isPrimary && (
                    <button
                      onClick={() => RealityStore.updateGoal(workspaceId, goal.id, { isPrimary: true })}
                      className="mt-2 text-[10px] text-zinc-600 hover:text-white transition-colors"
                    >
                      Set as primary goal
                    </button>
                  )}
                </div>
              ))
            )}

            {/* Add goal form */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
              <p className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">Define Goal</p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Goal title"
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                />
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none resize-none"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newGoal.targetName}
                    onChange={(e) => setNewGoal((p) => ({ ...p, targetName: e.target.value }))}
                    placeholder="Target metric name"
                    className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={newGoal.targetValue}
                    onChange={(e) => setNewGoal((p) => ({ ...p, targetValue: e.target.value }))}
                    placeholder="Target value"
                    className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newGoal.targetUnit}
                    onChange={(e) => setNewGoal((p) => ({ ...p, targetUnit: e.target.value }))}
                    placeholder="Unit"
                    className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleAddGoal}
                  disabled={!newGoal.title || !newGoal.targetName || !newGoal.targetValue}
                  className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add Goal
                </button>
              </div>
            </div>
          </div>
        );

      case "gaps":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                {snapshot.gaps.length} gap{snapshot.gaps.length !== 1 ? "s" : ""} identified
              </p>
              <button
                onClick={handleCalculateGaps}
                className="flex items-center gap-1.5 rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Recalculate
              </button>
            </div>

            {snapshot.gaps.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500 mb-3">
                  No gaps calculated. Add metrics and a goal first, then calculate.
                </p>
                <button
                  onClick={handleCalculateGaps}
                  disabled={snapshot.goals.length === 0 || snapshot.metrics.length === 0}
                  className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mx-auto"
                >
                  <RefreshCw className="h-3 w-3" />
                  Calculate Gaps
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {snapshot.gaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{gap.title}</p>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium uppercase",
                              gapSeverityColors[gap.severity]
                            )}
                          >
                            {gap.severity}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{gap.description}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                        <span>{gap.currentValue}{gap.unit ?? ""} current</span>
                        <span>{gap.targetValue}{gap.unit ?? ""} target</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            gap.percentComplete >= 80
                              ? "bg-emerald-500"
                              : gap.percentComplete >= 50
                                ? "bg-amber-500"
                                : "bg-red-500"
                          )}
                          style={{ width: `${Math.min(gap.percentComplete, 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-1">
                        {gap.percentComplete}% complete · {gap.absoluteGap > 0 ? `${gap.absoluteGap}${gap.unit ?? ""} remaining` : "Target reached"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "evidence":
        return (
          <div className="space-y-4">
            <EvidenceSection workspaceId={workspaceId} evidence={snapshot.evidence} />
          </div>
        );

      case "constraints":
        return (
          <div className="space-y-4">
            <ConstraintsSection workspaceId={workspaceId} constraints={snapshot.constraints} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {renderTabContent()}
    </div>
  );
}

// ─── Evidence Section ──────────────────────────────────────────────────────

function EvidenceSection({
  workspaceId,
  evidence,
}: {
  workspaceId: string;
  evidence: RealitySnapshot["evidence"];
}) {
  const [newEvidence, setNewEvidence] = useState({ title: "", content: "", source: "" });

  const handleAdd = () => {
    if (!newEvidence.title || !newEvidence.content) return;
    RealityStore.addEvidence(workspaceId, {
      title: newEvidence.title,
      content: newEvidence.content,
      source: newEvidence.source || "Manual entry",
      collectedAt: new Date(),
    });
    setNewEvidence({ title: "", content: "", source: "" });
  };

  return (
    <>
      {evidence.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-6 text-center">
          <FileText className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">No evidence recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {evidence.map((ev, i) => (
            <div key={ev.id ?? i} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{ev.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{ev.content}</p>
                  <p className="text-[10px] text-zinc-600 mt-1">Source: {ev.source}</p>
                </div>
                <button
                  onClick={() => RealityStore.deleteEvidence(workspaceId, ev.id!)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-800 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <p className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">Add Evidence</p>
        <div className="space-y-2">
          <input
            type="text"
            value={newEvidence.title}
            onChange={(e) => setNewEvidence((p) => ({ ...p, title: e.target.value }))}
            placeholder="Evidence title"
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
          <textarea
            value={newEvidence.content}
            onChange={(e) => setNewEvidence((p) => ({ ...p, content: e.target.value }))}
            placeholder="Evidence content"
            rows={2}
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none resize-none"
          />
          <input
            type="text"
            value={newEvidence.source}
            onChange={(e) => setNewEvidence((p) => ({ ...p, source: e.target.value }))}
            placeholder="Source (optional)"
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={!newEvidence.title || !newEvidence.content}
            className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Evidence
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Constraints Section ───────────────────────────────────────────────────

function ConstraintsSection({
  workspaceId,
  constraints,
}: {
  workspaceId: string;
  constraints: RealitySnapshot["constraints"];
}) {
  const [newConstraint, setNewConstraint] = useState({ description: "", statementType: StatementType.FACT });

  const handleAdd = () => {
    if (!newConstraint.description) return;
    RealityStore.addConstraint(workspaceId, {
      description: newConstraint.description,
      active: true,
      statementType: newConstraint.statementType as StatementType,
    });
    setNewConstraint({ description: "", statementType: StatementType.FACT });
  };

  return (
    <>
      {constraints.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-6 text-center">
          <Shield className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">No constraints defined.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {constraints.map((c, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium uppercase",
                    statementTypeColors[c.statementType]
                  )}
                >
                  {c.statementType}
                </span>
                <p className="text-sm text-zinc-300">{c.description}</p>
              </div>
              <button
                onClick={() => RealityStore.removeConstraint(workspaceId, i)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-800 hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <p className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">Add Constraint</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newConstraint.description}
            onChange={(e) => setNewConstraint((p) => ({ ...p, description: e.target.value }))}
            placeholder="Describe the constraint"
            className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
          <select
            value={newConstraint.statementType}
            onChange={(e) => setNewConstraint((p) => ({ ...p, statementType: e.target.value as StatementType }))}
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
          >
            <option value={StatementType.FACT}>Fact</option>
            <option value={StatementType.ASSUMPTION}>Assumption</option>
            <option value={StatementType.INFERENCE}>Inference</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={!newConstraint.description}
            className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>
      </div>
    </>
  );
}
