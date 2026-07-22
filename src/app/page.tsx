"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Sparkles, Compass, Briefcase, LayoutDashboard,
  Clock, TrendingUp, FileText, ArrowRight, Target, Search,
  Lightbulb, MessageCircle, Activity, User, ChevronRight,
  Zap, Layers, PlusCircle
} from "lucide-react";
import { AuthStore } from "@/features/auth";
import { WorkspaceStore } from "@/features/workspace";
import { LearningStore } from "@/features/learning";
import { SpyralSession, type UserProfile } from "@/features/session";
import LandingPage from "./landing-page";

// ─── Agent Cards ────────────────────────────────────────────────────────────

const AGENT_CARDS = [
  {
    icon: BookOpen,
    title: "Research",
    subtitle: "Investigate ideas and discover new knowledge.",
    href: "/research",
    gradient: "from-blue-600/20 via-blue-500/5 to-transparent",
    borderColor: "border-blue-500/20 hover:border-blue-500/40",
    iconBg: "bg-blue-500/10 text-blue-400",
  },
  {
    icon: Sparkles,
    title: "Content",
    subtitle: "Create campaigns, content and creative assets.",
    href: "/content",
    gradient: "from-purple-600/20 via-purple-500/5 to-transparent",
    borderColor: "border-purple-500/20 hover:border-purple-500/40",
    iconBg: "bg-purple-500/10 text-purple-400",
  },
  {
    icon: Compass,
    title: "Navigation",
    subtitle: "Move from your current reality to your desired reality.",
    href: "/navigate",
    gradient: "from-amber-600/20 via-amber-500/5 to-transparent",
    borderColor: "border-amber-500/20 hover:border-amber-500/40",
    iconBg: "bg-amber-500/10 text-amber-400",
  },
  {
    icon: Briefcase,
    title: "Consultant",
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

// ─── Home Page ──────────────────────────────────────────────────────────────

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [greeting, setGreeting] = useState("");
  const [lastActivity, setLastActivity] = useState("");
  const [activeInvestigation, setActiveInvestigation] = useState("");
  const [activeMission, setActiveMission] = useState("");
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({
    role: "",
    company: "",
    industry: "",
    goals: "",
    projects: "",
    thinkingPref: "",
    writingPref: "",
    timezone: "",
    teamSize: "",
    experience: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const authed = AuthStore.isAuthenticated();
    setIsAuthenticated(authed);

    if (authed) {
      SpyralSession.init();
      const session = SpyralSession.get();

      // Get user profile
      const profile = session?.currentUser;
      setUser(profile as UserProfile | null);

      // Set greeting
      const name = profile?.name || "there";
      setGreeting(`${getTimeGreeting()} ${name.split(" ")[0]}.`);

      // Last activity summary
      const summary = SpyralSession.getLastActivitySummary();
      setLastActivity(summary);

      // Active investigation
      const investigations = SpyralSession.getInvestigations();
      const active = investigations.find((i: any) => i.status === "active");
      setActiveInvestigation(active?.question || "");

      // Active mission
      const missions = SpyralSession.getMissions();
      const activeM = missions.find((m: any) => m.status === "active");
      setActiveMission(activeM?.title || "");

      // Recent workspaces
      setWorkspaces(WorkspaceStore.getRecent(4));

      // Recent patterns
      setPatterns(LearningStore.getPatterns().slice(0, 3));

      // Check if onboarding needed
      if (profile && !(profile as any).onboarded) {
        setShowOnboarding(true);
      }

      const unsub = AuthStore.subscribe(() => {
        setIsAuthenticated(AuthStore.isAuthenticated());
      });
      return unsub;
    }
  }, []);

  // ── Onboarding Handlers ──────────────────────────────────────────────────

  const onboardingFields = [
    { key: "role", label: "What's your role?", placeholder: "e.g. Product Manager, Founder, Creator" },
    { key: "company", label: "What company or project are you working on?", placeholder: "e.g. Acme Corp, personal project" },
    { key: "industry", label: "What industry are you in?", placeholder: "e.g. Technology, Healthcare, Education" },
    { key: "goals", label: "What are your main goals right now?", placeholder: "e.g. Launch a product, grow an audience" },
    { key: "projects", label: "What projects are you currently working on?", placeholder: "e.g. Building a SaaS platform" },
    { key: "thinkingPref", label: "How do you prefer to think through problems?", placeholder: "e.g. Visually, by writing, by talking" },
    { key: "writingPref", label: "What's your writing style?", placeholder: "e.g. Concise, detailed, persuasive" },
    { key: "timezone", label: "What's your timezone?", placeholder: "e.g. EST, PST, UTC+2" },
    { key: "teamSize", label: "Are you working solo or with a team?", placeholder: "e.g. Solo, Small team (<10), Organization" },
    { key: "experience", label: "What's your experience level in your field?", placeholder: "e.g. Beginner, Intermediate, Expert" },
  ];

  const currentField = onboardingFields[onboardingStep];

  const handleOnboardingInput = (value: string) => {
    setOnboardingData(prev => ({ ...prev, [currentField.key]: value }));
  };

  const advanceOnboarding = () => {
    if (onboardingStep < onboardingFields.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    setSaving(true);
    try {
      const profile = SpyralSession.getUser() || {};
      SpyralSession.setUser({
        ...profile,
        ...onboardingData,
        onboarded: true,
      } as any);
      setShowOnboarding(false);
    } finally {
      setSaving(false);
    }
  };

  const skipOnboarding = () => {
    const profile = SpyralSession.getUser() || {};
    SpyralSession.setUser({ ...profile, onboarded: true } as any);
    setShowOnboarding(false);
  };

  // Loading state
  if (isAuthenticated === null) {
    return <div className="flex-1" />;
  }

  // Not authenticated — show landing page
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // ── Onboarding overlay ────────────────────────────────────────────────
  if (showOnboarding) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 pointer-events-none" />
        <motion.div
          key={onboardingStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-lg"
        >
          <div className="text-center mb-8">
            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4">
              <span className="text-lg font-bold text-black">S</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to SPYRAL</h1>
            <p className="text-sm text-zinc-500">
              Let's get to know you better so I can help more effectively.
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1 mb-8 justify-center">
            {onboardingFields.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-8 rounded-full transition-colors ${
                  i <= onboardingStep ? "bg-white" : "bg-zinc-800"
                }`}
              />
            ))}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {currentField.label}
            </label>
            <input
              type="text"
              value={(onboardingData as any)[currentField.key]}
              onChange={(e) => handleOnboardingInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !saving) advanceOnboarding();
              }}
              placeholder={currentField.placeholder}
              className="w-full px-4 py-3 rounded-lg bg-zinc-800/80 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={skipOnboarding}
              className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={advanceOnboarding}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {onboardingStep < onboardingFields.length - 1
                ? "Next"
                : saving
                  ? "Saving..."
                  : "Get Started"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Authenticated Home ─────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto">
      {/* ═══════════════════════════════════════════════════════════════
         HERO — PERSONALIZED GREETING
         ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[50vh] flex flex-col items-center justify-center px-6 py-16">
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
            className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-lg shadow-white/5"
          >
            <span className="text-xl font-bold text-black tracking-tight">S</span>
          </motion.div>

          {/* Personalized greeting */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight mb-3"
          >
            {greeting}
          </motion.h1>

          {/* "Welcome back" summary */}
          {lastActivity && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-base text-zinc-500 max-w-xl mb-4"
            >
              {lastActivity}
            </motion.p>
          )}

          {/* Context chips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="flex flex-wrap gap-3 justify-center mt-2"
          >
            {activeMission && (
              <Link
                href="/command"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/60 text-sm text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
              >
                <Target className="h-3.5 w-3.5 text-amber-400" />
                {activeMission.length > 35 ? activeMission.slice(0, 35) + "…" : activeMission}
              </Link>
            )}
            {activeInvestigation && (
              <Link
                href="/research"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/60 text-sm text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
              >
                <Search className="h-3.5 w-3.5 text-blue-400" />
                {activeInvestigation.length > 35 ? activeInvestigation.slice(0, 35) + "…" : activeInvestigation}
              </Link>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
         AGENT CARDS — MODALITIES OF ONE INTELLIGENCE
         ═══════════════════════════════════════════════════════════════ */}
      <section className="px-6 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-5">
            <Layers className="h-4 w-4 text-zinc-600" />
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Capabilities</h2>
          </div>
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
                  className={`block p-5 rounded-xl border ${card.borderColor} bg-gradient-to-b ${card.gradient} bg-zinc-900/40 hover:bg-zinc-800/40 transition-all group h-full`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white group-hover:text-white transition-colors mb-0.5">
                        {card.title}
                      </h3>
                      <p className="text-sm text-zinc-500 leading-relaxed">
                        {card.subtitle}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0 mt-1.5" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
         CURRENT STATE — MISSION / INVESTIGATION / NEXT
         ═══════════════════════════════════════════════════════════════ */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="h-4 w-4 text-zinc-600" />
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
              Continue Where You Left Off
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Mission */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-medium text-zinc-300">Current Mission</h3>
              </div>
              {activeMission ? (
                <div>
                  <p className="text-sm text-white">{activeMission}</p>
                  <Link
                    href="/command"
                    className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mt-3 transition-colors"
                  >
                    View mission details
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-zinc-600">
                  No active mission yet. Start by exploring a capability above.
                </p>
              )}
            </div>

            {/* Active Investigation */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-medium text-zinc-300">Active Investigation</h3>
              </div>
              {activeInvestigation ? (
                <div>
                  <p className="text-sm text-white">{activeInvestigation}</p>
                  <Link
                    href="/research"
                    className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mt-3 transition-colors"
                  >
                    Continue investigating
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-zinc-600">
                  No active investigation. Research a topic to get started.
                </p>
              )}
            </div>

            {/* Recent Projects */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-zinc-500" />
                <h3 className="text-sm font-medium text-zinc-300">Recent Projects</h3>
              </div>
              {workspaces.length > 0 ? (
                <div className="space-y-2">
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
                <p className="text-sm text-zinc-600">No projects yet.</p>
              )}
            </div>

            {/* Today's Recommendations / Quick Actions */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-4 w-4 text-purple-500" />
                <h3 className="text-sm font-medium text-zinc-300">Suggested Next Actions</h3>
              </div>
              <div className="space-y-2">
                <Link
                  href="/research"
                  className="flex items-center gap-2 p-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
                >
                  <BookOpen className="h-4 w-4 text-blue-400" />
                  {activeInvestigation ? "Continue your investigation" : "Start a new investigation"}
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
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  Talk through a problem
                </Link>
              </div>
            </div>

            {/* Patterns / Learning */}
            {patterns.length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-zinc-500" />
                  <h3 className="text-sm font-medium text-zinc-300">Recent Discoveries</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {patterns.map((p) => (
                    <Link
                      key={p.id}
                      href="/intelligence"
                      className="block p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/20 hover:bg-zinc-800/30 transition-colors"
                    >
                      <p className="text-sm font-medium text-white truncate">{p.title || p.description}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{p.category || "Pattern"}</p>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/intelligence"
                  className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mt-3 transition-colors"
                >
                  Explore all discoveries
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
