"use client";

import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { initBusinessCapabilities } from "@/features/capabilities/business";

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initBusinessCapabilities();
  }, []);

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
