"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WorkspaceStore } from "@/features/workspace";
import { RealityStore } from "@/features/reality";
import { NavigationStore } from "@/features/navigation";
import type { Workspace } from "@/kernel/contracts/Workspace";
import {
  Zap,
  Play,
  Clock,
  BarChart3,
  Brain,
  FileText,
  Sparkles,
  TrendingUp,
  Activity,
  Settings,
  ArrowRight,
  Plus,
  Home,
} from "lucide-react";

export default function CommandCenterPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    const active = WorkspaceStore.getActive();
    setWorkspaces(active);
    if (active.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(active[0].id);
    }
  }, [selectedWorkspaceId]);

  const ws = selectedWorkspaceId ? WorkspaceStore.getById(selectedWorkspaceId) : null;
  const hasReport = ws ? RealityStore.hasReport(ws.id) : false;
  const report = ws ? RealityStore.getReport(ws.id) : null;
  const navSessions = NavigationStore.getAll();
  const activeSessions = NavigationStore.getActiveSessions();
  const recentSessions = NavigationStore.getRecentDestinations();

  return (
    <div className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Command Center</h1>
          <p className="text-sm text-zinc-500">
            System overview — active realities, running plans, and intelligence
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-sm"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
      </div>

      {/* Quick Launch Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Link
          href="/content"
          className="flex items-center gap-2 p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/40 transition-all"
        >
          <Sparkles className="h-5 w-5 text-purple-400" />
          <span className="text-sm font-medium text-white">Create Content</span>
        </Link>
        <Link
          href="/research"
          className="flex items-center gap-2 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/40 transition-all"
        >
          <FileText className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-medium text-white">Research</span>
        </Link>
        <Link
          href="/navigate"
          className="flex items-center gap-2 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all"
        >
          <Zap className="h-5 w-5 text-amber-400" />
          <span className="text-sm font-medium text-white">Navigate</span>
        </Link>
        <Link
          href="/consultant"
          className="flex items-center gap-2 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all"
        >
          <Brain className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-medium text-white">Consultant</span>
        </Link>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">System Status</p>
              <p className="text-lg font-semibold text-emerald-400">Operational</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Active Realities</p>
              <p className="text-lg font-semibold text-white">{workspaces.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Play className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Running Plans</p>
              <p className="text-lg font-semibold text-white">{activeSessions.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Brain className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Intelligence Records</p>
              <p className="text-lg font-semibold text-white">—</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Active Realities & Running Plans */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Realities */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Active Realities
              </h2>
            </div>
            <div className="p-5">
              {workspaces.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-zinc-500">No realities yet</p>
                  <Link
                    href="/navigate"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Create one <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {workspaces.map((w) => (
                    <div
                      key={w.id}
                      className={`rounded-lg p-4 border transition-colors ${
                        selectedWorkspaceId === w.id
                          ? "bg-zinc-800/50 border-zinc-700"
                          : "border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{w.name}</p>
                          <p className="text-xs text-zinc-500">{w.goal?.substring(0, 80) || "No goal set"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasReport && report && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Report Ready
                            </span>
                          )}
                          <button
                            onClick={() => setSelectedWorkspaceId(w.id)}
                            className="text-xs text-zinc-400 hover:text-white transition-colors"
                          >
                            {selectedWorkspaceId === w.id ? "Active" : "Select"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Running Execution Plans */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Play className="h-4 w-4" />
                Running Execution Plans
              </h2>
            </div>
            <div className="p-5">
              {activeSessions.length === 0 ? (
                <p className="text-zinc-500 text-center py-4">No active plans</p>
              ) : (
                <div className="space-y-3">
                  {activeSessions.map((s) => (
                    <div key={s.id} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                      <p className="font-medium text-white text-sm">{s.prompt.substring(0, 60)}</p>
                      <p className="text-xs text-zinc-500 mt-1">Stage: {s.stage}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pending Validations */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Validations
              </h2>
            </div>
            <div className="p-5">
              <p className="text-zinc-500 text-center py-4">Validation tracking coming soon</p>
            </div>
          </div>

          {/* Predictions Awaiting Results */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Predictions Awaiting Results
              </h2>
            </div>
            <div className="p-5">
              <p className="text-zinc-500 text-center py-4">Prediction tracking coming soon</p>
            </div>
          </div>
        </div>

        {/* Right Column - Recent Activity */}
        <div className="space-y-6">
          {/* Recent Learning */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Recent Learning
              </h2>
            </div>
            <div className="p-5">
              <p className="text-zinc-500 text-center py-4">Learning records coming soon</p>
            </div>
          </div>

          {/* Recent Research */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Recent Research
              </h2>
            </div>
            <div className="p-5">
              <p className="text-zinc-500 text-center py-4">Research history coming soon</p>
            </div>
          </div>

          {/* Recent Content Projects */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Recent Content Projects
              </h2>
            </div>
            <div className="p-5">
              <p className="text-zinc-500 text-center py-4">Content history coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
