/**
 * WorkspaceDashboard — Lists workspaces with tabbed views (Recent, Pinned, Archived).
 * This is the main content area for the /navigate route.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { WorkspaceCard } from "./WorkspaceCard";
import { WorkspaceStore } from "@/features/workspace/workspace.store";
import { WorkspaceWizard } from "./WorkspaceWizard";
import type { Workspace } from "@/kernel/contracts/Workspace";
import { WorkspaceStatus } from "@/kernel/contracts/Workspace";
import { cn } from "@/lib/utils";
import { Plus, Layers } from "lucide-react";

// ─── Tabs ──────────────────────────────────────────────────────────────────

type TabId = "recent" | "pinned" | "archived";

const TABS: { id: TabId; label: string }[] = [
  { id: "recent", label: "Recent" },
  { id: "pinned", label: "Pinned" },
  { id: "archived", label: "Archived" },
];

// ─── Component ─────────────────────────────────────────────────────────────

export function WorkspaceDashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("recent");
  const [showWizard, setShowWizard] = useState(false);

  const refresh = useCallback(() => {
    setWorkspaces([...WorkspaceStore.getAll()]);
  }, []);

  useEffect(() => {
    refresh();
    const unsub = WorkspaceStore.subscribe(refresh);
    return unsub;
  }, [refresh]);

  // ── Filtered lists ─────────────────────────────────────────────────────

  const pinned = workspaces.filter((w) => w.pinned);
  const active = workspaces.filter(
    (w) => w.status === WorkspaceStatus.ACTIVE || w.status === WorkspaceStatus.PAUSED
  );
  const archived = workspaces.filter((w) => w.status === WorkspaceStatus.ARCHIVED);

  // Most recent first
  const recent = [...active].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  const getDisplayList = (): Workspace[] => {
    switch (activeTab) {
      case "recent":
        return recent;
      case "pinned":
        return pinned;
      case "archived":
        return archived;
    }
  };

  const displayList = getDisplayList();

  // ── Empty state ────────────────────────────────────────────────────────

  if (workspaces.length === 0 && !showWizard) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 mb-5">
            <Layers className="h-8 w-8 text-zinc-600" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No workspaces yet</h2>
          <p className="text-sm text-zinc-500 mb-6 text-center max-w-sm">
            Create your first workspace to get started. Each workspace is a separate
            operating environment with its own mission, DNA, and tools.
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Workspace
          </button>
        </div>

        {showWizard && <WorkspaceWizard onClose={() => setShowWizard(false)} onCreated={refresh} />}
      </>
    );
  }

  // ── Dashboard view ─────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Workspaces</h2>
          <p className="text-sm text-zinc-500">
            {active.length} active · {archived.length} archived
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {displayList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-zinc-600 mb-2">
            {activeTab === "pinned"
              ? "No pinned workspaces"
              : activeTab === "archived"
                ? "No archived workspaces"
                : "No workspaces yet"}
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Create your first workspace
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayList.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} onUpdate={refresh} />
          ))}
        </div>
      )}

      {/* Wizard modal */}
      {showWizard && (
        <WorkspaceWizard onClose={() => setShowWizard(false)} onCreated={refresh} />
      )}
    </div>
  );
}
