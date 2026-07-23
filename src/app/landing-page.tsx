"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Sparkles, Brain, Compass, Briefcase } from "lucide-react";

// ─── Cycle Steps ───────────────────────────────────────────────────────────

const cycleSteps = [
  { letter: "S", label: "Sense", desc: "Observe reality", color: "border-blue-500/30 text-blue-400 bg-blue-500/5" },
  { letter: "P", label: "Predict", desc: "Model outcomes", color: "border-purple-500/30 text-purple-400 bg-purple-500/5" },
  { letter: "Y", label: "Yield", desc: "Take action", color: "border-amber-500/30 text-amber-400 bg-amber-500/5" },
  { letter: "R", label: "Record", desc: "Capture results", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" },
  { letter: "A", label: "Adapt", desc: "Refine approach", color: "border-rose-500/30 text-rose-400 bg-rose-500/5" },
  { letter: "L", label: "Learn", desc: "Build knowledge", color: "border-cyan-500/30 text-cyan-400 bg-cyan-500/5" },
];

// ─── Use Cases ─────────────────────────────────────────────────────────────

const useCases = [
  {
    icon: Sparkles,
    title: "Content Creation",
    description: "Develop creative direction that connects with the people who matter.",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: Brain,
    title: "Research & Intelligence",
    description: "Explore ideas, connect what you find, and understand what's really going on.",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Compass,
    title: "Goal Navigation",
    description: "Figure out where you are, where you want to be, and how to bridge the gap.",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: Briefcase,
    title: "Strategic Consulting",
    description: "Work through complex challenges with a thinking partner who challenges your assumptions.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

// ─── Workflow Steps ────────────────────────────────────────────────────────

const workflow = [
  { step: "1", label: "Share what you're working on", desc: "Describe what you want to explore or achieve." },
  { step: "2", label: "Explore together", desc: "Thoughtful questions to deepen understanding." },
  { step: "3", label: "Gain clarity", desc: "Surface insights, perspectives, and directions worth pursuing." },
  { step: "4", label: "Take action", desc: "Move forward with confidence and adapt as you go." },
];

// ─── Landing Page ──────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-20">
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

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-xs font-medium text-zinc-500 uppercase tracking-[0.2em] mb-4"
          >
            SPYRAL AI Ecosystem
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight mb-6"
          >
            The operating system for
            <br />
            <span className="bg-gradient-to-r from-zinc-300 via-white to-zinc-300 bg-clip-text text-transparent">
              creating your reality
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-base md:text-lg text-zinc-400 max-w-xl mb-10 leading-relaxed"
          >
            SPYRAL is an ecosystem of specialized AI agents that help you research, create,
            navigate goals, and make strategic decisions — all sharing the same intelligence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800/50 hover:text-white transition-colors"
            >
              Sign In
            </Link>
          </motion.div>

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

      {/* SPYRAL Cycle */}
      <section className="px-6 py-20 bg-zinc-950/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">The SPYRAL Cycle</h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              A continuous loop of observation, prediction, action, recording, adaptation, and learning.
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
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold border mb-3 transition-transform group-hover:scale-110 ${step.color}`}>
                  {step.letter}
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{step.label}</h3>
                <p className="text-[11px] text-zinc-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">What SPYRAL can do</h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              Four specialized agents, one intelligent ecosystem.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((uc, i) => {
              const Icon = uc.icon;
              return (
                <motion.div
                  key={uc.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-colors"
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center border mb-4 ${uc.bg}`}>
                    <Icon className={`h-5 w-5 ${uc.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{uc.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{uc.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20 bg-zinc-950/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">How it works</h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              Four steps from idea to execution.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflow.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="text-center"
              >
                <div className="h-10 w-10 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center text-sm font-bold text-white mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{step.label}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to create your reality?
            </h2>
            <p className="text-zinc-400 mb-8">
              Join SPYRAL and start navigating your goals with AI-powered intelligence.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-5 w-5 rounded-md bg-white flex items-center justify-center">
              <span className="text-[7px] font-bold text-black">S</span>
            </div>
            <span className="text-xs font-medium text-zinc-600">SPYRAL</span>
          </div>
          <p className="text-xs text-zinc-700">© 2026 SPYRAL OS — AI Ecosystem</p>
        </div>
      </footer>
    </div>
  );
}
