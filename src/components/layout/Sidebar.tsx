"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "@/features/workspace";
import { WorkspaceWizard } from "@/features/workspace";
import { AuthStore } from "@/features/auth";
import { LogOut, User } from "lucide-react";

// ─── Sidebar navigation items ────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: "🏠" },
  { label: "Content Agent", href: "/content", icon: "✨" },
  { label: "Research Agent", href: "/research", icon: "🔬" },
  { label: "Navigation Agent", href: "/navigate", icon: "🧭" },
  { label: "Consultant Agent", href: "/consultant", icon: "💼" },
  { label: "Command Center", href: "/command", icon: "📊" },
  { label: "Intelligence", href: "/intelligence", icon: "🧠" },
  { label: "Learning", href: "/learning", icon: "📚" },
  { label: "Settings", href: "/settings", icon: "⚙" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(false);
  const user = AuthStore.getUser();

  const handleLogout = () => {
    AuthStore.logout();
    router.push("/");
  };

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
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-[#27272a] text-white font-medium"
                    : "text-[#a1a1aa] hover:text-white hover:bg-[#27272a]/50"
                )}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-[#27272a] px-3 py-3 space-y-2">
          {user && (
            <div className="flex items-center gap-2.5 px-3 py-1.5">
              <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5 text-zinc-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{user.name}</p>
                <p className="text-[10px] text-zinc-600 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-[#a1a1aa] hover:text-white hover:bg-[#27272a]/50 transition-colors w-full"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
          <p className="text-[10px] text-[#52525b] px-3">SPYRAL AI Ecosystem</p>
        </div>
      </aside>

      {showWizard && (
        <WorkspaceWizard onClose={() => setShowWizard(false)} />
      )}
    </>
  );
}
