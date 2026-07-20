/**
 * ExecutionDashboard — Health overview for an Execution Plan.
 *
 * Shows velocity, blockers, completion percentage, risk level, and forecast.
 * Provides a bird's-eye view of execution health.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, AlertCircle, CheckCircle2, Clock, TrendingUp, Gauge, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExecutionStore, type ExecutionPlan } from "../execution.store";
import { ExecutionStatus } from "@/kernel/contracts/ExecutionStatus";

// ─── Props ──────────────────────────────────────────────────────────────

interface ExecutionDashboardProps {
  executionPlanId: string;
}

// ─── Stat card ──────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", color)} />
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <div>
        <div className="text-lg font-semibold text-white">{value}</div>
        {sub && <div className="text-[10px] text-zinc-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────

export function ExecutionDashboard({ executionPlanId }: ExecutionDashboardProps) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [latestReport, setLatestReport] = useState<any>(null);

  const refresh = useCallback(() => {
    const data = ExecutionStore.getDashboardData(executionPlanId);
    setDashboardData(data);
    const reports = ExecutionStore.getReportsByPlan(executionPlanId);
    setLatestReport(reports[reports.length - 1] || null);
  }, [executionPlanId]);

  useEffect(() => {
    refresh();
    const unsub = ExecutionStore.subscribe(refresh);
    return unsub;
  }, [refresh]);

  const handleGenerateReport = () => {
    ExecutionStore.generateReport(executionPlanId);
  };

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-700">
        <BarChart3 className="w-8 h-8 mb-3" />
        <p className="text-sm">No execution plan data available.</p>
      </div>
    );
  }

  const { plan, milestones, tasks, statusCounts, totalEffort, completedEffort, completionPercent } = dashboardData;

  const riskLevel = statusCounts.blocked > 0 ? "high" : completionPercent < 25 ? "medium" : "low";
  const riskColor = riskLevel === "low" ? "text-emerald-400" : riskLevel === "medium" ? "text-amber-400" : "text-red-400";
  const totalTasks = tasks.length;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={statusCounts.completed}
          sub={totalTasks > 0 ? `${Math.round((statusCounts.completed / totalTasks) * 100)}% of total` : undefined}
          color="text-emerald-400"
        />
        <StatCard
          icon={Clock}
          label="In Progress"
          value={statusCounts.inProgress}
          sub={totalTasks > 0 ? `${Math.round((statusCounts.inProgress / totalTasks) * 100)}% active` : undefined}
          color="text-amber-400"
        />
        <StatCard
          icon={AlertCircle}
          label="Blocked"
          value={statusCounts.blocked}
          sub={statusCounts.blocked > 0 ? `${Math.round((statusCounts.blocked / totalTasks) * 100)}% of tasks` : "No blockers"}
          color={statusCounts.blocked > 0 ? "text-red-400" : "text-zinc-500"}
        />
        <StatCard
          icon={Gauge}
          label="Risk"
          value={riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
          sub={riskLevel === "low" ? "On track" : riskLevel === "medium" ? "Needs attention" : "Blockers detected"}
          color={riskColor}
        />
      </div>

      {/* Progress bar */}
      <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-300">Overall Progress</span>
          </div>
          <span className="text-sm text-zinc-400">{completionPercent}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              completionPercent >= 80 ? "bg-emerald-500" :
              completionPercent >= 40 ? "bg-amber-500" :
              "bg-red-500"
            )}
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-700">
          <span>{completedEffort.toFixed(1)}h completed</span>
          <span>{totalEffort.toFixed(1)}h estimated total</span>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-medium text-zinc-300">Status Breakdown</h3>
        <div className="grid grid-cols-8 gap-2">
          {[
            { key: "planned", label: "Planned", color: "bg-zinc-600" },
            { key: "approved", label: "Approved", color: "bg-blue-500" },
            { key: "ready", label: "Ready", color: "bg-emerald-500" },
            { key: "inProgress", label: "In Progress", color: "bg-amber-500" },
            { key: "blocked", label: "Blocked", color: "bg-red-500" },
            { key: "completed", label: "Done", color: "bg-emerald-400" },
            { key: "cancelled", label: "Cancelled", color: "bg-zinc-700" },
            { key: "failed", label: "Failed", color: "bg-red-700" },
          ].map(({ key, label, color }) => {
            const count = (statusCounts as any)[key] || 0;
            const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
            return (
              <div key={key} className="text-center">
                <div className="text-xs font-medium text-zinc-300">{count}</div>
                <div className="mt-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 text-[10px] text-zinc-600">{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestone health */}
      {milestones.length > 0 && (
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Milestone Health</h3>
          <div className="space-y-2">
            {milestones.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  m.health === "on_track" ? "bg-emerald-500" :
                  m.health === "at_risk" ? "bg-amber-500" : "bg-red-500"
                )} />
                <span className="flex-1 text-xs text-zinc-300">{m.title}</span>
                <span className="text-xs text-zinc-600">{m.completionPercent}%</span>
                <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      m.health === "on_track" ? "bg-emerald-500" :
                      m.health === "at_risk" ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${m.completionPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest report */}
      {latestReport && (
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-300">Latest Report</h3>
            <span className="text-[10px] text-zinc-600">
              {new Date(latestReport.generatedAt).toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-zinc-600">Velocity: </span>
              <span className="text-zinc-300">{latestReport.velocity || "N/A"}</span>
            </div>
            <div>
              <span className="text-zinc-600">Forecast: </span>
              <span className="text-zinc-300">{latestReport.forecast || "N/A"}</span>
            </div>
            <div>
              <span className="text-zinc-600">Risk: </span>
              <span className={cn(latestReport.risk === "low" ? "text-emerald-400" : latestReport.risk === "medium" ? "text-amber-400" : "text-red-400")}>
                {latestReport.risk}
              </span>
            </div>
          </div>
          {latestReport.blockers.length > 0 && (
            <div className="text-xs text-zinc-600">
              <span>Blockers: </span>
              <span className="text-red-400">{latestReport.blockers.join(", ")}</span>
            </div>
          )}
        </div>
      )}

      {/* Generate report button */}
      <div className="flex justify-end">
        <button
          onClick={handleGenerateReport}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Generate Report
        </button>
      </div>
    </div>
  );
}
