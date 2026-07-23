/**
 * LearningStudio — Main container for the Learning Studio.
 *
 * Provides tabbed access to:
 * - Dashboard (aggregated stats)
 * - Patterns (discovered patterns with confidence evolution)
 * - Insights (human-readable observations)
 * - Recommendations (evidence-backed suggestions)
 *
 * Per ADR-0037, Patterns are discovered, not authored.
 * Per ADR-0038, pipeline is: Outcome → Pattern → Insight → Recommendation
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Brain, Lightbulb, Target, LayoutDashboard, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LearningStore } from "../learning.store";
import type { Pattern } from "@/kernel/contracts/Pattern";
import type { Insight } from "@/kernel/contracts/Insight";
import type { Recommendation } from "@/kernel/contracts/Recommendation";
import { PatternsView } from "./PatternsView";
import { InsightsView } from "./InsightsView";
import { RecommendationsView } from "./RecommendationsView";

// ─── Tab config ─────────────────────────────────────────────────────────

type Tab = "dashboard" | "patterns" | "insights" | "recommendations";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "patterns", label: "Patterns", icon: Brain },
  { id: "insights", label: "Insights", icon: Lightbulb },
  { id: "recommendations", label: "Recommendations", icon: Target },
];

// ─── Props ──────────────────────────────────────────────────────────────

interface LearningStudioProps {
  workspaceId?: string;
}

// ─── Component ──────────────────────────────────────────────────────────

export function LearningStudio({ workspaceId }: LearningStudioProps) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dashboardData, setDashboardData] = useState(LearningStore.getDashboardData());

  const refresh = useCallback(() => {
    setPatterns(LearningStore.getPatterns());
    setInsights(LearningStore.getInsights());
    setRecommendations(LearningStore.getRecommendations());
    setDashboardData(LearningStore.getDashboardData());
  }, []);

  useEffect(() => {
    refresh();
    const unsub = LearningStore.subscribe(refresh);
    return unsub;
  }, [refresh]);

  const handleDiscoverPatterns = () => {
    // Simulate pattern discovery from existing Outcomes
    const newPattern = LearningStore.createPattern({
      title: `Pattern ${patterns.length + 1}`,
      description: "A discovered pattern from outcome analysis.",
      evidenceIds: [],
      occurrenceCount: 1,
      confidence: 0.6,
      lastObserved: new Date(),
      category: "general",
    });
    LearningStore.createRecord({
      outcomeIds: [],
      patternIds: [newPattern.id],
      confidenceDelta: 0.6,
      description: "Initial pattern discovery.",
      confidence: 0.6,
    });
  };

  const handleGenerateInsights = () => {
    const newInsights = LearningStore.generateInsightsFromPatterns();
    newInsights.forEach((i) => LearningStore.createInsight(i));
  };

  const handleGenerateRecommendations = () => {
    const newRecs = LearningStore.generateRecommendationsFromInsights();
    newRecs.forEach((r) => LearningStore.createRecommendation(r));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Learning Studio</h1>
          <p className="text-xs text-zinc-600 mt-0.5">Discover patterns, generate insights, and track recommendations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDiscoverPatterns}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
          >
            <Brain className="w-3.5 h-3.5" />
            Discover Pattern
          </button>
          <button
            onClick={handleGenerateInsights}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Insights
          </button>
          <button
            onClick={handleGenerateRecommendations}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
          >
            <Target className="w-3.5 h-3.5" />
            Generate Recommendations
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 transition-colors",
                activeTab === tab.id
                  ? "text-white border-white"
                  : "text-zinc-600 border-transparent hover:text-zinc-400",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "dashboard" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500">Total Patterns</p>
            <p className="text-2xl font-semibold text-white mt-1">{dashboardData.totalPatterns}</p>
          </div>
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500">Total Insights</p>
            <p className="text-2xl font-semibold text-white mt-1">{dashboardData.totalInsights}</p>
          </div>
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500">Total Recommendations</p>
            <p className="text-2xl font-semibold text-white mt-1">{dashboardData.totalRecommendations}</p>
          </div>
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500">Pattern Categories</p>
            <p className="text-2xl font-semibold text-white mt-1">{dashboardData.totalPatterns > 0 ? 'Active' : 'None'}</p>
          </div>
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500">Recent Activity</p>
            <p className="text-2xl font-semibold text-emerald-400 mt-1">{dashboardData.highConfidencePatterns}</p>
          </div>
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500">Active Recommendations</p>
            <p className="text-2xl font-semibold text-amber-400 mt-1">{dashboardData.activeRecommendations}</p>
          </div>
        </div>
      )}

      {activeTab === "patterns" && <PatternsView patterns={patterns} />}
      {activeTab === "insights" && <InsightsView insights={insights} />}
      {activeTab === "recommendations" && <RecommendationsView recommendations={recommendations} />}
    </div>
  );
}
