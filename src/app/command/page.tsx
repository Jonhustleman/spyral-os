"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorkspaceStore } from "@/features/workspace";
import { NavigationStore } from "@/features/navigation";
import { LearningStore } from "@/features/learning";
import { SpyralSession } from "@/features/session";
import type { Workspace } from "@/kernel/contracts/Workspace";
import {
  Zap, Play, Clock, BarChart3, Brain, FileText, Sparkles,
  TrendingUp, Activity, ArrowRight, Plus, Home, Send,
  BookOpen, Compass, Briefcase, LayoutDashboard,
  Lightbulb, Target, CheckCircle, AlertTriangle, Eye
} from "lucide-react";
import { SpyralCognitiveCore } from "@/core";
import { cn } from "@/lib/utils";

const EXAMPLE_COMMANDS = [
  "Research battery technology",
  "Create skincare campaign",
  "Analyze competitors",
  "Generate investor pitch",
  "Launch product",
];

export default function CommandCenterPage() {
  const router = useRouter();
  const [command, setCommand] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [navSessions, setNavSessions] = useState<any[]>([]);
  const [activeMission, setActiveMission] = useState("");
  const [activeInvestigation, setActiveInvestigation] = useState("");

  useEffect(() => {
    setWorkspaces(WorkspaceStore.getRecent(5));
    setPatterns(LearningStore.getPatterns().slice(0, 3));
    setNavSessions(NavigationStore.getAll().slice(0, 4));

    // Load from SpyralSession
    SpyralSession.init();
    const missions = SpyralSession.getMissions();
    const activeM = missions.find((m: any) => m.status === "active");
    setActiveMission(activeM?.title || "");
    const investigations = SpyralSession.getInvestigations();
    const activeI = investigations.find((i: any) => i.status === "active");
    setActiveInvestigation(activeI?.question || "");
  }, []);

  const handleCommand = () => {
    if (!command.trim()) return;

    // Understand intent via Cognitive Core (fire-and-forget)
    SpyralCognitiveCore.think({
      input: command,
      agentType: "command",
    }).catch(() => {});

    const cmd = command.toLowerCase();
    if (cmd.includes("research") || cmd.includes("investigate") || cmd.includes("analyze")) {
      router.push("/research");
    } else if (cmd.includes("content") || cmd.includes("create") || cmd.includes("campaign")) {
      router.push("/content");
    } else if (cmd.includes("navigate") || cmd.includes("goal") || cmd.includes("launch")) {
      router.push("/navigate");
    } else if (cmd.includes("consult") || cmd.includes("advise") || cmd.includes("strategy") || cmd.includes("investor")) {
      router.push("/consultant");
    } else {
      router.push("/research");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCommand();
    }
  };

  return (
    <div className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Command Center</h1>
          <p className="text-sm text-zinc-500">Connected view of your missions, investigations, and progress</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-sm"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
      </div>

      {/* Natural Language Command Bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Send className="h-4 w-4 text-zinc-400" />
          </div>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or question..."
            className="flex-1 bg-transparent text-white text-sm placeholder-zinc-600 outline-none"
          />
          <button
            onClick={handleCommand}
            disabled={!command.trim()}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
              command.trim()
                ? "bg-white text-black hover:bg-zinc-200"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            )}
          >
            Execute
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLE_COMMANDS.map((example) => (
            <button
              key={example}
              onClick={() => setCommand(example)}
              className="px-2.5 py-1 rounded-md bg-zinc-800/50 text-zinc-500 text-xs hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Current Mission & Investigation */}
      {(activeMission || activeInvestigation) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {activeMission && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Current Mission</h3>
              </div>
              <p className="text-sm text-white">{activeMission}</p>
            </div>
          )}
          {activeInvestigation && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-blue-400" />
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Active Investigation</h3>
              </div>
              <p className="text-sm text-white">{activeInvestigation}</p>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">System</p>
              <p className="text-sm font-semibold text-emerald-400">Operational</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Projects</p>
              <p className="text-sm font-semibold text-white">{workspaces.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Play className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Sessions</p>
              <p className="text-sm font-semibold text-white">{navSessions.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Brain className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Patterns</p>
              <p className="text-sm font-semibold text-white">{patterns.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Projects */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Recent Projects
              </h2>
              <Link href="/my-spyral" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                View all
              </Link>
            </div>
            <div className="p-5">
              {workspaces.length > 0 ? (
                <div className="space-y-2">
                  {workspaces.map((w) => (
                    <Link
                      key={w.id}
                      href={`/workspace/${w.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/60 hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{w.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{w.goal?.substring(0, 80) || "No goal set"}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-600 shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-zinc-600">No projects yet</p>
                  <Link
                    href="/navigate"
                    className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 mt-2 transition-colors"
                  >
                    Start a navigation
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Sessions */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Compass className="h-4 w-4" />
                Navigation
              </h2>
              <Link href="/navigate" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                Start new
              </Link>
            </div>
            <div className="p-5">
              {navSessions.length > 0 ? (
                <div className="space-y-2">
                  {navSessions.map((s) => (
                    <Link
                      key={s.id}
                      href={`/navigate/${s.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/60 hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{s.prompt?.substring(0, 60) || "Navigation session"}</p>
                        <p className="text-xs text-zinc-500">In progress</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-600 shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  href="/navigate"
                  className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-zinc-800 text-sm text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Start a navigation
                </Link>
              )}
            </div>
          </div>

          {/* Learning & Patterns */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Learning & Patterns
              </h2>
              <Link href="/learning" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                View all
              </Link>
            </div>
            <div className="p-5">
              {patterns.length > 0 ? (
                <div className="space-y-2">
                  {patterns.map((p) => (
                    <div key={p.id} className="p-3 rounded-lg border border-zinc-800/60">
                      <p className="text-sm font-medium text-white">{p.title || p.description}</p>

                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-600 text-center py-4">
                  Patterns will appear as you explore and think
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Quick Actions
              </h2>
            </div>
            <div className="p-4 space-y-2">
              <Link
                href="/research"
                className="flex items-center gap-3 p-3 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
              >
                <BookOpen className="h-4 w-4 text-blue-400" />
                <span>Research a topic</span>
              </Link>
              <Link
                href="/content"
                className="flex items-center gap-3 p-3 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
              >
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>Create content</span>
              </Link>
              <Link
                href="/navigate"
                className="flex items-center gap-3 p-3 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
              >
                <Compass className="h-4 w-4 text-amber-400" />
                <span>Navigate a goal</span>
              </Link>
              <Link
                href="/consultant"
                className="flex items-center gap-3 p-3 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
              >
                <Briefcase className="h-4 w-4 text-emerald-400" />
                <span>Get strategic advice</span>
              </Link>
              <Link
                href="/my-spyral"
                className="flex items-center gap-3 p-3 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-zinc-400" />
                <span>My SPYRAL account</span>
              </Link>
            </div>
          </div>

          {/* Recent Research */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Recent Research
              </h2>
              <Link href="/research" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                New
              </Link>
            </div>
            <div className="p-5">
              <Link
                href="/research"
                className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-zinc-800 text-sm text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Start research
              </Link>
            </div>
          </div>

          {/* Predictions */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Predictions
              </h2>
            </div>
            <div className="p-5">
              <p className="text-sm text-zinc-600 text-center py-4">
                Predictions will appear as patterns emerge from your work
              </p>
              <Link
                href="/navigate"
                className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                Start a cycle
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Executions */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Target className="h-4 w-4" />
                Executions
              </h2>
            </div>
            <div className="p-5">
              <p className="text-sm text-zinc-600 text-center py-4">
                Execution plans will appear after navigation cycles
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
