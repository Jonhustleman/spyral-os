"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Eye, Brain, Target, CheckCircle, RefreshCw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceStore } from "@/features/workspace";
import { RealityCanvas, RealityReport, RealityStore } from "@/features/reality";
import type { ReportData } from "@/features/reality";
import type { Workspace } from "@/kernel/contracts/Workspace";

// ─── Use cases ─────────────────────────────────────────────────────────────

const useCases = [
  { label: "Build a business", href: "/navigate?prompt=" + encodeURIComponent("Build a business"), icon: Target },
  { label: "Grow an audience", href: "/navigate?prompt=" + encodeURIComponent("Grow an audience"), icon: Brain },
  { label: "Create content", href: "/navigate?prompt=" + encodeURIComponent("Create a content strategy"), icon: Sparkles },
  { label: "Make decisions", href: "/navigate?prompt=" + encodeURIComponent("Make a strategic decision"), icon: Eye },
  { label: "Research opportunities", href: "/navigate?prompt=" + encodeURIComponent("Research market opportunities"), icon: CheckCircle },
  { label: "Achieve personal goals", href: "/navigate?prompt=" + encodeURIComponent("Achieve personal goals"), icon: RefreshCw },
];

// ─── SPYRAL cycle steps ────────────────────────────────────────────────────

const cycleSteps = [
  { letter: "S", label: "OBSERVE", desc: "Understand where you are.", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { letter: "P", label: "ORGANIZE", desc: "Find patterns and hidden variables.", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { letter: "Y", label: "PREDICT", desc: "Generate possible paths.", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { letter: "R", label: "VALIDATE", desc: "Measure confidence and evidence.", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { letter: "A", label: "ADAPT", desc: "Improve from reality.", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  { letter: "L", label: "LEARN", desc: "Evolve continuously.", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
];

// ─── Workflow steps ────────────────────────────────────────────────────────

const workflowSteps = [
  { label: "Desired Reality", desc: "Define what you want to create" },
  { label: "Reality Assessment", desc: "Understand where you are now" },
  { label: "Gap Analysis", desc: "What stands between you and your goal" },
  { label: "Strategy Options", desc: "Multiple paths to your desired reality" },
  { label: "Recommended Path", desc: "The highest-confidence strategy" },
  { label: "Execution Plan", desc: "72h / 30d / 90d actionable steps" },
  { label: "Validation", desc: "Measure, learn, adapt" },
  { label: "Learning", desc: "Feed outcomes back into the cycle" },
];

// ─── Animated counter ──────────────────────────────────────────────────────

function AnimatedCounter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev >= end) {
          clearInterval(timer);
          return end;
        }
        return prev + Math.ceil(end / 40);
      });
    }, 50);
    return () => clearInterval(timer);
  }, [end]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── Page ──────────────────────────────────────────────────────────────────

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

  // If a workspace is selected, show the Reality Canvas or Report
  if (selectedWorkspaceId) {
    const ws = WorkspaceStore.getById(selectedWorkspaceId);

    // Check if this workspace has a completed Reality Report
    const hasReport = RealityStore.hasReport(selectedWorkspaceId);
    if (hasReport) {
      const raw = RealityStore.getReport(selectedWorkspaceId);
      const reportData = raw as unknown as ReportData;
      return (
        <div className="flex-1 px-4 md:px-6 py-6 max-w-4xl mx-auto w-full overflow-y-auto">
          {ws && (
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-white">{ws.name}</h1>
                <p className="text-xs text-zinc-500">Reality Studio — Report View</p>
              </div>
              <button
                onClick={() => { RealityStore.deleteReport(selectedWorkspaceId); window.location.reload(); }}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors px-3 py-1.5 rounded-md border border-zinc-800 hover:border-zinc-700"
              >
                Switch to Canvas
              </button>
            </div>
          )}
          <RealityReport
            data={reportData}
            onStartNewCycle={() => { window.location.href = "/navigate"; }}
          />
        </div>
      );
    }

    return (
      <div className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
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

  // ── No workspace — show premium landing page ──────────────────────────

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ═══════════════════════════════════════════════════════════════
         SECTION 1: HERO
         ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-20">
        {/* Background gradient */}
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
            Reality Navigation Platform
          </motion.p>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight mb-6"
          >
            Create the reality you want.
            <br />
            <span className="bg-gradient-to-r from-zinc-300 via-white to-zinc-300 bg-clip-text text-transparent">
              Discover the path to get there.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-base md:text-lg text-zinc-400 max-w-xl mb-10 leading-relaxed"
          >
            SPYRAL helps you understand your current reality, identify hidden structures,
            generate strategies, execute plans, validate outcomes, and adapt through learning.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/navigate"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-all hover:shadow-lg hover:shadow-white/10"
            >
              <Sparkles className="h-4 w-4" />
              Start Creating My Reality
            </Link>
            <a
              href="#cycle"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800/50 hover:text-white transition-colors"
            >
              Explore SPYRAL
              <ChevronDown className="h-4 w-4" />
            </a>
          </motion.div>

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
         SECTION 2: SPYRAL CYCLE
         ═══════════════════════════════════════════════════════════════ */}
      <section id="cycle" className="px-6 py-20 bg-zinc-950/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              The SPYRAL Cycle
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              A continuous loop of observation, organization, prediction, validation,
              adaptation, and learning.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cycleSteps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex flex-col items-center text-center p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-colors group"
              >
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold border mb-3 transition-transform group-hover:scale-110",
                  step.color
                )}>
                  {step.letter}
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{step.label}</h3>
                <p className="text-[11px] text-zinc-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
         SECTION 3: USE CASES
         ═══════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              What can you create?
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              SPYRAL adapts to any domain. Start with a use case that matches your intention.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((useCase, i) => {
              const Icon = useCase.icon;
              return (
                <motion.div
                  key={useCase.label}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <Link
                    href={useCase.href}
                    className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/40 hover:border-zinc-700 transition-all group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-zinc-700 transition-colors">
                      <Icon className="h-5 w-5 text-zinc-300" />
                    </div>
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                      {useCase.label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-zinc-600 ml-auto group-hover:text-zinc-300 transition-colors" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
         SECTION 4: WORKFLOW
         ═══════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-20 bg-zinc-950/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              How it works
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              From intention to action — a structured path through the reality cycle.
            </p>
          </motion.div>

          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-[23px] top-0 bottom-0 w-px bg-zinc-800 hidden md:block" />

            <div className="space-y-6">
              {workflowSteps.map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="relative flex items-start gap-5"
                >
                  {/* Step number */}
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-sm font-bold text-zinc-400">
                    {i + 1}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 pt-2.5">
                    <h3 className="text-sm font-semibold text-white">{step.label}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Link
              href="/navigate"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Start Your Journey
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center">
        <p className="text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} SPYRAL OS — Reality Navigation Platform
        </p>
      </footer>
    </div>
  );
}
