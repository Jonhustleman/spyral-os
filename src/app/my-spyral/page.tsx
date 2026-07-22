"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AuthStore, type SpyralUser } from "@/features/auth";
import { WorkspaceStore } from "@/features/workspace";
import { LearningStore } from "@/features/learning";
import {
  User, FolderOpen, BookOpen, Sparkles, Compass, Lightbulb,
  Image, Database, Settings, BarChart3, Home, LogOut,
  ArrowRight, Plus, Server, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "research", label: "Research", icon: BookOpen },
  { id: "content", label: "Content", icon: Sparkles },
  { id: "cycles", label: "Reality Cycles", icon: Compass },
  { id: "learning", label: "Learning", icon: Lightbulb },
  { id: "providers", label: "Providers", icon: Server },
  { id: "usage", label: "Usage", icon: BarChart3 },
];

export default function MySpyralPage() {
  const [user, setUser] = useState<SpyralUser | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);

  useEffect(() => {
    setUser(AuthStore.getUser());
    setWorkspaces(WorkspaceStore.getAll());
    setPatterns(LearningStore.getPatterns());
    const unsub = AuthStore.subscribe(() => setUser(AuthStore.getUser()));
    return unsub;
  }, []);

  return (
    <div className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">My SPYRAL</h1>
          <p className="text-sm text-zinc-500">Your account and activity center</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-sm"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                activeTab === tab.id
                  ? "bg-white text-black font-medium"
                  : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="max-w-3xl">
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center">
                  <User className="h-8 w-8 text-zinc-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{user?.name || "User"}</h2>
                  <p className="text-sm text-zinc-500">{user?.email || "No email"}</p>
                  <p className="text-xs text-zinc-600 mt-1">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "today"}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-400">All Projects</h2>
              <Link href="/navigate" className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                <Plus className="h-3 w-3" />
                New project
              </Link>
            </div>
            {workspaces.length > 0 ? (
              <div className="space-y-2">
                {workspaces.map((ws) => (
                  <Link
                    key={ws.id}
                    href={`/workspace/${ws.id}`}
                    className="block p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/40 transition-colors"
                  >
                    <p className="font-medium text-white">{ws.name}</p>
                    <p className="text-sm text-zinc-500 mt-1">{ws.description || ws.goal || "No description"}</p>
                    <p className="text-xs text-zinc-600 mt-2">Updated {ws.updatedAt ? new Date(ws.updatedAt).toLocaleDateString() : "recently"}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
                <FolderOpen className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
                <p className="text-zinc-500">No projects yet</p>
                <Link href="/navigate" className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 mt-2 transition-colors">
                  Start your first project <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "research" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-400">Research Sessions</h2>
              <Link href="/research" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                <Plus className="h-3 w-3" />
                New research
              </Link>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
              <BookOpen className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-500">Research sessions will appear here</p>
              <Link href="/research" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors">
                Start researching <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        {activeTab === "content" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-400">Content Projects</h2>
              <Link href="/content" className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                <Plus className="h-3 w-3" />
                New content
              </Link>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
              <Sparkles className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-500">Content projects will appear here</p>
              <Link href="/content" className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 mt-2 transition-colors">
                Create content <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        {activeTab === "cycles" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-400">Reality Cycles</h2>
              <Link href="/navigate" className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                <Plus className="h-3 w-3" />
                New cycle
              </Link>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
              <Compass className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-500">Reality cycles will appear here</p>
              <Link href="/navigate" className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 mt-2 transition-colors">
                Start navigating <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        {activeTab === "learning" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-400">Learning</h2>
              <Link href="/learning" className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                View all
              </Link>
            </div>
            {patterns.length > 0 ? (
              <div className="space-y-2">
                {patterns.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
                    <p className="font-medium text-white">{p.title || p.description}</p>
                    {p.confidence && (
                      <p className="text-xs text-zinc-500 mt-1">Confidence: {Math.round(p.confidence * 100)}%</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
                <Lightbulb className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
                <p className="text-zinc-500">Learning records will appear as you use SPYRAL</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "providers" && (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-zinc-400">Connected Providers</h2>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
              <Server className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-500">No providers connected yet</p>
              <p className="text-xs text-zinc-600 mt-2">Connect providers for image, video, and voice generation</p>
              <button className="mt-4 px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors">
                Connect a provider
              </button>
            </div>
          </div>
        )}

        {activeTab === "usage" && (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-zinc-400">Usage</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <p className="text-sm text-zinc-500">Workspaces</p>
                <p className="text-2xl font-bold text-white mt-1">{workspaces.length}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <p className="text-sm text-zinc-500">Patterns</p>
                <p className="text-2xl font-bold text-white mt-1">{patterns.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
