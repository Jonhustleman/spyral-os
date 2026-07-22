"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Brain,
  Zap,
  FileText,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  Target,
  Network,
  BarChart3,
  Clock,
  Home,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type IntelligenceItem = {
  id: string;
  type: "pattern" | "strategy" | "principle" | "recommendation" | "research" | "prediction";
  title: string;
  description: string;
  confidence?: string;
  timestamp: string;
  tags: string[];
};

const MOCK_INTELLIGENCE: IntelligenceItem[] = [
  {
    id: "1",
    type: "pattern",
    title: "Early movers capture disproportionate value",
    description: "Across multiple domains, initiatives launched within the first 30 days of identifying an opportunity yield 3-5x returns compared to delayed execution.",
    confidence: "High (85%)",
    timestamp: "2 days ago",
    tags: ["execution", "timing", "strategy"],
  },
  {
    id: "2",
    type: "strategy",
    title: "Phased approach outperforms big-bang",
    description: "Strategies broken into 2-week feedback cycles with clear milestones show 67% higher success rates than comprehensive upfront planning.",
    confidence: "High (82%)",
    timestamp: "5 days ago",
    tags: ["execution", "validation", "agile"],
  },
  {
    id: "3",
    type: "principle",
    title: "Measurement infrastructure enables adaptation",
    description: "Teams that establish baseline metrics and tracking before executing can pivot 3x faster when assumptions prove wrong.",
    confidence: "Medium-High (75%)",
    timestamp: "1 week ago",
    tags: ["measurement", "adaptation", "infrastructure"],
  },
  {
    id: "4",
    type: "recommendation",
    title: "Invest in stakeholder alignment before resource commitment",
    description: "Projects with formal alignment sessions in week 1 experience 40% fewer scope changes and 25% faster delivery.",
    confidence: "Medium (70%)",
    timestamp: "1 week ago",
    tags: ["alignment", "stakeholders", "risk-reduction"],
  },
  {
    id: "5",
    type: "research",
    title: "Market analysis: AI tooling adoption curves",
    description: "Research into enterprise AI tooling adoption shows S-curve with inflection point at ~18 months. Early internal capability building correlates with competitive advantage.",
    confidence: "Medium (65%)",
    timestamp: "2 weeks ago",
    tags: ["research", "market", "AI", "adoption"],
  },
  {
    id: "6",
    type: "prediction",
    title: "Next 90 days: Consolidation phase expected",
    description: "Based on current trajectory, expect a consolidation phase where fragmented efforts converge. Organizations with clear positioning will capture market share.",
    confidence: "Medium (60%)",
    timestamp: "3 days ago",
    tags: ["prediction", "timeline", "market"],
  },
  {
    id: "7",
    type: "strategy",
    title: "Content-first approach for audience building",
    description: "Organizations that lead with valuable content before product pitches build 4-5x more engaged audiences. Trust precedes conversion.",
    confidence: "High (80%)",
    timestamp: "3 weeks ago",
    tags: ["content", "audience", "trust", "marketing"],
  },
  {
    id: "8",
    type: "pattern",
    title: "Failed strategies share common traits",
    description: "Analysis of failed strategies reveals: unclear success criteria, no feedback loops, single-point-of-failure dependencies, and no adaptation mechanism.",
    confidence: "High (88%)",
    timestamp: "1 month ago",
    tags: ["failure-analysis", "patterns", "risk"],
  },
  {
    id: "9",
    type: "principle",
    title: "Reality gaps compound over time",
    description: "The gap between current state and desired state widens exponentially when not actively managed. Small daily investments prevent massive future corrections.",
    confidence: "High (90%)",
    timestamp: "2 weeks ago",
    tags: ["reality-gap", "compounding", "maintenance"],
  },
];

export default function IntelligencePage() {
  const [filter, setFilter] = useState<"all" | IntelligenceItem["type"]>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const types = ["all", "pattern", "strategy", "principle", "recommendation", "research", "prediction"] as const;

  const filtered = filter === "all"
    ? MOCK_INTELLIGENCE
    : MOCK_INTELLIGENCE.filter((i) => i.type === filter);

  const typeConfig = {
    pattern: { label: "Patterns", icon: TrendingUp, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    strategy: { label: "Strategies", icon: Zap, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    principle: { label: "Principles", icon: Lightbulb, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    recommendation: { label: "Recommendations", icon: Target, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    research: { label: "Research", icon: FileText, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
    prediction: { label: "Predictions", icon: BarChart3, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  return (
    <div className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Intelligence</h1>
          <p className="text-sm text-zinc-500">
            Knowledge graph, patterns, strategies, and learned principles
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              filter === type
                ? "bg-white text-black"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            )}
          >
            {type === "all" ? "All" : typeConfig[type].label}
          </button>
        ))}
      </div>

      {/* Intelligence Items */}
      <div className="space-y-4">
        {filtered.map((item) => {
          const config = typeConfig[item.type];
          const Icon = config.icon;
          const isOpen = expanded === item.id;

          return (
            <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : item.id)}
                className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-zinc-800/50 transition-colors"
              >
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", config.color)}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-medium text-white truncate">{item.title}</h3>
                    <span className={cn(
                      "shrink-0 text-xs px-2 py-0.5 rounded-full",
                      item.confidence?.includes("High") ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                      item.confidence?.includes("Medium") ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    )}>
                      {item.confidence || "—"}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 truncate">{item.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-zinc-600">{item.timestamp}</span>
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded bg-zinc-800/50 text-zinc-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
              <div className={cn("px-5 pb-4 transition-all overflow-hidden", isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0")}>
                  <div className="border-t border-zinc-800 pt-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                      <span className="font-medium text-zinc-300">Full entry:</span>
                      <span>{item.description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(item.description, `intel-${item.id}`)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copied === `intel-${item.id}` ? <Check className="h-3.5 w-3.5 text-green-400" /> : "Copy"}
                      </button>
                      <span className="text-zinc-700 px-2">|</span>
                      <span className="text-zinc-600 text-xs">
                        Type: {typeConfig[item.type].label} • Confidence: {item.confidence || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>

      {/* Knowledge Graph placeholder */}
      <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
        <Network className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Knowledge Graph</h3>
        <p className="text-zinc-500 mb-4 max-w-md mx-auto">
          Visual knowledge graph showing connections between patterns, strategies, principles, and research findings.
        </p>
        <div className="flex items-center justify-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-400" /> Patterns: 3</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Strategies: 2</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Principles: 1</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" /> Recommendations: 1</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-400" /> Research: 1</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" /> Predictions: 1</span>
        </div>
      </div>

      {/* Archives */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-center">
          <FileText className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
          <h4 className="font-medium text-white mb-1">Research Archive</h4>
          <p className="text-sm text-zinc-500">Full research reports and findings</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-center">
          <BarChart3 className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
          <h4 className="font-medium text-white mb-1">Predictions Archive</h4>
          <p className="text-sm text-zinc-500">Historical predictions and outcomes</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-center">
          <Clock className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
          <h4 className="font-medium text-white mb-1">Reality Gap Trends</h4>
          <p className="text-sm text-zinc-500">Gap evolution over time</p>
        </div>
      </div>
    </div>
  );
}
