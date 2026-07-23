/**
 * SPYRAL OS — Memory Page
 *
 * Developer-facing Memory tab showing:
 * - Memory Health
 * - Knowledge Graph
 * - Relationship Map
 * - Memory Growth
 * - Pattern Discovery
 * - Predictions
 * - Timeline
 * - Reflection Logs
 * - Memory Size
 * - Consolidation Queue
 * - Retrieval Performance
 *
 * No user-facing technical details.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MemoryEngine } from "@/core/memory";
import { useMemory } from "@/features/memory";
import {
  Brain, Network, TrendingUp, BarChart3, Clock, Lightbulb,
  Target, Home, Activity, Zap, RefreshCw, Search,
  ChevronRight, Database, Layers, GitBranch, AlertTriangle,
  Check, Copy, FileText, BookOpen, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MemoryTab = "overview" | "graph" | "patterns" | "predictions" | "timeline" | "reflections" | "search";

export default function MemoryPage() {
  const { metrics, state, refresh, engine } = useMemory();
  const [activeTab, setActiveTab] = useState<MemoryTab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Refresh on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Handle search
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    const results = MemoryEngine.search(searchQuery, 20);
    setSearchResults(results);
  }, [searchQuery]);

  // Handle consolidation
  const handleConsolidate = useCallback(async () => {
    setIsConsolidating(true);
    try {
      engine.consolidate();
      refresh();
    } finally {
      setIsConsolidating(false);
    }
  }, [engine, refresh]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  const tabs: { id: MemoryTab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "graph", label: "Knowledge Graph", icon: Network },
    { id: "patterns", label: "Patterns", icon: TrendingUp },
    { id: "predictions", label: "Predictions", icon: BarChart3 },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "reflections", label: "Reflections", icon: Lightbulb },
    { id: "search", label: "Search", icon: Search },
  ];

  return (
    <div className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Memory</h1>
          <p className="text-sm text-zinc-500">
            Cognitive Memory Architecture · Knowledge Graph · Patterns · Predictions · Reflections
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Consolidate Button */}
          <button
            onClick={handleConsolidate}
            disabled={isConsolidating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-sm disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", isConsolidating && "animate-spin")} />
            {isConsolidating ? "Consolidating..." : "Consolidate"}
          </button>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-sm"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-white text-black"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── OVERVIEW TAB ──────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Health Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <HealthCard
              icon={Brain}
              label="Total Memories"
              value={metrics.totalMemories.toString()}
              subtext={`${metrics.episodesThisSession} this session`}
            />
            <HealthCard
              icon={Database}
              label="Semantic Facts"
              value={metrics.totalFacts.toString()}
              subtext={`${metrics.totalFacts} facts learned`}
            />
            <HealthCard
              icon={GitBranch}
              label="Knowledge Graph"
              value={`${metrics.graphNodes} nodes`}
              subtext={`${metrics.graphEdges} edges`}
            />
            <HealthCard
              icon={BarChart3}
              label="Predictions"
              value={metrics.totalPredictions.toString()}
              subtext={`${metrics.totalPatterns} patterns`}
            />
          </div>

          {/* Memory Details */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h2 className="text-base font-semibold text-white mb-4">Memory Health</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Storage Size</span>
                <span className="text-sm text-zinc-300">{(metrics.storageSize / 1024).toFixed(1)} KB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Last Consolidation</span>
                <span className="text-sm text-zinc-300">
                  {metrics.lastConsolidation
                    ? new Date(metrics.lastConsolidation).toLocaleString()
                    : "Never"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Consolidation Queue</span>
                <span className="text-sm text-zinc-300">{metrics.consolidationQueue}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Retrieval Count</span>
                <span className="text-sm text-zinc-300">{metrics.retrievalCount}</span>
              </div>
              {/* Average Confidence is internal — never shown to users */}
            </div>
          </div>

          {/* Recent Activity */}
          {state && state.episodes.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h2 className="text-base font-semibold text-white mb-4">Recent Episodes</h2>
              <div className="space-y-2">
                {state.episodes.slice(0, 10).map((ep: any) => (
                  <div key={ep.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-800/30 transition-colors">
                    <div className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      ep.type === "research" ? "bg-blue-500/10 text-blue-400" :
                      ep.type === "content" ? "bg-purple-500/10 text-purple-400" :
                      ep.type === "success" ? "bg-emerald-500/10 text-emerald-400" :
                      ep.type === "mistake" ? "bg-red-500/10 text-red-400" :
                      "bg-zinc-500/10 text-zinc-400"
                    )}>
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-300 truncate">{ep.summary}</p>
                      <p className="text-xs text-zinc-600">
                        {ep.type} · {new Date(ep.timestamp).toLocaleString()}
                        {ep.tags.length > 0 && ` · ${ep.tags.join(", ")}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── KNOWLEDGE GRAPH TAB ────────────────────────────────────────── */}
      {activeTab === "graph" && (
        <div className="space-y-6">
          {/* Graph Summary */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Network className="h-6 w-6 text-zinc-400" />
              <h2 className="text-lg font-semibold text-white">Knowledge Graph</h2>
            </div>

            {(() => {
              const summary = MemoryEngine.getGraphSummary();
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 rounded-lg bg-zinc-800/30">
                    <p className="text-2xl font-bold text-white">{summary.nodeCount}</p>
                    <p className="text-xs text-zinc-500">Total Nodes</p>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-800/30">
                    <p className="text-2xl font-bold text-white">{summary.edgeCount}</p>
                    <p className="text-xs text-zinc-500">Total Edges</p>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-800/30">
                    <p className="text-2xl font-bold text-white">{Object.keys(summary.nodeTypeCounts).length}</p>
                    <p className="text-xs text-zinc-500">Node Types</p>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-800/30">
                    <p className="text-2xl font-bold text-white">{summary.hubNodes.length}</p>
                    <p className="text-xs text-zinc-500">Hub Nodes</p>
                  </div>
                </div>
              );
            })()}

            {/* Node Types Distribution */}
            {(() => {
              const summary = MemoryEngine.getGraphSummary();
              return (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-zinc-400 mb-3">Node Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(summary.nodeTypeCounts).map(([type, count]) => (
                      <div
                        key={type}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800/30 border border-zinc-700/50 text-sm"
                      >
                        <span className="text-zinc-300">{type}</span>
                        <span className="text-zinc-600 ml-2">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Hub Nodes */}
            {(() => {
              const summary = MemoryEngine.getGraphSummary();
              if (summary.hubNodes.length > 0) {
                return (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400 mb-3">Most Connected</h3>
                    <div className="space-y-2">
                      {summary.hubNodes.map((hub: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/30">
                          <span className="text-sm text-zinc-300">{hub.label}</span>
                          <span className="text-xs text-zinc-600">{hub.connections} connections</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <p className="text-sm text-zinc-600">No nodes yet. Interact with SPYRAL to build your knowledge graph.</p>
              );
            })()}
          </div>

          {/* All Nodes */}
          {state && state.graphNodes.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h2 className="text-base font-semibold text-white mb-4">All Nodes ({state.graphNodes.length})</h2>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {state.graphNodes.map((node: any) => (
                  <div key={node.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800/30 text-sm">
                    <div className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      node.type === "person" ? "bg-emerald-500" :
                      node.type === "project" ? "bg-blue-500" :
                      node.type === "research" ? "bg-purple-500" :
                      node.type === "concept" ? "bg-amber-500" :
                      "bg-zinc-500"
                    )} />
                    <span className="text-zinc-300">{node.label}</span>
                    <span className="text-xs text-zinc-600 ml-auto">{node.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── PATTERNS TAB ──────────────────────────────────────────────── */}
      {activeTab === "patterns" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-zinc-400" />
              <h2 className="text-lg font-semibold text-white">Detected Patterns</h2>
            </div>

            {state && state.patterns.length > 0 ? (
              <div className="space-y-3">
                {state.patterns
                  .sort((a: any, b: any) => b.confidence - a.confidence)
                  .map((pattern: any) => (
                    <div key={pattern.id} className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-medium text-white">{pattern.pattern}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400">
                          {pattern.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-600 mb-2">
                        <span>Observed {pattern.occurrenceCount} times</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-600">No patterns detected yet. Patterns emerge as you use SPYRAL.</p>
            )}
          </div>
        </div>
      )}

      {/* ─── PREDICTIONS TAB ────────────────────────────────────────────── */}
      {activeTab === "predictions" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-6 w-6 text-zinc-400" />
              <h2 className="text-lg font-semibold text-white">Predictions</h2>
            </div>

            {(() => {
              const predictions = MemoryEngine.predict();
              if (predictions.length > 0) {
                return (
                  <div className="space-y-3">
                    {predictions.map((pred: any) => (
                      <div key={pred.id} className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-sm font-medium text-white">{pred.title}</h3>
                            <p className="text-xs text-zinc-500 mt-1">{pred.description}</p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400 shrink-0 ml-3">
                            {pred.type.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-600">
                          <span>Expires: {new Date(pred.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }
              return (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-600">
                    No predictions yet. SPYRAL will generate predictions as it learns from your interactions.
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ─── TIMELINE TAB ──────────────────────────────────────────────── */}
      {activeTab === "timeline" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-6 w-6 text-zinc-400" />
              <h2 className="text-lg font-semibold text-white">Timeline</h2>
            </div>

            {state && state.timeline.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-800" />

                <div className="space-y-4">
                  {state.timeline.slice(0, 30).map((entry: any) => (
                    <div key={entry.id} className="relative pl-10">
                      {/* Dot */}
                      <div className={cn(
                        "absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2",
                        entry.type === "personal" ? "border-emerald-500 bg-emerald-500/20" :
                        entry.type === "project" ? "border-blue-500 bg-blue-500/20" :
                        entry.type === "research" ? "border-purple-500 bg-purple-500/20" :
                        entry.type === "learning" ? "border-amber-500 bg-amber-500/20" :
                        "border-zinc-500 bg-zinc-500/20"
                      )} />
                      <div className="p-3 rounded-lg bg-zinc-800/20 hover:bg-zinc-800/40 transition-colors">
                        <p className="text-sm text-zinc-300">{entry.title}</p>
                        <p className="text-xs text-zinc-600 mt-1">{entry.description}</p>
                        <p className="text-xs text-zinc-700 mt-1">
                          {new Date(entry.timestamp).toLocaleString()} · {entry.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-600">No timeline entries yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ─── REFLECTIONS TAB ───────────────────────────────────────────── */}
      {activeTab === "reflections" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="h-6 w-6 text-zinc-400" />
              <h2 className="text-lg font-semibold text-white">Reflections</h2>
            </div>

            {state && state.reflections.length > 0 ? (
              <div className="space-y-4">
                {state.reflections.map((ref: any) => (
                  <div key={ref.id} className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-sm font-semibold text-white">{ref.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-400 capitalize">
                        {ref.type}
                      </span>
                    </div>

                    {/* Learned */}
                    {ref.learned.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-zinc-500 mb-1">What I Learned</p>
                        {ref.learned.map((l: string, i: number) => (
                          <p key={i} className="text-xs text-zinc-400">• {l}</p>
                        ))}
                      </div>
                    )}

                    {/* Surprises */}
                    {ref.surprises.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-zinc-500 mb-1">What Surprised Me</p>
                        {ref.surprises.map((s: string, i: number) => (
                          <p key={i} className="text-xs text-zinc-400">• {s}</p>
                        ))}
                      </div>
                    )}

                    {/* Patterns */}
                    {ref.patterns.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-zinc-500 mb-1">Emerging Patterns</p>
                        {ref.patterns.map((p: string, i: number) => (
                          <p key={i} className="text-xs text-zinc-400">• {p}</p>
                        ))}
                      </div>
                    )}

                    {/* Recommendations */}
                    {ref.recommendations.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 mb-1">Recommendations</p>
                        {ref.recommendations.map((r: string, i: number) => (
                          <p key={i} className="text-xs text-zinc-400">• {r}</p>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => {
                          const content = [ref.title, "", ...ref.learned, ...ref.surprises, ...ref.patterns, ...ref.recommendations].join("\n");
                          copyToClipboard(content, ref.id);
                        }}
                        className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                      >
                        {copied === ref.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied === ref.id ? "Copied" : "Copy"}
                      </button>
                      <span className="text-xs text-zinc-700">
                        {new Date(ref.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-600 mb-4">
                  No reflections yet. Generate a reflection to see SPYRAL's self-analysis.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => { MemoryEngine.reflect("weekly", true); refresh(); }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs"
                  >
                    Generate Weekly
                  </button>
                  <button
                    onClick={() => { MemoryEngine.reflect("monthly", true); refresh(); }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs"
                  >
                    Generate Monthly
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SEARCH TAB ────────────────────────────────────────────────── */}
      {activeTab === "search" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Search className="h-6 w-6 text-zinc-400" />
              <h2 className="text-lg font-semibold text-white">Memory Search</h2>
            </div>

            {/* Search Input */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search across all memory types..."
                className="flex-1 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
              >
                Search
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-zinc-600 mb-3">{searchResults.length} results</p>
                {searchResults.map((result: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm font-medium text-white">{result.title}</h3>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        result.type === "fact" ? "bg-blue-500/10 text-blue-400" :
                        result.type === "episode" ? "bg-purple-500/10 text-purple-400" :
                        result.type === "pattern" ? "bg-amber-500/10 text-amber-400" :
                        "bg-emerald-500/10 text-emerald-400"
                      )}>
                        {result.type}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">{result.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-600">
                      <span>Relevance: {(result.relevance * 100).toFixed(0)}%</span>
                      <span>·</span>
                      <span>Source: {result.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery && (
              <p className="text-sm text-zinc-600 text-center py-4">
                No results found for "{searchQuery}". Try different keywords.
              </p>
            )}

            {!searchQuery && (
              <p className="text-sm text-zinc-600 text-center py-4">
                Enter a query to search across semantic facts, episodes, patterns, and knowledge graph nodes.
                <br />
                Searching "marketing" will also find branding, campaign, advertising, etc.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Health Card Component ──────────────────────────────────────────────

function HealthCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: any;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <Icon className="h-5 w-5 text-zinc-500 mb-2" />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
      <p className="text-[10px] text-zinc-700 mt-0.5">{subtext}</p>
    </div>
  );
}
