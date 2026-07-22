"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// ─── Bottom nav items (mobile, subset of sidebar) ────────────────────────

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: "🏠" },
  { label: "Content", href: "/content", icon: "✨" },
  { label: "Research", href: "/research", icon: "🔬" },
  { label: "Navigate", href: "/navigate", icon: "🧭" },
  { label: "Consultant", href: "/consultant", icon: "💼" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#27272a] bg-[#0a0a0a]/95 backdrop-blur-sm">
      <div className="flex items-center justify-around h-14 px-2">
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
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md transition-colors min-w-0",
                isActive
                  ? "text-white"
                  : "text-[#52525b] hover:text-[#a1a1aa]"
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span className="text-[10px] font-medium truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
