/**
 * DeveloperIntelligence — Self-Evolving Product Intelligence Dashboard
 *
 * Displays data from all Phase G.0 engines:
 * Overview, Usage, Friction, Research, Recommendations,
 * Predictions, Experiments, Release Comparison, Product Health
 *
 * Every section uses real data — never empty placeholders.
 * Accessible from Developer Mode.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart, TrendingUp, AlertTriangle, Lightbulb, FlaskConical, Activity, Heart, RefreshCw, Brain, Layers, Zap, Target, ArrowUp, ArrowDown, Minus, Clock, Users, FileText, Route, Search, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DeveloperInsights,
  type DeveloperDashboardData,
  ExperienceRecorder,
  ProductMetrics,
  ExperienceAdaptationEngine,
  ProductResearchEngine,
  ImprovementRecommendationEngine,
} from "@/core";

// ─── Helpers ──────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// ─── Stat Card ────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-zinc-500" />
          <p className="text-xs text-zinc-500">{label}</p>
        </div>
        {trend && (
          <span className={cn(
            "text-xs",
            trend === "up" && "text-green-400",
            trend === "down" && "text-red-400",
            trend === "neutral" && "text-zinc-500",
          )}>
            {trend === "up" && <ArrowUp className="w-3 h-3" />}
            {trend === "down" && <ArrowDown className="w-3 h-3" />}
            {trend === "neutral" && <Minus className="w-3 h-3" />}
          </span>
        )}
      </div>
      <p className="text-lg font-semibold text-white">{value}</p>
      {sub && <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-zinc-900/50 hover:bg-zinc-900 transition-colors text-left"
      >
        <Icon className="w-4 h-4 text-zinc-500" />
        <span className="text-sm font-medium text-white flex-1">{title}</span>
        <span className="text-xs text-zinc-600">{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && <div className="px-4 pb-4 pt-2">{children}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────

export function DeveloperIntelligence() {
  const [data, setData] = useState<DeveloperDashboardData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const refresh = useCallback(() => {
    const dashboard = DeveloperInsights.buildDashboard();
    setData(dashboard);
  }, []);

  useEffect(() => {
    refresh();
    const unsub = ExperienceRecorder.subscribe(refresh);
    return () => unsub();
  }, [refresh]);

  const handleRunAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    // Run analysis in microtask to allow UI to update
    setTimeout(() => {
      DeveloperInsights.runFullAnalysis();
      refresh();
      setIsAnalyzing(false);
    }, 100);
  }, [refresh]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  const health = data.productHealth;
  const healthColor = health.level === "excellent" ? "text-green-400" : health.level === "good" ? "text-yellow-400" : health.level === "needs_attention" ? "text-orange-400" : "text-red-400";
  const healthBg = health.level === "excellent" ? "bg-green-900/30 border-green-700/50" : health.level === "good" ? "bg-yellow-900/30 border-yellow-700/50" : health.level === "needs_attention" ? "bg-orange-900/30 border-orange-700/50" : "bg-red-900/30 border-red-700/50";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-900/50 border border-purple-700/50">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Developer Intelligence</h2>
            <p className="text-xs text-zinc-600">Self-Evolving Product Intelligence — Phase G.0</p>
          </div>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isAnalyzing && "animate-spin")} />
          {isAnalyzing ? "Analyzing..." : "Run Full Analysis"}
        </button>
      </div>

      {/* Pilot Summary Banner */}
      <div className="px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">Pilot Learning</span>
        </div>
        <p className="text-xs text-zinc-400">{data.spralHasLearned}</p>
      </div>

      {/* Health Score */}
      <div className={cn("px-4 py-3 rounded-lg border", healthBg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className={cn("w-5 h-5", healthColor)} />
            <span className="text-sm font-semibold text-white">Product Health</span>
          </div>
          <div className="text-right">
            <span className={cn("text-2xl font-bold", healthColor)}>{health.score}</span>
            <span className="text-xs text-zinc-500 ml-1">/ 100</span>
          </div>
        </div>
        <div className="mt-2">
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                health.level === "excellent" ? "bg-green-500" :
                health.level === "good" ? "bg-yellow-500" :
                health.level === "needs_attention" ? "bg-orange-500" : "bg-red-500"
              )}
              style={{ width: `${health.score}%` }}
            />
          </div>
          <p className={cn("text-xs mt-1 capitalize", healthColor)}>{health.level.replace("_", " ")}</p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Pilot Sessions"
          value={data.pilotSessions}
          icon={Users}
          trend={data.pilotSessions > 0 ? "up" : "neutral"}
        />
        <StatCard
          label="Patterns Learned"
          value={data.patternsLearned}
          icon={Layers}
          trend={data.patternsLearned > 0 ? "up" : "neutral"}
        />
        <StatCard
          label="Recommendations"
          value={data.recommendationsGenerated}
          icon={Lightbulb}
          trend={data.recommendationsGenerated > 0 ? "up" : "neutral"}
        />
        <StatCard
          label="Experiments"
          value={data.experimentsRunning}
          icon={FlaskConical}
          sub={data.experimentsRunning === 1 ? "1 running" : `${data.experimentsRunning} proposed`}
        />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Completion Rate"
          value={formatPercent(data.metrics.completionRate)}
          icon={Target}
          trend={data.metrics.completionRate > 0.5 ? "up" : data.metrics.completionRate > 0.2 ? "neutral" : "down"}
        />
        <StatCard
          label="Return Rate"
          value={formatPercent(data.metrics.returnRate)}
          icon={TrendingUp}
          trend={data.metrics.returnRate > 0.2 ? "up" : data.metrics.returnRate > 0.1 ? "neutral" : "down"}
        />
        <StatCard
          label="Drop-off Rate"
          value={formatPercent(data.metrics.dropOffRate)}
          icon={AlertTriangle}
          trend={data.metrics.dropOffRate > 0.3 ? "down" : "up"}
        />
        <StatCard
          label="Avg Session"
          value={formatDuration(data.metrics.averageSessionDuration)}
          icon={Clock}
        />
      </div>

      {/* Latest Insight */}
      <Section title="Latest Insight" icon={Zap} defaultOpen>
        <p className="text-sm text-zinc-300">{data.latestInsight}</p>
      </Section>

      {/* Top Pages */}
      <Section title={`Top Pages (${data.topPages.length})`} icon={BarChart} defaultOpen={false}>
        <div className="space-y-1">
          {data.topPages.map((page, i) => (
            <div key={page.page} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-zinc-800/50">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-600 w-4">{i + 1}.</span>
                <span className="text-xs text-zinc-300">{page.page}</span>
              </div>
              <span className="text-xs text-zinc-500">{page.visits} visit{page.visits !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Friction Patterns */}
      <Section title={`Friction Patterns (${data.frictions.length})`} icon={AlertTriangle} defaultOpen={false}>
        {data.frictions.length === 0 ? (
          <p className="text-xs text-zinc-600">No friction patterns detected yet. Sessions are flowing well.</p>
        ) : (
          <div className="space-y-3">
            {data.frictions.map((f) => (
              <div key={f.id} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-xs font-medium text-white">{f.observedFriction}</p>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded",
                    f.confidence > 0.7 ? "bg-orange-900/50 text-orange-300" : "bg-zinc-800 text-zinc-500",
                  )}>
                    {Math.round(f.confidence * 100)}%
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mb-1">Likely cause: {f.likelyCause}</p>
                <p className="text-[10px] text-purple-400">{f.suggestedImprovement}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Research Questions */}
      <Section title={`Research Questions (${data.researchQuestions.length})`} icon={Search} defaultOpen={false}>
        {data.researchQuestions.length === 0 ? (
          <p className="text-xs text-zinc-600">No research questions generated yet. More sessions needed.</p>
        ) : (
          <div className="space-y-3">
            {data.researchQuestions.map((q) => (
              <div key={q.id} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-xs font-medium text-white">{q.question}</p>
                  <span className="text-[10px] text-zinc-500 capitalize">{q.status.replace("_", " ")}</span>
                </div>
                {q.hypotheses.map((h) => (
                  <div key={h.id} className="mt-2 pl-3 border-l border-zinc-700">
                    <p className="text-[10px] text-zinc-400">Hypothesis: {h.statement}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">Confidence: {Math.round(h.confidence * 100)}%</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Improvement Recommendations */}
      <Section title={`Recommendations (${data.recommendations.length})`} icon={Lightbulb} defaultOpen={false}>
        {data.recommendations.length === 0 ? (
          <p className="text-xs text-zinc-600">No recommendations yet. Run analysis to generate.</p>
        ) : (
          <div className="space-y-3">
            {data.recommendations.map((r) => (
              <div key={r.id} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-xs font-medium text-white">{r.observation}</p>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded",
                      r.estimatedEffort === "low" ? "bg-green-900/50 text-green-300" :
                      r.estimatedEffort === "medium" ? "bg-yellow-900/50 text-yellow-300" :
                      "bg-red-900/50 text-red-300",
                    )}>
                      {r.estimatedEffort}
                    </span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded",
                      r.confidence > 0.7 ? "bg-blue-900/50 text-blue-300" : "bg-zinc-800 text-zinc-500",
                    )}>
                      {Math.round(r.confidence * 100)}%
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 mb-1">{r.recommendation}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-purple-400">{r.estimatedImpact}</span>
                  <span className="text-[10px] text-zinc-600">| {r.category}</span>
                </div>
                {r.affectedComponents.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {r.affectedComponents.map((comp) => (
                      <span key={comp} className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
                        {comp}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Experiments */}
      <Section title={`Experiments (${data.experiments.length})`} icon={FlaskConical} defaultOpen={false}>
        {data.experiments.length === 0 ? (
          <p className="text-xs text-zinc-600">No experiments proposed yet.</p>
        ) : (
          <div className="space-y-3">
            {data.experiments.map((exp) => (
              <div key={exp.id} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-xs font-medium text-white">{exp.name}</p>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded capitalize",
                    exp.status === "proposed" ? "bg-blue-900/50 text-blue-300" :
                    exp.status === "collecting_data" ? "bg-yellow-900/50 text-yellow-300" :
                    exp.status === "completed" ? "bg-green-900/50 text-green-300" :
                    "bg-red-900/50 text-red-300",
                  )}>
                    {exp.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500">Prediction: {exp.prediction}</p>
                <p className="text-[10px] text-zinc-600">Requires {exp.sessionsRequired} sessions</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Release Comparison */}
      {data.releaseComparison && (
        <Section title="Release Comparison" icon={Activity} defaultOpen={false}>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-2 rounded bg-zinc-900/50">
                <p className="text-[10px] text-zinc-600">Metric</p>
                <p className="text-[10px] text-zinc-500 mt-2">Completion Rate</p>
                <p className="text-[10px] text-zinc-500">Return Rate</p>
                <p className="text-[10px] text-zinc-500">Avg Duration</p>
              </div>
              <div className="p-2 rounded bg-zinc-900/50">
                <p className="text-[10px] text-zinc-600">Earlier</p>
                <p className="text-[10px] text-zinc-300 mt-2">{formatPercent(data.releaseComparison.rc1.completionRate)}</p>
                <p className="text-[10px] text-zinc-300">{formatPercent(data.releaseComparison.rc1.returnRate)}</p>
                <p className="text-[10px] text-zinc-300">{formatDuration(data.releaseComparison.rc1.avgSessionDuration)}</p>
              </div>
              <div className="p-2 rounded bg-zinc-900/50">
                <p className="text-[10px] text-zinc-600">Recent</p>
                <p className="text-[10px] text-zinc-300 mt-2">{formatPercent(data.releaseComparison.rc2.completionRate)}</p>
                <p className="text-[10px] text-zinc-300">{formatPercent(data.releaseComparison.rc2.returnRate)}</p>
                <p className="text-[10px] text-zinc-300">{formatDuration(data.releaseComparison.rc2.avgSessionDuration)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.releaseComparison.changes).map(([key, change]) => (
                <span
                  key={key}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded",
                    change.direction === "improved" ? "bg-green-900/50 text-green-300" :
                    change.direction === "regressed" ? "bg-red-900/50 text-red-300" :
                    "bg-zinc-800 text-zinc-500",
                  )}
                >
                  {key}: {change.direction}
                </span>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Knowledge Graph */}
      <Section title={`Knowledge Graph (${data.knowledgeGraph.nodeCount} nodes, ${data.knowledgeGraph.edgeCount} edges)`} icon={Share2} defaultOpen={false}>
        {/* Node counts by type */}
        <div className="space-y-2 mb-4">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Nodes by Type</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["feature", "experiment", "friction", "session", "learning", "release", "evidence", "recommendation", "pattern"] as const).map((type) => {
              const count = data.knowledgeGraph.nodes.filter((n) => n.type === type).length;
              if (count === 0) return null;
              return (
                <div key={type} className="p-2 rounded bg-zinc-900/50 border border-zinc-800">
                  <p className="text-lg font-semibold text-white">{count}</p>
                  <p className="text-[10px] text-zinc-500 capitalize">{type}s</p>
                </div>
              );
            })}
          </div>
        </div>
        {/* Nodes list */}
        {data.knowledgeGraph.nodes.length > 0 && (
          <div className="space-y-1 max-h-64 overflow-y-auto mb-4">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Recent Nodes</p>
            {data.knowledgeGraph.nodes.slice(0, 20).map((node) => (
              <div key={node.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-zinc-800/50">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    node.type === "feature" && "bg-blue-500",
                    node.type === "experiment" && "bg-green-500",
                    node.type === "friction" && "bg-orange-500",
                    node.type === "session" && "bg-purple-500",
                    node.type === "learning" && "bg-yellow-500",
                    node.type === "release" && "bg-red-500",
                    node.type === "evidence" && "bg-cyan-500",
                    node.type === "recommendation" && "bg-pink-500",
                    node.type === "pattern" && "bg-indigo-500",
                  )} />
                  <span className="text-xs text-zinc-300 truncate">{node.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[10px] text-zinc-600 capitalize">{node.type}</span>
                  <span className="text-[10px] text-zinc-600">{node.edgeIds.length} edges</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {data.knowledgeGraph.nodes.length === 0 && (
          <p className="text-xs text-zinc-600 mb-4">No nodes yet. Run full analysis to populate the knowledge graph.</p>
        )}
        <div className="flex items-center gap-2 text-[10px] text-zinc-600">
          <span>Last indexed: {new Date(data.knowledgeGraph.lastIndexed).toLocaleString()}</span>
        </div>
      </Section>

      {/* Evidence Confidence */}
      <Section title="Evidence Confidence" icon={Target} defaultOpen={false}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-500"
                style={{ width: `${data.evidenceConfidence}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-semibold text-white">{data.evidenceConfidence}%</span>
        </div>
        <p className="text-[10px] text-zinc-600 mt-1">
          Average confidence across all observations and recommendations
        </p>
      </Section>
    </div>
  );
}
