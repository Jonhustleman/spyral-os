"use client";

import { useRef } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { initBusinessCapabilities } from "@/features/capabilities/business";

export function AppShell({ children }: { children: React.ReactNode }) {
  // Initialize capabilities synchronously so Sidebar and BottomNav
  // can read them on first render (useEffect would be too late as
  // child effects run before parent effects in React's commit phase).
  const initialized = useRef(false);
  if (!initialized.current) {
    initBusinessCapabilities();
    initialized.current = true;
  }

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen md:min-h-0 pb-14 md:pb-0 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
