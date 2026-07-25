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

// Overlay data type matching the API response
interface OverlayData {
  reasoningResult?: {
    provider: string;
    model: string;
    usage: { inputTokens: number; outputTokens: number; totalTokens: number };
    reasoning?: { durationMs: number };
    cached: boolean;
    error?: { code: string; message: string; recoverable?: boolean };
  };
  response: string;
  agentType: string;
}

interface DeveloperOverlayProps {
  /** The most recent response data from the reasoning API */
  lastResponse: OverlayData | null;
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

  const { reasoningResult } = lastResponse;

  const stats = [
    {
      label: "Provider",
      value: reasoningResult?.provider || "N/A",
      icon: Cpu,
    },
    {
      label: "Model",
      value: reasoningResult?.model || "N/A",
      icon: Cpu,
    },
    {
      label: "Latency",
      value: reasoningResult?.reasoning?.durationMs
        ? formatMs(reasoningResult.reasoning.durationMs)
        : "N/A",
      icon: Clock,
    },
    {
      label: "Input Tokens",
      value: reasoningResult?.usage?.inputTokens?.toLocaleString() ?? "N/A",
      icon: BarChart,
    },
    {
      label: "Output Tokens",
      value: reasoningResult?.usage?.outputTokens?.toLocaleString() ?? "N/A",
      icon: BarChart,
    },
    {
      label: "Total Tokens",
      value: reasoningResult?.usage?.totalTokens?.toLocaleString() ?? "N/A",
      icon: BarChart,
    },
    {
      label: "Memory Items",
      value: "N/A",
      icon: Database,
    },
    {
      label: "Patterns",
      value: "N/A",
      icon: Brain,
    },
  ];

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

          {/* Error Display */}
          {reasoningResult?.cached && (
            <div className="px-2 py-1.5 rounded bg-zinc-800/50">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium">
                Status
              </p>
              <p className="text-xs text-yellow-400 mt-1">⚡ Cached response</p>
            </div>
          )}
          {reasoningResult?.error && (
            <div className="px-2 py-1.5 rounded bg-red-900/30 border border-red-800/50">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium">
                Error
              </p>
              <p className="text-xs text-red-400 mt-1">
                ⚠ {reasoningResult.error.code}: {reasoningResult.error.message}
              </p>
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
