"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LearningStore } from "@/features/learning";
import {
  Brain, Zap, FileText, TrendingUp, Lightbulb, AlertTriangle,
  Target, Network, BarChart3, Clock, Home, ArrowRight,
  Copy, Check, BookOpen, CheckCircle, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewSection = "all" | "patterns" | "strategies" | "research" | "predictions" | "recommendations" | "timeline";

export default function IntelligencePage() {
  const [activeSection, setActiveSection] = useState<ViewSection>("all");
  const [patterns, setPatterns] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setPatterns(LearningStore.getPatterns());
    setInsights(LearningStore.getInsights());
    setRecommendations(LearningStore.getRecommendations());
  }, []);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  const sections: { id: ViewSection; label: string; icon: any }[] = [
    { id: "all", label: "All", icon: Brain },
    { id: "patterns", label: "Patterns", icon: TrendingUp },
    { id: "strategies", label: "Strategies", icon: Zap },
    { id: "research", label: "Research", icon: BookOpen },
    { id: "predictions", label: "Predictions", icon: BarChart3 },
    { id: "recommendations", label: "Recommendations", icon: Target },
    { id: "timeline", label: "Timeline", icon: Clock },
  ];

  return (
    <div className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Intelligence</h1>
          <p className="text-sm text-zinc-500">
            Knowledge Graph · Research Archive · Patterns · Strategies · Predictions · Recommendations
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-sm"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                activeSection === sec.id
                  ? "bg-white text-black"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* Knowledge Graph Overview */}
      {activeSection === "all" && (
        <>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Network className="h-6 w-6 text-zinc-400" />
              <h2 className="text-lg font-semibold text-white">Knowledge Graph</h2>
            </div>
            <p className="text-sm text-zinc-500 mb-6">
              Connections between patterns, strategies, research findings, and recommendations discovered across SPYRAL.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3 text-center">
                <p className="text-2xl font-bold text-purple-400">{patterns.length}</p>
                <p className="text-xs text-zinc-500 mt-1">Patterns</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                <p className="text-2xl font-bold text-amber-400">0</p>
                <p className="text-xs text-zinc-500 mt-1">Strategies</p>
              </div>
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">{insights.length}</p>
                <p className="text-xs text-zinc-500 mt-1">Insights</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">{recommendations.length}</p>
                <p className="text-xs text-zinc-500 mt-1">Recommendations</p>
              </div>
              <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-3 text-center">
                <p className="text-2xl font-bold text-cyan-400">0</p>
                <p className="text-xs text-zinc-500 mt-1">Research</p>
              </div>
            </div>
          </div>

          {/* All Items */}
          <div className="space-y-4 mb-8">
            <h3 className="text-sm font-medium text-zinc-400">Recent Intelligence</h3>
            {patterns.length === 0 && insights.length === 0 && recommendations.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
                <Brain className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
                <p className="text-zinc-500">No intelligence records yet</p>
                <p className="text-xs text-zinc-600 mt-2">
                  Intelligence will be generated as you research, create, and navigate with SPYRAL agents
                </p>
              </div>
            ) : (
              <>
                {patterns.map((p) => (
                  <div key={p.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                    <button
                      onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                      className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="h-9 w-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <TrendingUp className="h-4.5 w-4.5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white">{p.title || p.description}</h3>
                        <p className="text-sm text-zinc-400 mt-0.5">{p.description || p.title}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                          <span>Pattern</span>
                          {p.confidence && <span>Confidence: {Math.round(p.confidence * 100)}%</span>}
                          {p.timestamp && <span>{new Date(p.timestamp).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
                {insights.map((i) => (
                  <div key={i.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                    <button
                      onClick={() => setExpanded(expanded === i.id ? null : i.id)}
                      className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Lightbulb className="h-4.5 w-4.5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white">{i.title || i.description}</h3>
                        <p className="text-sm text-zinc-400 mt-0.5">{i.description || i.title}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                          <span>Insight</span>
                          {i.confidence && <span>Confidence: {Math.round(i.confidence * 100)}%</span>}
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
                {recommendations.map((r) => (
                  <div key={r.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                    <button
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Target className="h-4.5 w-4.5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white">{r.title || r.recommendation}</h3>
                        <p className="text-sm text-zinc-400 mt-0.5">{r.recommendation || r.title}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                          <span>Recommendation</span>
                          {r.priority && <span>Priority: {r.priority}</span>}
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}

      {/* Patterns Section */}
      {activeSection === "patterns" && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-400">Patterns</h2>
          {patterns.length > 0 ? (
            patterns.map((p) => (
              <div key={p.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-4.5 w-4.5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white">{p.title || p.description}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{p.description || p.title}</p>
                    {p.confidence && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-purple-500"
                            style={{ width: `${Math.round(p.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500">{Math.round(p.confidence * 100)}% confidence</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
              <TrendingUp className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-500">No patterns discovered yet</p>
              <p className="text-xs text-zinc-600 mt-2">Patterns emerge from research and navigation cycles</p>
            </div>
          )}
        </div>
      )}

      {/* Strategies Section */}
      {activeSection === "strategies" && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-400">Strategies</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
            <Zap className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
            <p className="text-zinc-500">No strategies generated yet</p>
            <p className="text-xs text-zinc-600 mt-2">Complete a navigation cycle to generate strategies</p>
            <Link
              href="/navigate"
              className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 mt-3 transition-colors"
            >
              Start navigating <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Research Section */}
      {activeSection === "research" && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-400">Research Archive</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
            <BookOpen className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
            <p className="text-zinc-500">No research sessions yet</p>
            <p className="text-xs text-zinc-600 mt-2">Research sessions will appear here</p>
            <Link
              href="/research"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-3 transition-colors"
            >
              Start researching <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Predictions Section */}
      {activeSection === "predictions" && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-400">Predictions</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
            <BarChart3 className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
            <p className="text-zinc-500">No predictions yet</p>
            <p className="text-xs text-zinc-600 mt-2">Predictions are generated from navigation cycles and research</p>
            <Link
              href="/navigate"
              className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 mt-3 transition-colors"
            >
              Start a cycle <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {activeSection === "recommendations" && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-400">Recommendations</h2>
          {recommendations.length > 0 ? (
            recommendations.map((r) => (
              <div key={r.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Target className="h-4.5 w-4.5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white">{r.title || r.recommendation}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{r.recommendation || r.title}</p>
                    {r.priority && (
                      <span className={cn(
                        "inline-block mt-2 text-xs px-2 py-0.5 rounded-full",
                        r.priority === "high" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                        r.priority === "medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      )}>
                        {r.priority} priority
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
              <Target className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-500">No recommendations yet</p>
              <p className="text-xs text-zinc-600 mt-2">Recommendations come from research and consultant sessions</p>
            </div>
          )}
        </div>
      )}

      {/* Timeline Section */}
      {activeSection === "timeline" && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-400">Learning Timeline</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
            <Clock className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
            <p className="text-zinc-500">Timeline will show your learning journey across sessions</p>
            <p className="text-xs text-zinc-600 mt-2">Records will populate as you use SPYRAL agents</p>
          </div>
        </div>
      )}

      {/* Archives (visible in "all" mode) */}
      {activeSection === "all" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Link
            href="/research"
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-center hover:bg-zinc-800/40 transition-colors"
          >
            <FileText className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
            <h4 className="font-medium text-white mb-1">Research Archive</h4>
            <p className="text-xs text-zinc-500">Investigation reports and findings</p>
          </Link>
          <Link
            href="/learning"
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-center hover:bg-zinc-800/40 transition-colors"
          >
            <Brain className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
            <h4 className="font-medium text-white mb-1">Learning Center</h4>
            <p className="text-xs text-zinc-500">All learning records and insights</p>
          </Link>
          <Link
            href="/my-spyral"
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-center hover:bg-zinc-800/40 transition-colors"
          >
            <BarChart3 className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
            <h4 className="font-medium text-white mb-1">My SPYRAL</h4>
            <p className="text-xs text-zinc-500">Account and usage center</p>
          </Link>
        </div>
      )}
    </div>
  );
}
