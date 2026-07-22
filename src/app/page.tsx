"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { AuthStore } from "@/features/auth";
import LandingPage from "./landing-page";

// ─── Agent Cards ────────────────────────────────────────────────────────────

const AGENTS = [
  {
    icon: "✨",
    title: "Create Content",
    href: "/content",
    color: "from-purple-500/20 to-purple-600/5",
    borderColor: "border-purple-500/20 hover:border-purple-500/40",
    what: "SPYRAL Content Agent helps you plan, script, and produce high-impact content.",
    useCases: ["Social media campaigns", "Video scripts & storyboards", "Blog posts & articles", "Email sequences"],
    output: "Complete content package with brief, storyboard, captions, hashtags, and repurposing ideas.",
  },
  {
    icon: "🔬",
    title: "Research",
    href: "/research",
    color: "from-blue-500/20 to-blue-600/5",
    borderColor: "border-blue-500/20 hover:border-blue-500/40",
    what: "SPYRAL Research Agent investigates topics, finds patterns, and builds structured intelligence.",
    useCases: ["Market research", "Competitive analysis", "Domain deep dives", "Trend analysis"],
    output: "Structured research report with findings, assumptions, confidence scores, and executive summary.",
  },
  {
    icon: "🧭",
    title: "Navigate a Goal",
    href: "/navigate",
    color: "from-amber-500/20 to-amber-600/5",
    borderColor: "border-amber-500/20 hover:border-amber-500/40",
    what: "SPYRAL Navigation Agent guides you through the Reality Cycle to achieve any goal.",
    useCases: ["Business strategy", "Career transitions", "Personal growth", "Project planning"],
    output: "Full reality assessment with gap analysis, strategies, execution plan, and validation loop.",
  },
  {
    icon: "💼",
    title: "Talk to a Consultant",
    href: "/consultant",
    color: "from-emerald-500/20 to-emerald-600/5",
    borderColor: "border-emerald-500/20 hover:border-emerald-500/40",
    what: "SPYRAL Consultant Agent acts as your elite strategic advisor across any domain.",
    useCases: ["Strategic advice", "Problem diagnosis", "Growth strategy", "Operational improvement"],
    output: "Executive summary, diagnosis, strategic recommendations, priority matrix, and 90-day roadmap.",
  },
];

// ─── Home Page ──────────────────────────────────────────────────────────────

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setIsAuthenticated(AuthStore.isAuthenticated());
    const unsub = AuthStore.subscribe(() => {
      setIsAuthenticated(AuthStore.isAuthenticated());
    });
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
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 py-20">
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

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-xs font-medium text-zinc-500 uppercase tracking-[0.2em] mb-4"
          >
            SPYRAL AI Ecosystem
          </motion.p>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight mb-6"
          >
            What reality do you want
            <br />
            <span className="bg-gradient-to-r from-zinc-300 via-white to-zinc-300 bg-clip-text text-transparent">
              to create today?
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-base md:text-lg text-zinc-400 max-w-xl mb-10 leading-relaxed"
          >
            Choose how you'd like SPYRAL to help. Each agent is a specialized AI
            with deep expertise in its domain — all sharing the same memory and knowledge.
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-8"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <ChevronDown className="h-5 w-5 text-zinc-600" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
         AGENT CARDS SECTION
         ═══════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-16 bg-zinc-950/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Choose how you'd like SPYRAL to help
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              Each agent specializes in a domain. All share the same intelligence.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Link
                  href={agent.href}
                  className={`block p-6 rounded-xl border ${agent.borderColor} bg-gradient-to-b ${agent.color} bg-zinc-900/40 hover:bg-zinc-800/40 transition-all group h-full`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <span className="text-3xl shrink-0">{agent.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-white transition-colors">
                        {agent.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
                    {agent.what}
                  </p>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                        Best for
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.useCases.map((uc) => (
                          <span
                            key={uc}
                            className="text-xs px-2 py-0.5 rounded-md bg-zinc-800/60 text-zinc-400"
                          >
                            {uc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                        Expected output
                      </p>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        {agent.output}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                    Open {agent.title}
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
         FOOTER
         ═══════════════════════════════════════════════════════════════ */}
      <footer className="px-6 py-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-5 w-5 rounded-md bg-white flex items-center justify-center">
              <span className="text-[7px] font-bold text-black">S</span>
            </div>
            <span className="text-xs font-medium text-zinc-600">SPYRAL</span>
          </div>
          <p className="text-xs text-zinc-700">
            © 2026 SPYRAL OS — AI Ecosystem
          </p>
        </div>
      </footer>
    </div>
  );
}
