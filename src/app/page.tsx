"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, Compass, Briefcase, LayoutDashboard, Clock, TrendingUp, FileText, ArrowRight } from "lucide-react";
import { AuthStore } from "@/features/auth";
import { WorkspaceStore } from "@/features/workspace";
import { LearningStore } from "@/features/learning";
import LandingPage from "./landing-page";

// ─── Agent Cards ────────────────────────────────────────────────────────────

const AGENT_CARDS = [
  {
    icon: BookOpen,
    title: "SPYRAL Research",
    subtitle: "Investigate ideas and discover new knowledge.",
    href: "/research",
    gradient: "from-blue-600/20 via-blue-500/5 to-transparent",
    borderColor: "border-blue-500/20 hover:border-blue-500/40",
    iconBg: "bg-blue-500/10 text-blue-400",
  },
  {
    icon: Sparkles,
    title: "SPYRAL Content",
    subtitle: "Create campaigns, content and creative assets.",
    href: "/content",
    gradient: "from-purple-600/20 via-purple-500/5 to-transparent",
    borderColor: "border-purple-500/20 hover:border-purple-500/40",
    iconBg: "bg-purple-500/10 text-purple-400",
  },
  {
    icon: Compass,
    title: "SPYRAL Navigation",
    subtitle: "Move from your current reality to your desired reality.",
    href: "/navigate",
    gradient: "from-amber-600/20 via-amber-500/5 to-transparent",
    borderColor: "border-amber-500/20 hover:border-amber-500/40",
    iconBg: "bg-amber-500/10 text-amber-400",
  },
  {
    icon: Briefcase,
    title: "SPYRAL Consultant",
    subtitle: "Solve complex business and life problems.",
    href: "/consultant",
    gradient: "from-emerald-600/20 via-emerald-500/5 to-transparent",
    borderColor: "border-emerald-500/20 hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/10 text-emerald-400",
  },
  {
    icon: LayoutDashboard,
    title: "Command Center",
    subtitle: "Control every SPYRAL capability.",
    href: "/command",
    gradient: "from-zinc-600/20 via-zinc-500/5 to-transparent",
    borderColor: "border-zinc-500/20 hover:border-zinc-500/40",
    iconBg: "bg-zinc-500/10 text-zinc-400",
  },
];

// ─── Home Page ──────────────────────────────────────────────────────────────

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);

  useEffect(() => {
    setIsAuthenticated(AuthStore.isAuthenticated());
    const unsub = AuthStore.subscribe(() => {
      setIsAuthenticated(AuthStore.isAuthenticated());
    });

    setWorkspaces(WorkspaceStore.getRecent(4));
    setPatterns(LearningStore.getPatterns().slice(0, 3));

    return unsub;
  }, []);

  // Loading state
  if (isAuthenticated === null) {
    return <div className="flex-1" />;
  }

  // Not authenticated — show landing page
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Authenticated — show home
  return (
    <div className="flex-1 overflow-y-auto">
      {/* ═══════════════════════════════════════════════════════════════
         HERO SECTION
         ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[60vh] flex flex-col items-center justify-center px-6 py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center max-w-3xl"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center mb-8 shadow-lg shadow-white/5"
          >
            <span className="text-xl font-bold text-black tracking-tight">S</span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight mb-4"
          >
            What would you like to
            <br />
            <span className="bg-gradient-to-r from-zinc-300 via-white to-zinc-300 bg-clip-text text-transparent">
              accomplish today?
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-base md:text-lg text-zinc-500 max-w-xl mb-6"
          >
            Research. Create. Strategize. Navigate. Learn.
          </motion.p>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
         AGENT CARDS SECTION
         ═══════════════════════════════════════════════════════════════ */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENT_CARDS.map((card, i) => (
              <motion.div
                key={card.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={i === 4 ? "lg:col-span-3 md:col-span-2" : ""}
              >
                <Link
                  href={card.href}
                  className={`block p-6 rounded-xl border ${card.borderColor} bg-gradient-to-b ${card.gradient} bg-zinc-900/40 hover:bg-zinc-800/40 transition-all group h-full`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                      <card.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white group-hover:text-white transition-colors mb-1">
                        {card.title}
                      </h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {card.subtitle}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0 mt-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
         RECENT ACTIVITY SECTION
         ═══════════════════════════════════════════════════════════════ */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-semibold text-white mb-6">Continue Recent Projects</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Projects */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-zinc-500" />
                <h3 className="text-sm font-medium text-zinc-300">Active Projects</h3>
              </div>
              {workspaces.length > 0 ? (
                <div className="space-y-3">
                  {workspaces.map((ws) => (
                    <Link
                      key={ws.id}
                      href={`/workspace/${ws.id}`}
                      className="block p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/20 hover:bg-zinc-800/30 transition-colors"
                    >
                      <p className="text-sm font-medium text-white truncate">{ws.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">{ws.description || ws.goal}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-600">No active projects yet. Start by choosing an agent above.</p>
              )}
            </div>

            {/* Recent Learning */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-zinc-500" />
                <h3 className="text-sm font-medium text-zinc-300">Recent Learning</h3>
              </div>
              {patterns.length > 0 ? (
                <div className="space-y-3">
                  {patterns.map((p) => (
                    <Link
                      key={p.id}
                      href="/learning"
                      className="block p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/20 hover:bg-zinc-800/30 transition-colors"
                    >
                      <p className="text-sm font-medium text-white truncate">{p.title || p.description}</p>
                      {p.confidence && (
                        <p className="text-xs text-zinc-500 mt-0.5">Confidence: {Math.round(p.confidence * 100)}%</p>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-600">No patterns discovered yet. Use SPYRAL agents to generate insights.</p>
              )}
              <Link
                href="/learning"
                className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mt-3 transition-colors"
              >
                View all learning
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Recent Research */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-zinc-500" />
                <h3 className="text-sm font-medium text-zinc-300">Recent Research</h3>
              </div>
              <p className="text-sm text-zinc-600">Research sessions will appear here after you use SPYRAL Research.</p>
              <Link
                href="/research"
                className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mt-3 transition-colors"
              >
                Start new research
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex items-center gap-2 mb-4">
                <LayoutDashboard className="h-4 w-4 text-zinc-500" />
                <h3 className="text-sm font-medium text-zinc-300">Quick Actions</h3>
              </div>
              <div className="space-y-2">
                <Link
                  href="/research"
                  className="flex items-center gap-2 p-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
                >
                  <BookOpen className="h-4 w-4 text-blue-400" />
                  Research a new topic
                </Link>
                <Link
                  href="/content"
                  className="flex items-center gap-2 p-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
                >
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  Create new content
                </Link>
                <Link
                  href="/navigate"
                  className="flex items-center gap-2 p-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
                >
                  <Compass className="h-4 w-4 text-amber-400" />
                  Navigate a goal
                </Link>
                <Link
                  href="/consultant"
                  className="flex items-center gap-2 p-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
                >
                  <Briefcase className="h-4 w-4 text-emerald-400" />
                  Talk to a consultant
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
