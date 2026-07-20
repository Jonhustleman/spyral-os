/**
 * WorkspaceSwitcher — Dropdown in the header/sidebar for fast workspace switching.
 *
 * Stretch goal for Sprint 2.
 * Shows current workspace, allows quick switching between all active workspaces,
 * and provides a shortcut to create a new workspace.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceStore } from "@/features/workspace/workspace.store";
import { WorkspaceRegistry } from "@/features/workspace/WorkspaceRegistry";
import type { Workspace } from "@/kernel/contracts/Workspace";
import { cn } from "@/lib/utils";
import {
  ChevronsUpDown,
  Plus,
  Check,
  Briefcase,
  Megaphone,
  FileText,
  TrendingUp,
  FlaskRoundIcon as Flask,
  Target,
} from "lucide-react";

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
    const Icon = ICON_MAP[info.icon];
    return <Icon className="h-4 w-4" />;
  }
  return <Briefcase className="h-4 w-4" />;
}

// ─── Props ─────────────────────────────────────────────────────────────────

interface WorkspaceSwitcherProps {
  currentWorkspaceId?: string;
  onCreateNew?: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function WorkspaceSwitcher({
  currentWorkspaceId,
  onCreateNew,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWorkspaces(WorkspaceStore.getActive());
    const unsub = WorkspaceStore.subscribe(() => {
      setWorkspaces(WorkspaceStore.getActive());
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = currentWorkspaceId
    ? workspaces.find((w) => w.id === currentWorkspaceId)
    : null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-left transition-colors",
          "hover:border-zinc-700 hover:bg-zinc-800/50"
        )}
      >
        {current ? (
          <>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-400">
              {getIcon(current.type)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-white">
              {current.name}
            </span>
          </>
        ) : (
          <span className="text-sm text-zinc-500">Select workspace</span>
        )}
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-zinc-500" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-zinc-800 bg-zinc-950 py-1 shadow-2xl">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => {
                setOpen(false);
                router.push(`/navigate/${ws.id}`);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
                ws.id === currentWorkspaceId
                  ? "bg-zinc-800/50 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/30 hover:text-white"
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-400">
                {getIcon(ws.type)}
              </span>
              <span className="min-w-0 flex-1 truncate">{ws.name}</span>
              {ws.id === currentWorkspaceId && (
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              )}
            </button>
          ))}

          <div className="mx-2 my-1 border-t border-zinc-800" />

          <button
            onClick={() => {
              setOpen(false);
              onCreateNew?.();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800/30 hover:text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create workspace
          </button>
        </div>
      )}
    </div>
  );
}
