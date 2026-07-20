/**
 * ExecutionStudio — Main container for the Execution Studio.
 *
 * Provides tabbed access to:
 * - Kanban Board (task workflow management)
 * - Timeline (milestone chronological view)
 * - Dashboard (health overview)
 *
 * Per ADR-0030, this is UI-named "Execution Studio" but remains at /execution route.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Columns3, Timeline as TimelineIcon, BarChart3, Plus, Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExecutionStore, type ExecutionPlan } from "../execution.store";
import { ExecutionBoard } from "./ExecutionBoard";
import { ExecutionTimeline } from "./ExecutionTimeline";
import { ExecutionDashboard } from "./ExecutionDashboard";
import { ExecutionStatus } from "@/kernel/contracts/ExecutionStatus";

// ─── Tab config ─────────────────────────────────────────────────────────

type Tab = "board" | "timeline" | "dashboard";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "board", label: "Kanban Board", icon: Columns3 },
  { id: "timeline", label: "Timeline", icon: TimelineIcon },
  { id: "dashboard", label: "Health Dashboard", icon: BarChart3 },
];

// ─── Props ──────────────────────────────────────────────────────────────

interface ExecutionStudioProps {
  workspaceId?: string;
}

// ─── Component ──────────────────────────────────────────────────────────

export function ExecutionStudio({ workspaceId }: ExecutionStudioProps) {
  const [activeTab, setActiveTab] = useState<Tab>("board");
  const [plans, setPlans] = useState<ExecutionPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");

  const refresh = useCallback(() => {
    setPlans(ExecutionStore.getPlans());
  }, []);

  useEffect(() => {
    refresh();
    const unsub = ExecutionStore.subscribe(refresh);
    return unsub;
  }, [refresh]);

  // Auto-select first plan
  useEffect(() => {
    if (!activePlanId && plans.length > 0) {
      setActivePlanId(plans[0].id);
    }
  }, [plans, activePlanId]);

  const handleCreatePlan = () => {
    if (!newPlanTitle.trim()) return;
    const plan = ExecutionStore.createPlan({
      title: newPlanTitle.trim(),
      description: newPlanDescription.trim(),
      milestoneIds: [],
      status: ExecutionStatus.PLANNED,
      trace: { sourceId: workspaceId || "default", sourceType: "reality" as any },
    });
    setActivePlanId(plan.id);
    setNewPlanTitle("");
    setNewPlanDescription("");
    setShowCreatePlan(false);
  };

  const activePlan = plans.find((p) => p.id === activePlanId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Execution Studio</h1>
          <p className="text-xs text-zinc-600 mt-0.5">Plan, track, and execute work</p>
        </div>
        <button
          onClick={() => setShowCreatePlan(!showCreatePlan)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Plan
        </button>
      </div>

      {/* Create plan form */}
      {showCreatePlan && (
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4 space-y-3">
          <input
            value={newPlanTitle}
            onChange={(e) => setNewPlanTitle(e.target.value)}
            placeholder="Execution plan title..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500"
            onKeyDown={(e) => e.key === "Enter" && handleCreatePlan()}
          />
          <input
            value={newPlanDescription}
            onChange={(e) => setNewPlanDescription(e.target.value)}
            placeholder="Description (optional)..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreatePlan}
              className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-white transition-colors"
            >
              Create Plan
            </button>
            <button
              onClick={() => setShowCreatePlan(false)}
              className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Plan selector */}
      {plans.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setActivePlanId(plan.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors whitespace-nowrap",
                activePlanId === plan.id
                  ? "bg-zinc-800 text-white border border-zinc-700"
                  : "bg-[#1a1a1a] text-zinc-500 border border-zinc-800 hover:text-zinc-300 hover:border-zinc-700"
              )}
            >
              <Play className="w-3 h-3" />
              <span>{plan.title}</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full",
                plan.status === ExecutionStatus.COMPLETED ? "bg-emerald-500/10 text-emerald-400" :
                plan.status === ExecutionStatus.IN_PROGRESS ? "bg-amber-500/10 text-amber-400" :
                "bg-zinc-800 text-zinc-600"
              )}>
                {plan.status.replace("_", " ")}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {plans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-700">
          <Play className="w-12 h-12 mb-4" />
          <p className="text-sm mb-1">No execution plans yet</p>
          <p className="text-xs mb-6">Create a plan to start tracking tasks and milestones</p>
          <button
            onClick={() => setShowCreatePlan(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Plan
          </button>
        </div>
      )}

      {/* Tabs and content */}
      {activePlan && (
        <>
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
            {activeTab === "board" && <ExecutionBoard executionPlanId={activePlan.id} />}
            {activeTab === "timeline" && <ExecutionTimeline executionPlanId={activePlan.id} />}
            {activeTab === "dashboard" && <ExecutionDashboard executionPlanId={activePlan.id} />}
          </div>
        </>
      )}
    </div>
  );
}
