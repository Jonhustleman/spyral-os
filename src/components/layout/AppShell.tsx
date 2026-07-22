"use client";

import { useRef, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { initBusinessCapabilities } from "@/features/capabilities/business";
import { AuthStore } from "@/features/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  // Initialize capabilities synchronously so Sidebar and BottomNav
  // can read them on first render (useEffect would be too late as
  // child effects run before parent effects in React's commit phase).
  const initialized = useRef(false);
  if (!initialized.current) {
    initBusinessCapabilities();
    initialized.current = true;
  }

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    // Only check auth on client after mount to prevent hydration mismatch
    setIsAuthenticated(AuthStore.isAuthenticated());
    const unsub = AuthStore.subscribe(() => {
      setIsAuthenticated(AuthStore.isAuthenticated());
    });
    return unsub;
  }, []);

  return (
    <div className="flex h-full">
      {isAuthenticated && <Sidebar />}
      <main className="flex-1 flex flex-col min-h-screen md:min-h-0 pb-14 md:pb-0 overflow-y-auto">
        {/* Pilot Release Banner */}
        {isAuthenticated && !bannerDismissed && (
          <div className="bg-purple-600/10 border-b border-purple-600/20 px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">🧪</span>
              <span className="font-medium text-purple-200">SPYRAL OS Pilot</span>
              <span className="text-purple-300/70 hidden sm:inline">
                — This is an early intelligence pilot. Your feedback helps improve SPYRAL&apos;s reasoning, memory, and research capabilities.
              </span>
              <span className="text-purple-300/70 sm:hidden">
                — Early intelligence pilot.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="mailto:feedback@spyralos.com?subject=SPYRAL%20Pilot%20Feedback"
                className="text-xs px-2.5 py-1 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 transition-colors"
              >
                Send Feedback
              </a>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-purple-400/50 hover:text-purple-300 text-lg leading-none transition-colors"
                aria-label="Dismiss banner"
              >
                &times;
              </button>
            </div>
          </div>
        )}
        {children}
      </main>
      {isAuthenticated && <BottomNav />}
    </div>
  );
}
