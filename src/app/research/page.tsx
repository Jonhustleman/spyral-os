"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Send, FileText, ClipboardList, Lightbulb, TrendingUp, AlertTriangle, Target, ChevronDown, ChevronUp, Copy, Check, Download, Home } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Message types ─────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "agent" | "user";
  content: string;
  timestamp: Date;
};

// ─── Research Report ────────────────────────────────────────────────────────

type ResearchReport = {
  topic: string;
  executiveSummary: string;
  keyFindings: { finding: string; confidence: string; evidence: string; }[];
  assumptions: string[];
  patterns: { pattern: string; significance: string; }[];
  hypotheses: { hypothesis: string; testability: string; confidence: string; }[];
  gaps: string[];
  confidenceScore: string;
  nextResearch: string[];
};

// ─── Sample report generator ────────────────────────────────────────────────

function generateReport(topic: string): ResearchReport {
  return {
    topic,
    executiveSummary: `Research into "${topic}" reveals several key patterns and insights. The analysis identifies ${Math.floor(Math.random() * 3) + 3} major findings with varying confidence levels, ${Math.floor(Math.random() * 2) + 2} underlying assumptions that need validation, and actionable hypotheses for further investigation. Overall confidence in the findings is moderate to high, with several clear next steps identified.`,
    keyFindings: [
      {
        finding: `The landscape around "${topic}" is evolving rapidly with multiple converging trends`,
        confidence: "High (80-90%)",
        evidence: "Multiple independent sources confirm this trajectory with consistent data points",
      },
      {
        finding: `Key stakeholders in this space are prioritizing efficiency and scalability`,
        confidence: "Medium-High (70-80%)",
        evidence: "Industry reports and expert commentary indicate a shift toward streamlined operations",
      },
      {
        finding: `Technology adoption is a critical enabler but not the primary differentiator`,
        confidence: "Medium (60-70%)",
        evidence: "Case studies show that execution and strategy matter more than technology choice",
      },
      {
        finding: `Market dynamics are creating both opportunities and risks for new entrants`,
        confidence: "Medium (60-70%)",
        evidence: "Market analysis shows increasing fragmentation with consolidation trends",
      },
      {
        finding: `Successful approaches in this area share common patterns of iterative execution`,
        confidence: "High (80-90%)",
        evidence: "Longitudinal studies of successful initiatives reveal consistent methodology patterns",
      },
    ],
    assumptions: [
      `Current resources and capabilities are sufficient to act on "${topic}"`,
      "Stakeholder alignment can be achieved with the right approach",
      "Market conditions will remain relatively stable during the execution period",
      "Key information needed for decisions can be obtained through structured research",
    ],
    patterns: [
      {
        pattern: "Early adopters who move quickly tend to capture disproportionate value",
        significance: "High - suggests speed of execution is a critical success factor",
      },
      {
        pattern: "Initiatives that combine multiple approaches outperform single-strategy efforts",
        significance: "Medium-High - indicates need for integrated, multi-modal strategies",
      },
      {
        pattern: "Organizations that invest in measurement and feedback loops adapt faster",
        significance: "Medium - confirms importance of validation infrastructure",
      },
    ],
    hypotheses: [
      {
        hypothesis: `A focused, phased approach to "${topic}" will yield better results than an aggressive broad strategy`,
        testability: "Testable through controlled pilot vs. broad launch comparison",
        confidence: "70% - supported by pattern analysis but needs validation",
      },
      {
        hypothesis: "Investing in stakeholder alignment upfront will reduce execution friction by at least 30%",
        testability: "Measurable through time-to-milestone comparison across similar initiatives",
        confidence: "65% - logical but not yet validated in this specific context",
      },
    ],
    gaps: [
      "Specific baseline metrics for the current state are not yet available",
      "Detailed competitive landscape data needs further investigation",
      "Stakeholder sentiment and alignment levels are not yet measured",
      "Resource availability and constraints need confirmation",
    ],
    confidenceScore: "72%",
    nextResearch: [
      "Conduct primary research to validate key assumptions",
      "Survey stakeholders to assess alignment and gather perspectives",
      "Analyze competitive landscape in more detail",
      "Build baseline metrics for tracking progress",
      "Identify and interview domain experts for deeper insights",
    ],
  };
}

// ─── Research Agent Page ────────────────────────────────────────────────────

export default function ResearchAgentPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      content: "What would you like to investigate?",
      timestamp: new Date(),
    },
  ]);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = () => {
    if (!prompt.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);

    const r = generateReport(prompt);
    setReport(r);

    const agentMsg: Message = {
      id: `agent-${Date.now()}`,
      role: "agent",
      content: `I've completed the research on "${prompt}". Here's a structured report with findings, analysis, and recommendations.`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, agentMsg]);
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── Report sections ───────────────────────────────────────────────────

  const reportSections = report
    ? [
        {
          key: "summary",
          label: "Executive Summary",
          icon: FileText,
          content: <p className="text-sm text-zinc-300 leading-relaxed">{report.executiveSummary}</p>,
        },
        {
          key: "findings",
          label: "Key Findings",
          icon: ClipboardList,
          content: (
            <div className="space-y-3">
              {report.keyFindings.map((f, i) => (
                <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-sm">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-white font-medium">{f.finding}</span>
                    <span className={cn(
                      "shrink-0 text-xs px-2 py-0.5 rounded-full",
                      f.confidence.includes("High") ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                      f.confidence.includes("Medium") ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    )}>
                      {f.confidence}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs">{f.evidence}</p>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "assumptions",
          label: "Assumptions",
          icon: Lightbulb,
          content: (
            <div className="space-y-2">
              {report.assumptions.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <span className="text-amber-400 mt-0.5">!</span>
                  <span className="text-zinc-300">{a}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "patterns",
          label: "Patterns",
          icon: TrendingUp,
          content: (
            <div className="space-y-3">
              {report.patterns.map((p, i) => (
                <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-sm">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-white font-medium">{p.pattern}</span>
                    <span className={cn(
                      "shrink-0 text-xs px-2 py-0.5 rounded-full",
                      p.significance.includes("High") ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                      "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    )}>
                      {p.significance.split(" - ")[0]}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs">{p.significance}</p>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "hypotheses",
          label: "Hypotheses",
          icon: Target,
          content: (
            <div className="space-y-3">
              {report.hypotheses.map((h, i) => (
                <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-white font-medium">{h.hypothesis}</span>
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {h.confidence}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs">Testability: {h.testability}</p>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "gaps",
          label: "Information Gaps",
          icon: AlertTriangle,
          content: (
            <div className="space-y-2">
              {report.gaps.map((g, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <span className="text-red-400 mt-0.5">△</span>
                  <span className="text-zinc-300">{g}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "next",
          label: "Suggested Next Research",
          icon: TrendingUp,
          content: (
            <div className="space-y-1.5">
              {report.nextResearch.map((n, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-400 mt-0.5">{i + 1}.</span>
                  <span className="text-zinc-300">{n}</span>
                </div>
              ))}
            </div>
          ),
        },
      ]
    : [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔬</span>
            <div>
              <h1 className="text-lg font-semibold text-white">Research Agent</h1>
              <p className="text-xs text-zinc-500">SPYRAL AI Research & Intelligence</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-sm"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-2xl",
              msg.role === "user" ? "ml-auto" : ""
            )}
          >
            {msg.role === "agent" && (
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <span className="text-sm">🔬</span>
              </div>
            )}
            <div
              className={cn(
                "rounded-xl px-4 py-3 text-sm",
                msg.role === "agent"
                  ? "bg-zinc-900/60 border border-zinc-800 text-zinc-300"
                  : "bg-blue-500/10 border border-blue-500/20 text-zinc-200"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Research Report */}
      {report && (
        <div className="border-t border-zinc-800 px-6 py-4 overflow-y-auto max-h-[50vh]">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Confidence score banner */}
            <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900/50 mb-2">
              <span className="text-sm font-medium text-zinc-300">Overall Confidence</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      parseInt(report.confidenceScore) >= 80 ? "bg-green-500" :
                      parseInt(report.confidenceScore) >= 60 ? "bg-amber-500" :
                      "bg-blue-500"
                    )}
                    style={{ width: report.confidenceScore }}
                  />
                </div>
                <span className="text-sm font-bold text-white">{report.confidenceScore}</span>
              </div>
            </div>

            {reportSections.map((section) => {
              const Icon = section.icon;
              const isOpen = expandedSections[section.key] ?? (section.key === "summary" || section.key === "findings");
              return (
                <div key={section.key} className="rounded-lg border border-zinc-800 bg-zinc-900/30 overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-zinc-500" />
                      <span>{section.label}</span>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-zinc-600" /> : <ChevronDown className="h-4 w-4 text-zinc-600" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4">
                      {section.content}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Export */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  const text = reportSections.map(s => `${s.label}\n${s.content?.props?.children || ''}`).join('\n\n');
                  copyToClipboard(text, "export-all");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Export Report
              </button>
              <button
                onClick={() => copyToClipboard(JSON.stringify(report, null, 2), "export-json")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy JSON
              </button>
              {copiedField === "export-all" && <span className="text-xs text-green-400">Copied!</span>}
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-zinc-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What would you like to investigate?"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-700 transition-colors"
            rows={1}
          />
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            className="shrink-0 h-10 w-10 rounded-xl bg-white text-black flex items-center justify-center hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
