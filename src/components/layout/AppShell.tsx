"use client";

import { useRef, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { initBusinessCapabilities } from "@/features/capabilities/business";
import { AuthStore, syncAuthToSession } from "@/features/auth";

// ─── Route Access Control ──────────────────────────────────────────────────

const PUBLIC_ROUTES = new Set([
  "/",
  "/auth/login",
  "/auth/signup",
  "/landing-page",
]);

const PROTECTED_ROUTES = new Set([
  "/research",
  "/content",
  "/consultant",
  "/navigate",
  "/command",
  "/intelligence",
  "/memory",
  "/learning",
  "/my-spyral",
  "/settings",
  "/decisions",
  "/execution",
  "/validation",
  "/workspace",
]);

function isProtectedRoute(pathname: string): boolean {
  // Exact match
  if (PROTECTED_ROUTES.has(pathname)) return true;
  // Prefix match (e.g., /navigate/[id])
  for (const prefix of PROTECTED_ROUTES) {
    if (pathname.startsWith(prefix + "/")) return true;
  }
  return false;
}

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  if (pathname.startsWith("/auth/")) return true;
  return false;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Initialize capabilities synchronously so Sidebar and BottomNav
  // can read them on first render (useEffect would be too late as
  // child effects run before parent effects in React's commit phase).
  const initialized = useRef(false);
  if (!initialized.current) {
    initBusinessCapabilities();
    initialized.current = true;
  }

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    // Initialize auth — validates cached token against the server
    // This is the source of truth, not localStorage
    AuthStore.init().then(() => {
      const authenticated = AuthStore.isAuthenticated();
      setIsAuthenticated(authenticated);
      setAuthReady(true);

      // Sync auth to SpyralSession on page refresh
      if (authenticated) {
        syncAuthToSession();
      }
    });

    const unsub = AuthStore.subscribe(() => {
      setIsAuthenticated(AuthStore.isAuthenticated());
    });
    return unsub;
  }, []);

  // ── Route Guard ────────────────────────────────────────────────────────
  // Redirect unauthenticated users away from protected pages

  useEffect(() => {
    if (!authReady) return;

    if (!isAuthenticated && isProtectedRoute(pathname)) {
      // Save the intended destination so we can redirect back after login
      try {
        sessionStorage.setItem("spyral_redirect", pathname);
      } catch {}
      router.replace("/auth/login");
    }

    if (isAuthenticated && (pathname === "/auth/login" || pathname === "/auth/signup")) {
      router.replace("/");
    }
  }, [authReady, isAuthenticated, pathname, router]);

  // Show nothing while checking auth on protected routes
  // (prevents flash of content before redirect)
  if (!authReady && isProtectedRoute(pathname)) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin h-6 w-6 border-2 border-zinc-600 border-t-white rounded-full" />
      </div>
    );
  }

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
