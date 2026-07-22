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

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => AuthStore.isAuthenticated());

  useEffect(() => {
    const unsub = AuthStore.subscribe(() => {
      setIsAuthenticated(AuthStore.isAuthenticated());
    });
    return unsub;
  }, []);

  return (
    <div className="flex h-full">
      {isAuthenticated && <Sidebar />}
      <main className="flex-1 flex flex-col min-h-screen md:min-h-0 pb-14 md:pb-0 overflow-y-auto">
        {children}
      </main>
      {isAuthenticated && <BottomNav />}
    </div>
  );
}
