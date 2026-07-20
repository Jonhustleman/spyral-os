/**
 * Workspace Detail Page — Individual workspace view.
 * Shows workspace info, DNA profile, and future feature integrations.
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { WorkspaceStore, WorkspaceRegistry } from "@/features/workspace";
import type { Workspace } from "@/kernel/contracts/Workspace";
import { WorkspaceStatus } from "@/kernel/contracts/Workspace";
import { ArrowLeft, Layers, Briefcase, Command, Compass, Navigation, BookOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { CapabilityRegistry } from "@/features/capabilities";
import { getCapabilityIcon } from "@/features/capabilities/icon-map";

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [notFound, setNotFound] = useState(false);

  const id = params.id as string;

  useEffect(() => {
    const ws = WorkspaceStore.getById(id);
    if (ws) {
      setWorkspace(ws);
    } else {
      setNotFound(true);
    }

    const unsub = WorkspaceStore.subscribe(() => {
      const updated = WorkspaceStore.getById(id);
      setWorkspace(updated ?? null);
      if (!updated) setNotFound(true);
    });

    return unsub;
  }, [id]);

  if (notFound) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 mb-5">
          <Layers className="h-8 w-8 text-zinc-600" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Workspace not found</h2>
        <p className="text-sm text-zinc-500 mb-6">This workspace may have been deleted.</p>
        <button
          onClick={() => router.push("/navigate")}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to workspaces
        </button>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  const typeInfo = WorkspaceRegistry.get(workspace.type);
  const statusColors: Record<WorkspaceStatus, string> = {
    [WorkspaceStatus.ACTIVE]: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    [WorkspaceStatus.PAUSED]: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    [WorkspaceStatus.ARCHIVED]: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };

  return (
    <div className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
      {/* Back link */}
      <button
        onClick={() => router.push("/navigate")}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to workspaces
      </button>

      {/* Workspace header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800">
            <Briefcase className="h-7 w-7 text-zinc-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{workspace.name}</h1>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                  statusColors[workspace.status]
                )}
              >
                {workspace.status}
              </span>
            </div>
            <p className="text-sm text-zinc-500 mt-0.5">
              {typeInfo?.label ?? workspace.type}
            </p>
          </div>
        </div>
        {workspace.description && (
          <p className="text-sm text-zinc-400 max-w-xl">{workspace.description}</p>
        )}
      </div>

      {/* Enabled Capabilities */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
        <h3 className="text-sm font-medium text-white mb-4">Enabled Capabilities</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {CapabilityRegistry.getByCategory("core").map((cap) => {
            const Icon = getCapabilityIcon(cap.icon);
            return (
              <button
                key={cap.id}
                onClick={() => router.push(cap.routes[0] ?? "/")}
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-left hover:border-zinc-700 hover:bg-zinc-900/80 transition-all"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-800">
                  <Icon className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{cap.manifest.title}</p>
                  <p className="text-[11px] text-zinc-500 truncate">{cap.manifest.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* DNA Profile */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
        <h3 className="text-sm font-medium text-white mb-4">DNA Profile</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Industry</p>
            <p className="text-zinc-300">{workspace.dna.industry}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Mission</p>
            <p className="text-zinc-300">{workspace.dna.mission}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Horizon</p>
            <p className="text-zinc-300 capitalize">{workspace.dna.planningHorizon}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Risk</p>
            <p className="text-zinc-300 capitalize">{workspace.dna.riskAppetite}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Growth</p>
            <p className="text-zinc-300 capitalize">{workspace.dna.growthStyle}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Goal</p>
            <p className="text-zinc-300">{workspace.goal}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Success Metric</p>
            <p className="text-zinc-300">{workspace.dna.successMetric}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
