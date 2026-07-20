/**
 * Settings Page — SPYRAL OS
 *
 * Configure preferences and access Developer Mode diagnostics.
 * Developer Mode provides: kernel version, capability registry,
 * workspace count, navigation sessions, learning records,
 * execution plans, storage size, and build version.
 */

"use client";

import { useState } from "react";
import { Settings, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeveloperMode } from "@/components/dev/DeveloperMode";

export default function SettingsPage() {
  const [showDeveloper, setShowDeveloper] = useState(false);

  return (
    <div className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">Settings</h1>
            <p className="text-xs text-zinc-600 mt-0.5">
              Configure your SPYRAL OS preferences.
            </p>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-400">Preferences</h2>
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
            <p className="text-sm text-zinc-500">General preferences coming soon.</p>
          </div>
        </div>

        {/* Developer Mode Toggle */}
        <div className="space-y-4">
          <div
            className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 cursor-pointer hover:border-zinc-700 transition-colors"
            onClick={() => setShowDeveloper(!showDeveloper)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
                  <Bug className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Developer Mode</p>
                  <p className="text-xs text-zinc-600">
                    Kernel diagnostics, storage inspection, and system health
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "w-8 h-4 rounded-full transition-colors",
                  showDeveloper ? "bg-white" : "bg-zinc-700"
                )}
              >
                <div
                  className={cn(
                    "w-3 h-3 rounded-full bg-black transition-transform",
                    showDeveloper ? "translate-x-[18px]" : "translate-x-[2px]"
                  )}
                />
              </div>
            </div>
          </div>

          {showDeveloper && (
            <DeveloperMode />
          )}
        </div>
      </div>
    </div>
  );
}
