"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Send, FileText, Activity, Search, Target, AlertTriangle, TrendingUp, Zap, Calendar, ArrowRight, ChevronDown, ChevronUp, Copy, Check, Download, Home, Clock, ClipboardList, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Message types ─────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "agent" | "user";
  content: string;
  timestamp: Date;
};

// ─── Consultant Report ──────────────────────────────────────────────────────

type ConsultantReport = {
  situation: string;
  executiveSummary: string;
  diagnosis: string;
  rootCause: string;
  recommendations: { recommendation: string; impact: string; effort: string; timeframe: string; }[];
  priorityMatrix: { quadrant: string; items: string[]; }[];
  risks: string[];
  opportunities: string[];
  roadmap: { phase: string; timeframe: string; actions: string[]; }[];
  immediateActions: string[];
};

// ─── Sample consultant report generator ────────────────────────────────────

function generateConsultantReport(situation: string): ConsultantReport {
  const domain = situation.toLowerCase().includes("revenue") || situation.toLowerCase().includes("growth") || situation.toLowerCase().includes("business") ? "business"
    : situation.toLowerCase().includes("market") || situation.toLowerCase().includes("brand") || situation.toLowerCase().includes("audience") ? "marketing"
    : situation.toLowerCase().includes("content") || situation.toLowerCase().includes("social") ? "content"
    : situation.toLowerCase().includes("team") || situation.toLowerCase().includes("operation") || situation.toLowerCase().includes("process") ? "operations"
    : situation.toLowerCase().includes("product") || situation.toLowerCase().includes("feature") ? "product"
    : situation.toLowerCase().includes("career") || situation.toLowerCase().includes("job") ? "career"
    : "strategic";

  return {
    situation,
    executiveSummary: `After analyzing your situation regarding "${situation}", I've identified key strategic considerations and actionable recommendations. The assessment reveals ${Math.floor(Math.random() * 2) + 2} critical areas requiring attention, with several high-impact opportunities available in the near term. The recommended approach balances quick wins with sustainable long-term strategy.`,
    diagnosis: `The ${domain} landscape reveals an interesting tension between current capabilities and desired outcomes. Your situation suggests that the primary constraint isn't resources or capability — it's the alignment between strategy and execution. The gap between where you are and where you want to be is bridgeable with the right approach.`,
    rootCause: `Analysis suggests the root cause is a combination of: (1) Lack of structured approach to ${domain} challenges, (2) Insufficient feedback loops to validate assumptions, and (3) Resources not optimally allocated toward highest-impact activities. These factors compound each other, creating a cycle that's difficult to break without external perspective.`,
    recommendations: [
      {
        recommendation: `Implement a structured ${domain} strategy with clear milestones and metrics`,
        impact: "High - addresses the core alignment issue",
        effort: "Medium - requires upfront planning but manageable",
        timeframe: "2-4 weeks to design, ongoing execution",
      },
      {
        recommendation: "Establish weekly review cycles to validate progress and adapt approach",
        impact: "High - creates accountability and enables course correction",
        effort: "Low - time investment with high return",
        timeframe: "Immediate - can start this week",
      },
      {
        recommendation: "Reallocate resources toward highest-impact activities based on data",
        impact: "Medium-High - optimizes existing resources",
        effort: "Medium - requires analysis and stakeholder alignment",
        timeframe: "4-6 weeks for full reallocation",
      },
      {
        recommendation: "Build measurement infrastructure to track key metrics",
        impact: "Medium - enables data-driven decisions",
        effort: "Medium - requires tooling and process setup",
        timeframe: "2-8 weeks depending on complexity",
      },
      {
        recommendation: "Engage key stakeholders in a structured alignment process",
        impact: "High - reduces friction and speeds execution",
        effort: "Low-Medium - facilitated conversations",
        timeframe: "1-3 weeks",
      },
    ],
    priorityMatrix: [
      {
        quadrant: "High Impact / Low Effort — Do First",
        items: [
          "Establish weekly review cycles",
          "Engage stakeholders in alignment process",
          "Define clear success metrics for current initiatives",
        ],
      },
      {
        quadrant: "High Impact / High Effort — Plan",
        items: [
          "Implement structured strategy with milestones",
          "Build comprehensive measurement infrastructure",
          "Reallocate resources optimally",
        ],
      },
      {
        quadrant: "Low Impact / Low Effort — Quick Wins",
        items: [
          "Document current processes and identify inefficiencies",
          "Set up basic tracking and reporting",
          "Schedule regular check-ins with team",
        ],
      },
      {
        quadrant: "Low Impact / High Effort — Deprioritize",
        items: [
          "Major organizational restructuring",
          "Full technology platform overhaul",
          "Large-scale hiring initiatives",
        ],
      },
    ],
    risks: [
      "Stakeholder fatigue if too many changes are introduced simultaneously",
      "Loss of momentum if quick wins are not achieved early",
      "Resource constraints may limit execution capacity",
      "External market factors beyond your control",
      "Analysis paralysis from too much data without clear action framework",
    ],
    opportunities: [
      "Quick wins in the first 30 days can build momentum and confidence",
      "Existing team capabilities are likely underutilized",
      "Market conditions may favor early movers in your space",
      "Technology leverage can amplify resource efficiency",
      "Partnerships and collaborations can accelerate progress",
    ],
    roadmap: [
      {
        phase: "Foundation",
        timeframe: "Days 1-30",
        actions: [
          "Define clear success criteria and metrics",
          "Establish weekly review cadence",
          "Identify and launch first quick win initiative",
          "Stakeholder alignment sessions",
          "Set up basic tracking infrastructure",
        ],
      },
      {
        phase: "Momentum",
        timeframe: "Days 31-60",
        actions: [
          "Launch primary initiative based on strategy",
          "Begin resource reallocation process",
          "Collect baseline metrics and initial feedback",
          "Adjust approach based on early results",
        ],
      },
      {
        phase: "Scale",
        timeframe: "Days 61-90",
        actions: [
          "Scale what's working, pivot what's not",
          "Deepen measurement and analytics capability",
          "Expand successful initiatives",
          "Document learnings and update strategy",
        ],
      },
    ],
    immediateActions: [
      "Define your primary success metric for the next 30 days",
      "Schedule a stakeholder alignment conversation this week",
      "Identify one quick win you can execute in the next 48 hours",
      "Set up a simple tracking system for key metrics",
      "Block time for weekly strategy review on your calendar",
    ],
  };
}

// ─── Consultant Agent Page ─────────────────────────────────────────────────

export default function ConsultantAgentPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      content: "What challenge are we solving today?\n\nI'm your SPYRAL Strategic Advisor. I'll challenge assumptions, identify blind spots, explain tradeoffs, and help you make better decisions.\n\nShare your situation — business, career, product, or personal — and I'll provide an executive-level analysis.",
      timestamp: new Date(),
    },
  ]);
  const [report, setReport] = useState<ConsultantReport | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [savedSessions, setSavedSessions] = useState<{ prompt: string; timestamp: string }[]>([]);
  const [showSessions, setShowSessions] = useState(false);
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

  // Load saved sessions on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("spyral_consultant_sessions");
      if (saved) setSavedSessions(JSON.parse(saved));
    } catch {}
  }, []);

  // Save session after generating a report
  const saveSession = (prompt: string) => {
    const session = { prompt, timestamp: new Date().toISOString() };
    const updated = [session, ...savedSessions.filter(s => s.prompt !== prompt)].slice(0, 20);
    setSavedSessions(updated);
    try {
      localStorage.setItem("spyral_consultant_sessions", JSON.stringify(updated));
    } catch {}
  };

  const loadSession = (sessionPrompt: string) => {
    setPrompt(sessionPrompt);
    setShowSessions(false);
  };

  const deleteSession = (timestamp: string) => {
    const updated = savedSessions.filter(s => s.timestamp !== timestamp);
    setSavedSessions(updated);
    try {
      localStorage.setItem("spyral_consultant_sessions", JSON.stringify(updated));
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

    const r = generateConsultantReport(prompt);
    setReport(r);

    const agentMsg: Message = {
      id: `agent-${Date.now()}`,
      role: "agent",
      content: `I've analyzed your situation and prepared a comprehensive strategic assessment. Here's my analysis and recommendations.`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, agentMsg]);
    saveSession(prompt);
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
          key: "diagnosis",
          label: "Diagnosis",
          icon: Activity,
          content: <p className="text-sm text-zinc-300 leading-relaxed">{report.diagnosis}</p>,
        },
        {
          key: "rootCause",
          label: "Root Cause",
          icon: Search,
          content: <p className="text-sm text-zinc-300 leading-relaxed">{report.rootCause}</p>,
        },
        {
          key: "recommendations",
          label: "Strategic Recommendations",
          icon: Target,
          content: (
            <div className="space-y-3">
              {report.recommendations.map((r, i) => (
                <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-sm">
                  <div className="font-medium text-white mb-2">{r.recommendation}</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span><span className="text-zinc-600">Impact:</span> {r.impact}</span>
                    <span><span className="text-zinc-600">Effort:</span> {r.effort}</span>
                    <span><span className="text-zinc-600">Timeframe:</span> {r.timeframe}</span>
                  </div>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "priorities",
          label: "Priority Matrix",
          icon: Zap,
          content: (
            <div className="space-y-3">
              {report.priorityMatrix.map((q, i) => (
                <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-sm">
                  <p className={cn(
                    "font-medium mb-2",
                    q.quadrant.includes("Do First") ? "text-emerald-400" :
                    q.quadrant.includes("Plan") ? "text-blue-400" :
                    q.quadrant.includes("Quick") ? "text-amber-400" :
                    "text-zinc-500"
                  )}>{q.quadrant}</p>
                  <ul className="space-y-1">
                    {q.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-zinc-300">
                        <span className="text-zinc-600">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "risks",
          label: "Risks",
          icon: AlertTriangle,
          content: (
            <div className="space-y-2">
              {report.risks.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <span className="text-red-400 mt-0.5">!</span>
                  <span className="text-zinc-300">{r}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "opportunities",
          label: "Opportunities",
          icon: TrendingUp,
          content: (
            <div className="space-y-2">
              {report.opportunities.map((o, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <span className="text-emerald-400 mt-0.5">↑</span>
                  <span className="text-zinc-300">{o}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "roadmap",
          label: "90-Day Roadmap",
          icon: Calendar,
          content: (
            <div className="space-y-4">
              {report.roadmap.map((phase, i) => (
                <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{phase.phase}</span>
                    <span className="text-xs text-zinc-500">{phase.timeframe}</span>
                  </div>
                  <ul className="space-y-1">
                    {phase.actions.map((action, j) => (
                      <li key={j} className="flex items-start gap-2 text-zinc-300">
                        <span className="text-zinc-600 mt-0.5">→</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "actions",
          label: "Immediate Next Actions",
          icon: Zap,
          content: (
            <div className="space-y-2">
              {report.immediateActions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <span className="text-amber-400 mt-0.5 font-mono text-xs">{i + 1}.</span>
                  <span className="text-zinc-300">{action}</span>
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
            <span className="text-2xl">💼</span>
            <div>
              <h1 className="text-lg font-semibold text-white">Consultant Agent</h1>
              <p className="text-xs text-zinc-500">SPYRAL Elite Strategic Advisor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSessions(!showSessions)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-sm"
            >
              <ClipboardList className="h-4 w-4" />
              Sessions
              {savedSessions.length > 0 && (
                <span className="text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded-full">{savedSessions.length}</span>
              )}
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
      </div>

      {/* Sessions panel */}
      {showSessions && (
        <div className="border-b border-zinc-800 px-6 py-3 bg-zinc-900/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Saved Sessions ({savedSessions.length})</span>
            <button
              onClick={() => setShowSessions(false)}
              className="text-xs text-zinc-600 hover:text-zinc-400"
            >
              Close
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {savedSessions.length === 0 ? (
              <p className="text-xs text-zinc-600 py-2">No saved sessions yet</p>
            ) : (
              savedSessions.map((session) => (
                <div
                  key={session.timestamp}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 shrink-0 cursor-pointer hover:bg-zinc-700/50 transition-colors group"
                  onClick={() => loadSession(session.prompt)}
                >
                  <Clock className="h-3 w-3 text-zinc-500 shrink-0" />
                  <span className="text-xs text-zinc-300 truncate max-w-[200px]">{session.prompt}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(session.timestamp); }}
                    className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <span className="text-sm">💼</span>
              </div>
            )}
            <div
              className={cn(
                "rounded-xl px-4 py-3 text-sm",
                msg.role === "agent"
                  ? "bg-zinc-900/60 border border-zinc-800 text-zinc-300"
                  : "bg-emerald-500/10 border border-emerald-500/20 text-zinc-200"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Consultant Report */}
      {report && (
        <div className="border-t border-zinc-800 px-6 py-4 overflow-y-auto max-h-[50vh]">
          <div className="max-w-3xl mx-auto space-y-2">
            {reportSections.map((section) => {
              const Icon = section.icon;
              const isOpen = expandedSections[section.key] ?? (section.key === "summary" || section.key === "recommendations" || section.key === "actions");
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
            placeholder="Tell me about your situation..."
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
