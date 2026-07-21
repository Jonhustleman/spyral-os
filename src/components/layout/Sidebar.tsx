"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "@/features/workspace";
import { WorkspaceWizard } from "@/features/workspace";
import { CapabilityRegistry } from "@/features/capabilities/registry/CapabilityRegistry";
import { getCapabilityIcon } from "@/features/capabilities/icon-map";
import type { Capability } from "@/kernel/contracts/Capability";

export function Sidebar() {
  const pathname = usePathname();
  const [showWizard, setShowWizard] = useState(false);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);

  useEffect(() => {
    setCapabilities(CapabilityRegistry.getEnabled());
  }, [pathname]);

  return (
    <>
      <aside className="hidden md:flex w-56 flex-col border-r border-[#27272a] bg-[#0a0a0a] h-full">
        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
          <div className="h-7 w-7 rounded-md bg-white flex items-center justify-center">
            <span className="text-[10px] font-bold text-black tracking-tight">S</span>
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">
            SPYRAL
          </span>
        </div>

        {/* Workspace Switcher */}
        <div className="px-3 pb-3">
          <WorkspaceSwitcher onCreateNew={() => setShowWizard(true)} />
        </div>

        <nav className="flex-1 px-3 py-0 space-y-0.5">
          {capabilities.map((cap) => {
            const primaryRoute = cap.routes[0];
            const isActive =
              primaryRoute === "/"
                ? pathname === "/"
                : primaryRoute
                  ? pathname.startsWith(primaryRoute)
                  : false;
            const Icon = getCapabilityIcon(cap.icon);

            return (
              <Link
                key={cap.id}
                href={primaryRoute ?? "/"}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-[#27272a] text-white font-medium"
                    : "text-[#a1a1aa] hover:text-white hover:bg-[#27272a]/50"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{cap.manifest.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#27272a] px-4 py-3">
          <p className="text-xs text-[#52525b]">Reality Navigation Platform</p>
        </div>
      </aside>

      {showWizard && (
        <WorkspaceWizard onClose={() => setShowWizard(false)} />
      )}
    </>
  );
}
