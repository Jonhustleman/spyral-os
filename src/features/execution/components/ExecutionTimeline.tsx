/**
 * ExecutionTimeline — Chronological milestone view for an Execution Plan.
 *
 * Shows milestones ordered chronologically with their tasks,
 * completion percentage, health status, and blockers.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, Clock, Ban, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExecutionStore, type Milestone, type Task } from "../execution.store";
import { ExecutionStatus } from "@/kernel/contracts/ExecutionStatus";

// ─── Props ──────────────────────────────────────────────────────────────

interface ExecutionTimelineProps {
  executionPlanId: string;
}

// ─── Status colors ──────────────────────────────────────────────────────

const healthColor = (health: string) => {
  switch (health) {
    case "on_track": return "text-emerald-400";
    case "at_risk": return "text-amber-400";
    case "critical": return "text-red-400";
    default: return "text-zinc-500";
  }
};

const statusIcon = (status: ExecutionStatus) => {
  switch (status) {
    case ExecutionStatus.COMPLETED: return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
    case ExecutionStatus.IN_PROGRESS: return <Clock className="w-3 h-3 text-amber-400" />;
    case ExecutionStatus.BLOCKED: return <AlertCircle className="w-3 h-3 text-red-400" />;
    case ExecutionStatus.CANCELLED: return <Ban className="w-3 h-3 text-zinc-600" />;
    case ExecutionStatus.FAILED: return <XCircle className="w-3 h-3 text-red-500" />;
    default: return <Clock className="w-3 h-3 text-zinc-600" />;
  }
};

// ─── Component ──────────────────────────────────────────────────────────

export function ExecutionTimeline({ executionPlanId }: ExecutionTimelineProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasksByMilestone, setTasksByMilestone] = useState<Record<string, Task[]>>({});
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [showNewMilestone, setShowNewMilestone] = useState(false);

  const refresh = useCallback(() => {
    const ms = ExecutionStore.getMilestonesByPlan(executionPlanId);
    setMilestones(ms);
    const taskMap: Record<string, Task[]> = {};
    for (const m of ms) {
      taskMap[m.id] = ExecutionStore.getTasksByMilestone(m.id);
    }
    setTasksByMilestone(taskMap);
  }, [executionPlanId]);

  useEffect(() => {
    refresh();
    const unsub = ExecutionStore.subscribe(refresh);
    return unsub;
  }, [refresh]);

  const toggleMilestone = (id: string) => {
    setExpandedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    ExecutionStore.createMilestone({
      title: newMilestoneTitle.trim(),
      description: "",
      executionPlanId,
      workItemIds: [],
      status: ExecutionStatus.PLANNED,
      completionPercent: 0,
      predictedCompletion: undefined,
      blockers: [],
      health: "on_track",
      trace: { sourceId: executionPlanId, sourceType: "execution" as any },
    });
    setNewMilestoneTitle("");
    setShowNewMilestone(false);
  };

  const handleDeleteMilestone = (id: string) => {
    ExecutionStore.deleteMilestone(id);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-300">Timeline</h3>
        <button
          onClick={() => setShowNewMilestone(!showNewMilestone)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Milestone
        </button>
      </div>

      {/* New milestone form */}
      {showNewMilestone && (
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4 space-y-3">
          <input
            value={newMilestoneTitle}
            onChange={(e) => setNewMilestoneTitle(e.target.value)}
            placeholder="Milestone title..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500"
            onKeyDown={(e) => e.key === "Enter" && handleCreateMilestone()}
          />
          <button
            onClick={handleCreateMilestone}
            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-white transition-colors"
          >
            Create Milestone
          </button>
        </div>
      )}

      {/* Timeline */}
      {milestones.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-700">
          <Clock className="w-8 h-8 mb-3" />
          <p className="text-sm">No milestones yet. Create one to get started.</p>
        </div>
      )}

      <div className="space-y-2">
        {milestones.map((milestone, index) => {
          const tasks = tasksByMilestone[milestone.id] || [];
          const isExpanded = expandedMilestones.has(milestone.id);
          const completedTasks = tasks.filter((t) => t.status === ExecutionStatus.COMPLETED).length;
          const totalTasks = tasks.length;

          return (
            <div key={milestone.id} className="bg-[#1a1a1a] border border-zinc-800 rounded-xl overflow-hidden">
              {/* Milestone header */}
              <button
                onClick={() => toggleMilestone(milestone.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left"
              >
                {/* Timeline dot */}
                <div className="relative flex items-center justify-center">
                  <div className={cn(
                    "w-3 h-3 rounded-full border-2",
                    milestone.health === "on_track" ? "border-emerald-500 bg-emerald-500/20" :
                    milestone.health === "at_risk" ? "border-amber-500 bg-amber-500/20" :
                    "border-red-500 bg-red-500/20"
                  )} />
                  {index < milestones.length - 1 && (
                    <div className="absolute top-4 w-0.5 h-8 bg-zinc-800" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200">{milestone.title}</span>
                    <span className={cn("text-xs", healthColor(milestone.health))}>
                      {milestone.health.replace("_", " ")}
                    </span>
                  </div>
                  {totalTasks > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 max-w-[200px] h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            milestone.completionPercent >= 80 ? "bg-emerald-500" :
                            milestone.completionPercent >= 40 ? "bg-amber-500" :
                            "bg-red-500"
                          )}
                          style={{ width: `${milestone.completionPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-600">{milestone.completionPercent}%</span>
                      <span className="text-[10px] text-zinc-700">{completedTasks}/{totalTasks} tasks</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {milestone.blockers.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-red-400">
                      <AlertCircle className="w-3 h-3" />
                      {milestone.blockers.length}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteMilestone(milestone.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-zinc-600 hover:text-red-400" />
                  </button>
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-zinc-600" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />}
                </div>
              </button>

              {/* Task list */}
              {isExpanded && (
                <div className="border-t border-zinc-800">
                  {tasks.length === 0 && (
                    <div className="px-4 py-6 text-center">
                      <p className="text-xs text-zinc-700">No tasks in this milestone.</p>
                    </div>
                  )}
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30">
                      {statusIcon(task.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-300">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-zinc-600">{task.status.replace("_", " ")}</span>
                          {task.owner && <span className="text-[10px] text-zinc-700">• {task.owner}</span>}
                          {task.estimate > 0 && <span className="text-[10px] text-zinc-700">• {task.estimate}h</span>}
                        </div>
                      </div>
                      {task.dependencies.length > 0 && (
                        <span className="text-[10px] text-zinc-700">{task.dependencies.length} dep{task.dependencies.length > 1 ? "s" : ""}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
