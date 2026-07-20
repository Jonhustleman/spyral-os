/**
 * WorkspaceCard — Reusable card component for a single workspace.
 * Displays type, name, description, status, and last-updated time.
 */

"use client";

import { useRouter } from "next/navigation";
import type { Workspace } from "@/kernel/contracts/Workspace";
import { WorkspaceStatus } from "@/kernel/contracts/Workspace";
import { WorkspaceRegistry } from "@/features/workspace/WorkspaceRegistry";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Megaphone,
  FileText,
  TrendingUp,
  FlaskRoundIcon as Flask,
  Target,
  MoreHorizontal,
  Pin,
  PinOff,
  Archive,
  Trash2,
  Play,
  Pause,
} from "lucide-react";
import { useState } from "react";

// ─── Icon map ──────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Briefcase,
  Megaphone,
  FileText,
  TrendingUp,
  Flask,
  Target,
};

function getIcon(type: string) {
  const info = WorkspaceRegistry.get(type);
  if (info && info.icon in ICON_MAP) {
    return ICON_MAP[info.icon];
  }
  return Briefcase;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusLabel(status: WorkspaceStatus): string {
  switch (status) {
    case WorkspaceStatus.ACTIVE:
      return "Active";
    case WorkspaceStatus.PAUSED:
      return "Paused";
    case WorkspaceStatus.ARCHIVED:
      return "Archived";
  }
}

function statusColor(status: WorkspaceStatus): string {
  switch (status) {
    case WorkspaceStatus.ACTIVE:
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case WorkspaceStatus.PAUSED:
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case WorkspaceStatus.ARCHIVED:
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
}

// ─── Props ─────────────────────────────────────────────────────────────────

interface WorkspaceCardProps {
  workspace: Workspace;
  onUpdate?: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function WorkspaceCard({ workspace, onUpdate }: WorkspaceCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const Icon = getIcon(workspace.type);
  const typeInfo = WorkspaceRegistry.get(workspace.type);

  const handleAction = async (action: string) => {
    setMenuOpen(false);
    const { WorkspaceStore } = await import("@/features/workspace/workspace.store");

    switch (action) {
      case "pin":
        WorkspaceStore.togglePin(workspace.id);
        break;
      case "archive":
        WorkspaceStore.archive(workspace.id);
        break;
      case "delete":
        WorkspaceStore.delete(workspace.id);
        break;
      case "activate":
        WorkspaceStore.update(workspace.id, { status: WorkspaceStatus.ACTIVE });
        break;
      case "pause":
        WorkspaceStore.update(workspace.id, { status: WorkspaceStatus.PAUSED });
        break;
    }
    onUpdate?.();
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-5",
        "hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-200",
        "cursor-pointer"
      )}
      onClick={() => router.push(`/navigate/${workspace.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/navigate/${workspace.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
            <Icon className="h-5 w-5 text-zinc-400" />
          </div>
          <div>
            <h3 className="font-medium text-sm text-white">{workspace.name}</h3>
            <p className="text-xs text-zinc-500">{typeInfo?.label ?? workspace.type}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-zinc-800 transition-all"
            aria-label="Workspace actions"
          >
            <MoreHorizontal className="h-4 w-4 text-zinc-400" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-xl">
                <button
                  onClick={(e) => { e.stopPropagation(); handleAction("pin"); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  {workspace.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  {workspace.pinned ? "Unpin" : "Pin to top"}
                </button>
                {workspace.status === WorkspaceStatus.ACTIVE && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAction("pause"); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    Pause
                  </button>
                )}
                {workspace.status === WorkspaceStatus.PAUSED && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAction("activate"); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Activate
                  </button>
                )}
                <div className="mx-2 my-1 border-t border-zinc-800" />
                <button
                  onClick={(e) => { e.stopPropagation(); handleAction("archive"); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleAction("delete"); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-zinc-800"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mb-4 line-clamp-2 text-xs text-zinc-500">
        {workspace.description || "No description"}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
            statusColor(workspace.status)
          )}
        >
          {statusLabel(workspace.status)}
        </span>
        <span className="text-[10px] text-zinc-600">
          Updated {timeAgo(workspace.updatedAt)}
        </span>
      </div>
    </div>
  );
}
