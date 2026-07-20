/**
 * Decision Studio — The main page for Sprint 5.
 *
 * Renders the DecisionBoard for the selected workspace.
 */

"use client";

import { useState, useEffect } from "react";
import { WorkspaceStore } from "@/features/workspace";
import { DecisionBoard } from "@/features/decisions";
import type { Workspace } from "@/kernel/contracts/Workspace";

export default function DecisionStudioPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    const active = WorkspaceStore.getActive();
    setWorkspaces(active);
    if (active.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(active[0].id);
    }
  }, [selectedWorkspaceId]);

  return (
    <div className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Decision Studio</h1>
        <p className="text-sm text-zinc-500">
          Map choices, compare options, and build a decision graph.
        </p>
      </div>

      {selectedWorkspaceId ? (
        <DecisionBoard workspaceId={selectedWorkspaceId} />
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <p className="text-sm text-zinc-500">Create a workspace first to start making decisions.</p>
        </div>
      )}
    </div>
  );
}
