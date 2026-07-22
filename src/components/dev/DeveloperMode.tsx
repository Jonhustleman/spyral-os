/**
 * DeveloperMode — Diagnostic screen for SPYRAL OS engineering health.
 *
 * Provides visibility into:
 * - Kernel version
 * - Capability Registry
 * - Workspace count
 * - Navigation sessions
 * - Learning records
 * - Execution plans
 * - Storage size
 * - Build version
 *
 * Accessible via Settings → Developer.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Bug, ChevronDown, ChevronRight, HardDrive, Box, Layers, Route, Brain, Play, Database, Tag, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { CapabilityRegistry } from "@/features/capabilities";
import { WorkspaceStore } from "@/features/workspace";
import { NavigationStore } from "@/features/navigation/navigation.store";
import { LearningStore } from "@/features/learning/learning.store";
import { ExecutionStore } from "@/features/execution/execution.store";
import { DeveloperIntelligence } from "./DeveloperIntelligence";

// ─── Constants ──────────────────────────────────────────────────────────

const KERNEL_VERSION = "1.0.0 LTS";
const BUILD_VERSION = "v0.2.0-alpha";
const BUILD_DATE = "2026-07-20";

// ─── Helpers ────────────────────────────────────────────────────────────

function estimateStorageSize(): string {
  if (typeof window === "undefined") return "N/A";
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) total += key.length + value.length;
    }
  }
  if (total < 1024) return `${total} B`;
  if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
  return `${(total / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Stat Card ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-zinc-500" />
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

// ─── Section ────────────────────────────────────────────────────────────

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/50 hover:bg-zinc-900 transition-colors text-left"
      >
        <span className="text-sm font-medium text-white">{title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4 pt-2">{children}</div>}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export function DeveloperMode() {
  const [activeTab, setActiveTab] = useState<"diagnostics" | "intelligence">("diagnostics");
  const [capabilities, setCapabilities] = useState<any[]>([]);
  const [workspaceCount, setWorkspaceCount] = useState(0);
  const [navSessions, setNavSessions] = useState(0);
  const [learningRecords, setLearningRecords] = useState(0);
  const [executionPlans, setExecutionPlans] = useState(0);
  const [storageSize, setStorageSize] = useState("N/A");

  const refresh = useCallback(() => {
    setCapabilities(CapabilityRegistry.getAll());
    setWorkspaceCount(WorkspaceStore.getAll().length);
    setNavSessions(NavigationStore.getSessionCount());
    setLearningRecords(LearningStore.getRecords().length);
    setExecutionPlans(ExecutionStore.getPlans().length);
    setStorageSize(estimateStorageSize());
  }, []);

  useEffect(() => {
    refresh();
    const unsub1 = NavigationStore.subscribe(refresh);
    const unsub2 = LearningStore.subscribe(refresh);
    const unsub3 = ExecutionStore.subscribe(refresh);
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [refresh]);

  if (activeTab === "intelligence") {
    return (
      <div className="space-y-6">
        {/* Tab nav */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setActiveTab("diagnostics")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <Bug className="w-3.5 h-3.5" />
            Diagnostics
          </button>
          <button
            onClick={() => setActiveTab("intelligence")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-purple-900/50 text-purple-300 border border-purple-700/50"
          >
            <BarChart className="w-3.5 h-3.5" />
            Product Intelligence
          </button>
        </div>
        <DeveloperIntelligence />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab nav */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setActiveTab("diagnostics")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-zinc-800 text-zinc-300"
        >
          <Bug className="w-3.5 h-3.5" />
          Diagnostics
        </button>
        <button
          onClick={() => setActiveTab("intelligence")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <BarChart className="w-3.5 h-3.5" />
          Product Intelligence
        </button>
      </div>

      {/* Version Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Kernel Version" value={KERNEL_VERSION} icon={Box} />
        <StatCard label="Build Version" value={BUILD_VERSION} icon={Tag} />
        <StatCard label="Build Date" value={BUILD_DATE} icon={HardDrive} />
        <StatCard label="Storage Size" value={storageSize} icon={Database} />
      </div>

      {/* Counts */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Capabilities" value={capabilities.length} icon={Layers} />
        <StatCard label="Workspaces" value={workspaceCount} icon={Box} />
        <StatCard label="Navigation Sessions" value={navSessions} icon={Route} />
        <StatCard label="Learning Records" value={learningRecords} icon={Brain} />
        <StatCard label="Execution Plans" value={executionPlans} icon={Play} />
      </div>

      {/* Capability Registry Detail */}
      <Section title={`Capability Registry (${capabilities.length})`} defaultOpen>
        <div className="space-y-1">
          {capabilities.map((cap: any) => (
            <div
              key={cap.id}
              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-mono">{cap.id}</span>
                <span className="text-xs text-white">{cap.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-600 font-mono">{cap.version}</span>
                <span className="text-[10px] text-zinc-700 bg-zinc-800 px-1.5 py-0.5 rounded">
                  {cap.manifest.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Storage Details */}
      <Section title="localStorage Keys">
        <div className="space-y-1">
          {(() => {
            if (typeof window === "undefined") return <p className="text-xs text-zinc-600">Not available (SSR)</p>;
            const keys: { key: string; size: number }[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key) {
                const value = localStorage.getItem(key);
                keys.push({ key, size: key.length + (value ? value.length : 0) });
              }
            }
            return keys.map((k) => (
              <div
                key={k.key}
                className="flex items-center justify-between py-1 px-2 rounded hover:bg-zinc-800/50"
              >
                <span className="text-xs text-zinc-400 font-mono">{k.key}</span>
                <span className="text-[10px] text-zinc-600">
                  {k.size < 1024 ? `${k.size} B` : `${(k.size / 1024).toFixed(1)} KB`}
                </span>
              </div>
            ));
          })()}
        </div>
      </Section>
    </div>
  );
}
