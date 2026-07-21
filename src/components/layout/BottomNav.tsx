"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CapabilityRegistry } from "@/features/capabilities/registry/CapabilityRegistry";
import { getCapabilityIcon } from "@/features/capabilities/icon-map";
import type { Capability } from "@/kernel/contracts/Capability";

export function BottomNav() {
  const pathname = usePathname();
  const [capabilities, setCapabilities] = useState<Capability[]>([]);

  useEffect(() => {
    setCapabilities(CapabilityRegistry.getEnabled());
  }, [pathname]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#27272a] bg-[#0a0a0a]/95 backdrop-blur-sm">
      <div className="flex items-center justify-around h-14 px-2">
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
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md transition-colors min-w-0",
                isActive
                  ? "text-white"
                  : "text-[#52525b] hover:text-[#a1a1aa]"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium truncate">
                {cap.manifest.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
