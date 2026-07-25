/**
 * DeveloperOverlay — Floating diagnostic panel for reasoning calls.
 *
 * Shows provider, model, latency, tokens, memory retrieved, and
 * WorkingMind summary from the last CognitiveResponse.
 *
 * Only visible when Developer Mode is enabled in localStorage.
 */

"use client";

import { useState, useEffect } from "react";
import { Bug, X, Clock, Cpu, Database, Brain, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CognitiveResponse } from "@/core";

interface DeveloperOverlayProps {
  /** The most recent CognitiveResponse from think/thinkStream */
  lastResponse: CognitiveResponse | null;
  /** Whether Developer Mode is enabled (from parent state). 
   *  If provided, overrides localStorage read. */
  enabled?: boolean;
}

const STORAGE_KEY = "spyral_dev_mode";

export function DeveloperOverlay({ lastResponse, enabled: enabledProp }: DeveloperOverlayProps) {
  const [localStorageEnabled, setLocalStorageEnabled] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // Read value from localStorage on mount (fallback when no prop provided)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setLocalStorageEnabled(true);
    } catch (_e) {
      // localStorage unavailable
    }
  }, []);

  // Use prop if provided, otherwise fall back to localStorage value
  const enabled = enabledProp !== undefined ? enabledProp : localStorageEnabled;

  if (!enabled || !lastResponse) return null;

  const { reasoningResult, reasoningPackage } = lastResponse;

  const stats = [
    {
      label: "Provider",
      value: reasoningResult.provider || "unknown",
      icon: Cpu,
    },
    {
      label: "Model",
      value: reasoningResult.model || "unknown",
      icon: Cpu,
    },
    {
      label: "Latency",
      value: reasoningResult.reasoning?.durationMs
        ? formatMs(reasoningResult.reasoning.durationMs)
        : "N/A",
      icon: Clock,
    },
    {
      label: "Input Tokens",
      value: reasoningResult.usage.inputTokens.toLocaleString(),
      icon: BarChart,
    },
    {
      label: "Output Tokens",
      value: reasoningResult.usage.outputTokens.toLocaleString(),
      icon: BarChart,
    },
    {
      label: "Total Tokens",
      value: reasoningResult.usage.totalTokens.toLocaleString(),
      icon: BarChart,
    },
    {
      label: "Memory Items",
      value: reasoningPackage.identityMemory.length.toString(),
      icon: Database,
    },
    {
      label: "Patterns",
      value: reasoningPackage.patterns.length.toString(),
      icon: Brain,
    },
  ];

  const mind = reasoningPackage.mind;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 max-w-sm w-full rounded-lg border border-zinc-700 bg-zinc-900/95 backdrop-blur shadow-2xl transition-all",
        minimized ? "h-10 overflow-hidden" : "",
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 cursor-pointer"
        onClick={() => setMinimized(!minimized)}
      >
        <div className="flex items-center gap-2">
          <Bug className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs font-medium text-green-400">Developer</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMinimized(!minimized);
          }}
          className="text-zinc-500 hover:text-zinc-300"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Body */}
      {!minimized && (
        <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 px-2 py-1.5 rounded bg-zinc-800/50"
              >
                <stat.icon className="w-3 h-3 text-zinc-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-xs text-zinc-200 font-mono truncate">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* WorkingMind Summary */}
          {mind && (
            <div className="space-y-1.5 px-2 py-1.5 rounded bg-zinc-800/50">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium">
                WorkingMind
              </p>
              <div className="space-y-0.5 text-xs text-zinc-300 font-mono">
                <p>
                  <span className="text-zinc-500">Goal:</span>{" "}
                  {mind.goal || "—"}
                </p>
                <p>
                  <span className="text-zinc-500">Context:</span>{" "}
                  {mind.context?.slice(0, 80) || "—"}
                  {mind.context && mind.context.length > 80 ? "…" : ""}
                </p>
                <p>
                  <span className="text-zinc-500">Entities:</span>{" "}
                  {mind.entities?.length ?? 0}
                </p>
                <p>
                  <span className="text-zinc-500">Unknowns:</span>{" "}
                  {mind.unknowns?.length ?? 0}
                </p>
                <p>
                  <span className="text-zinc-500">Directions:</span>{" "}
                  {mind.possibleDirections?.length ?? 0}
                </p>
                {reasoningResult.cached && (
                  <p className="text-yellow-400">⚡ Cached response</p>
                )}
                {reasoningResult.error && (
                  <p className="text-red-400">
                    ⚠ {reasoningResult.error.code}:{" "}
                    {reasoningResult.error.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}
