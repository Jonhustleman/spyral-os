"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceStore } from "@/features/workspace";
import { RealityCanvas } from "@/features/reality";
import type { Workspace } from "@/kernel/contracts/Workspace";

const quickActions = [
  { label: "Business", href: "/navigate?prompt=Business" },
  { label: "Marketing", href: "/navigate?prompt=Marketing" },
  { label: "Content", href: "/navigate?prompt=Content" },
  { label: "Finance", href: "/navigate?prompt=Finance" },
  { label: "Research", href: "/navigate?prompt=Research" },
  { label: "Career", href: "/navigate?prompt=Career" },
];

export default function RealityPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const active = WorkspaceStore.getActive();
    setWorkspaces(active);
  }, []);

  useEffect(() => {
    refresh();
    const unsub = WorkspaceStore.subscribe(refresh);
    return unsub;
  }, [refresh]);

  // Auto-select first workspace when none selected
  useEffect(() => {
    if (workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspaceId]);

  // If a workspace is selected, show the Reality Canvas
  if (selectedWorkspaceId) {
    const ws = WorkspaceStore.getById(selectedWorkspaceId);
    return (
      <div className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        {/* Workspace context header */}
        {ws && (
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-white">{ws.name}</h1>
            <p className="text-sm text-zinc-500">Reality Studio</p>
          </div>
        )}

        <RealityCanvas workspaceId={selectedWorkspaceId} />
      </div>
    );
  }

  // If no workspaces exist, show the landing page
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center text-center max-w-lg"
      >
        {/* Logo mark */}
        <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center mb-6">
          <span className="text-lg font-bold text-black tracking-tight">S</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
          SPYRAL
        </h1>
        <p className="text-sm text-[#a1a1aa] mb-1">
          Reality Navigation Platform
        </p>

        {/* Greeting */}
        <p className="text-lg text-[#a1a1aa] mt-6 mb-8">
          Where do you want to go today&mdash;in reality?
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.03, duration: 0.3 }}
            >
              <Link
                href={action.href}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  "bg-[#1a1a1a] text-[#e4e4e7] border border-[#27272a]",
                  "hover:bg-[#27272a] hover:text-white"
                )}
              >
                {action.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Create Workspace CTA */}
        <Link
          href="/navigate"
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
            "bg-white text-black hover:bg-[#e4e4e7]"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Create Workspace
        </Link>
      </motion.div>

      {/* Footer */}
      <p className="mt-auto pt-12 text-xs text-[#52525b]">
        &copy; {new Date().getFullYear()} SPYRAL OS
      </p>
    </div>
  );
}
