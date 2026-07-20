/**
 * ExecutionBoard — Kanban-style board for managing execution tasks.
 *
 * Columns: Planned → Approved → Ready → In Progress → Blocked → Completed
 * Supports creating, moving, and deleting tasks.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, GripVertical, Clock, CheckCircle2, AlertCircle, Play, Ban, XCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExecutionStore, type Task } from "../execution.store";
import { ExecutionStatus } from "@/kernel/contracts/ExecutionStatus";

// ─── Status column config ───────────────────────────────────────────────

const COLUMNS = [
  { status: ExecutionStatus.PLANNED, label: "Planned", icon: Clock, color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/30" },
  { status: ExecutionStatus.APPROVED, label: "Approved", icon: CheckCircle2, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  { status: ExecutionStatus.READY, label: "Ready", icon: Play, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { status: ExecutionStatus.IN_PROGRESS, label: "In Progress", icon: ArrowRight, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { status: ExecutionStatus.BLOCKED, label: "Blocked", icon: AlertCircle, color: "text-red-400 bg-red-500/10 border-red-500/30" },
  { status: ExecutionStatus.COMPLETED, label: "Completed", icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
];

// ─── Props ──────────────────────────────────────────────────────────────

interface ExecutionBoardProps {
  executionPlanId: string;
}

// ─── Component ──────────────────────────────────────────────────────────

export function ExecutionBoard({ executionPlanId }: ExecutionBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestoneFilter, setMilestoneFilter] = useState<string>("all");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState<ExecutionStatus>(ExecutionStatus.PLANNED);
  const [showNewTask, setShowNewTask] = useState(false);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const milestones = ExecutionStore.getMilestonesByPlan(executionPlanId);
    const allTasks = milestones.flatMap((m) => ExecutionStore.getTasksByMilestone(m.id));
    setTasks(allTasks);
  }, [executionPlanId]);

  useEffect(() => {
    refresh();
    const unsub = ExecutionStore.subscribe(refresh);
    return unsub;
  }, [refresh]);

  const milestones = ExecutionStore.getMilestonesByPlan(executionPlanId);

  const filteredTasks = milestoneFilter === "all"
    ? tasks
    : tasks.filter((t) => t.workItemId === milestoneFilter);

  const getTasksByStatus = (status: ExecutionStatus) =>
    filteredTasks.filter((t) => t.status === status);

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    const targetMilestone = milestoneFilter !== "all"
      ? milestones.find((m) => m.id === milestoneFilter)
      : milestones[0];
    if (!targetMilestone) return;

    ExecutionStore.createTask({
      title: newTaskTitle.trim(),
      description: "",
      workItemId: targetMilestone.id,
      status: newTaskStatus,
      owner: "",
      priority: "medium",
      estimate: 0,
      dependencies: [],
      evidence: [],
      trace: { sourceId: executionPlanId, sourceType: "execution" as any },
    });
    setNewTaskTitle("");
    setShowNewTask(false);
  };

  const handleStatusChange = (taskId: string, newStatus: ExecutionStatus) => {
    ExecutionStore.updateTask(taskId, { status: newStatus });
  };

  const handleDelete = (taskId: string) => {
    ExecutionStore.deleteTask(taskId);
  };

  const getNextStatuses = (status: ExecutionStatus): ExecutionStatus[] => {
    switch (status) {
      case ExecutionStatus.PLANNED: return [ExecutionStatus.APPROVED, ExecutionStatus.CANCELLED];
      case ExecutionStatus.APPROVED: return [ExecutionStatus.READY, ExecutionStatus.CANCELLED];
      case ExecutionStatus.READY: return [ExecutionStatus.IN_PROGRESS, ExecutionStatus.CANCELLED];
      case ExecutionStatus.IN_PROGRESS: return [ExecutionStatus.BLOCKED, ExecutionStatus.COMPLETED, ExecutionStatus.FAILED];
      case ExecutionStatus.BLOCKED: return [ExecutionStatus.IN_PROGRESS];
      default: return [];
    }
  };

  const statusIcon = (status: ExecutionStatus) => {
    const config = COLUMNS.find((c) => c.status === status);
    if (!config) return null;
    const Icon = config.icon;
    return <Icon className="w-3 h-3" />;
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-red-400";
      case "high": return "text-amber-400";
      case "medium": return "text-blue-400";
      case "low": return "text-zinc-500";
      default: return "text-zinc-500";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={milestoneFilter}
            onChange={(e) => setMilestoneFilter(e.target.value)}
            className="bg-[#1a1a1a] border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300"
          >
            <option value="all">All Milestones</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowNewTask(!showNewTask)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </button>
      </div>

      {/* New task form */}
      {showNewTask && (
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-4 space-y-3">
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500"
            onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
          />
          <div className="flex items-center gap-2">
            <select
              value={newTaskStatus}
              onChange={(e) => setNewTaskStatus(e.target.value as ExecutionStatus)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300"
            >
              {COLUMNS.filter((c) => c.status !== ExecutionStatus.COMPLETED && c.status !== ExecutionStatus.BLOCKED).map((col) => (
                <option key={col.status} value={col.status}>{col.label}</option>
              ))}
            </select>
            {milestoneFilter === "all" && milestones.length > 0 && (
              <select
                value={milestones[0]?.id || ""}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300"
              >
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            )}
            <button
              onClick={handleCreateTask}
              className="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-white transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div className="grid grid-cols-6 gap-3">
        {COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.status);
          const Icon = column.icon;

          return (
            <div
              key={column.status}
              className="bg-[#1a1a1a] border border-zinc-800 rounded-xl overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedTask) {
                  handleStatusChange(draggedTask, column.status);
                  setDraggedTask(null);
                }
              }}
            >
              {/* Column header */}
              <div className={cn("px-3 py-2 border-b", column.color.replace("text-", "border-").split(" ")[1] || "border-zinc-800")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className={cn("w-3.5 h-3.5", column.color.split(" ")[0])} />
                    <span className="text-xs font-medium text-zinc-300">{column.label}</span>
                  </div>
                  <span className="text-xs text-zinc-600">{columnTasks.length}</span>
                </div>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 min-h-[120px]">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggedTask(task.id)}
                    className="group bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 cursor-grab active:cursor-grabbing hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-zinc-200 leading-relaxed line-clamp-2">{task.title}</p>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <Trash2 className="w-3 h-3 text-zinc-600 hover:text-red-400" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("text-[10px] uppercase font-medium", priorityColor(task.priority))}>
                        {task.priority}
                      </span>
                      {task.estimate > 0 && (
                        <span className="text-[10px] text-zinc-600">{task.estimate}h</span>
                      )}
                    </div>
                    {/* Quick actions */}
                    <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {getNextStatuses(task.status).map((nextStatus) => (
                        <button
                          key={nextStatus}
                          onClick={() => handleStatusChange(task.id, nextStatus)}
                          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                          title={`Move to ${nextStatus}`}
                        >
                          {statusIcon(nextStatus)}
                          <span>{nextStatus.replace("_", " ")}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-[10px] text-zinc-700 italic">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
