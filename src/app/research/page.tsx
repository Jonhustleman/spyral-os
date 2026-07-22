"use client";

import { useState, useRef, useEffect } from "react";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";
import Link from "next/link";
import { motion } from "framer-motion";
import { Send, FileText, ClipboardList, Lightbulb, TrendingUp, AlertTriangle, Target, ChevronDown, ChevronUp, Copy, Check, Download, Home, Brain, FlaskConical, BookText, Atom, FileSpreadsheet, Scale, Network, Zap, Eye, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpyralCognitiveCore, type ResearchMode, type CognitiveResponse } from "@/core";

// ─── Message types ─────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "agent" | "user";
  content: string;
  timestamp: Date;
};

// ─── Research Session ─────────────────────────────────────────────────────

type ResearchSession = {
  id: string;
  topic: string;
  mode: ResearchMode;
  response: CognitiveResponse;
  timestamp: number;
};

// ─── Session management ──────────────────────────────────────────────────────

const SESSIONS_KEY = "spyral-research-sessions";

function loadSessions(): ResearchSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSession(session: ResearchSession) {
  const sessions = loadSessions();
  sessions.unshift(session);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, 20)));
}

// ─── Research Modes ─────────────────────────────────────────────────────────

const RESEARCH_MODES = SpyralCognitiveCore.getResearchModes();

// ─── Research Agent Page ────────────────────────────────────────────────────

export default function ResearchAgentPage() {
  const [prompt, setPrompt] = useState("");
  const [researchMode, setResearchMode] = useState<ResearchMode>("discovery");
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      content: "I'm your SPYRAL Research Partner.\n\nWe are not searching for answers.\nWe are discovering them together.\n\nTell me — what would you like to investigate?",
      timestamp: new Date(),
    },
  ]);
  const [savedSessions, setSavedSessions] = useState<ResearchSession[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [lastResponse, setLastResponse] = useState<CognitiveResponse | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showMentalModel, setShowMentalModel] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
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
    setSavedSessions(loadSessions());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSavedSession = (session: ResearchSession) => {
    setLastResponse(session.response);
    setResearchMode(session.mode);
    setMessages([
      {
        id: "welcome",
        role: "agent",
        content: "I'm your SPYRAL Research Partner.\n\nWe are not searching for answers.\nWe are discovering them together.\n\nTell me — what would you like to investigate?",
        timestamp: new Date(),
      },
      {
        id: `user-${session.timestamp}`,
        role: "user",
        content: session.topic,
        timestamp: new Date(session.timestamp),
      },
      {
        id: `agent-${session.timestamp}`,
        role: "agent",
        content: session.response.response,
        timestamp: new Date(session.timestamp),
      },
    ]);
    setShowSessions(false);
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || isThinking) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    // Use the Cognitive Core — this is the ONLY way research responses are generated
    const cognitiveResponse = SpyralCognitiveCore.think({
      input: prompt,
      agentType: "research",
      researchMode,
    });

    setLastResponse(cognitiveResponse);

    // Auto-save session
    const session: ResearchSession = {
      id: `session-${Date.now()}`,
      topic: prompt,
      mode: researchMode,
      response: cognitiveResponse,
      timestamp: Date.now(),
    };
    saveSession(session);
    setSavedSessions(loadSessions());

    const agentMsg: Message = {
      id: `agent-${Date.now()}`,
      role: "agent",
      content: cognitiveResponse.response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, agentMsg]);
    setIsThinking(false);
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const currentModeInfo = RESEARCH_MODES.find((m) => m.id === researchMode)!;

  // ── Cognitive Pipeline Sections ───────────────────────────────────────

  const pipelineSections = lastResponse
    ? [
        {
          key: "understanding",
          label: "SPYRAL's Understanding",
          icon: Brain,
          content: <p className="text-sm text-zinc-300 leading-relaxed">{lastResponse.understanding}</p>,
        },
        {
          key: "mental",
          label: "Mental Model",
          icon: Eye,
          content: (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                <p className="text-zinc-500 text-xs mb-1">Current Reality</p>
                <p className="text-zinc-300">{lastResponse.mentalModel.currentReality}</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                <p className="text-zinc-500 text-xs mb-1">Desired Reality</p>
                <p className="text-zinc-300">{lastResponse.mentalModel.desiredReality}</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                <p className="text-zinc-500 text-xs mb-1">Goal</p>
                <p className="text-zinc-300">{lastResponse.mentalModel.goal}</p>
              </div>
            </div>
          ),
        },
        {
          key: "sop",
          label: "SOP — Separated Constructs",
          icon: ListChecks,
          content: (
            <div className="space-y-2 text-sm">
              <p className="text-zinc-400 font-medium">Facts:</p>
              {lastResponse.sop.facts.map((f, i) => (
                <div key={`fact-${i}`} className="flex items-start gap-2 p-2 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-zinc-300">{f}</span>
                </div>
              ))}
              <p className="text-zinc-400 font-medium mt-3">Assumptions:</p>
              {lastResponse.sop.assumptions.map((a, i) => (
                <div key={`assump-${i}`} className="flex items-start gap-2 p-2 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <span className="text-amber-400 mt-0.5">!</span>
                  <span className="text-zinc-300">{a}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "lde",
          label: "LDE — Layered Decomposition",
          icon: Network,
          content: (
            <div className="space-y-2 text-sm">
              <p className="text-zinc-400 font-medium">Patterns:</p>
              {lastResponse.lde.patterns.map((p, i) => (
                <div key={`pat-${i}`} className="flex items-start gap-2 p-2 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <TrendingUp className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                  <span className="text-zinc-300">{p}</span>
                </div>
              ))}
              <p className="text-zinc-400 font-medium mt-3">Hidden Variables:</p>
              {lastResponse.lde.hiddenVariables.map((h, i) => (
                <div key={`hv-${i}`} className="flex items-start gap-2 p-2 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <span className="text-amber-400 mt-0.5">?</span>
                  <span className="text-zinc-300">{h}</span>
                </div>
              ))}
              <p className="text-zinc-400 font-medium mt-3">Root Causes:</p>
              {lastResponse.lde.rootCauses.map((r, i) => (
                <div key={`rc-${i}`} className="flex items-start gap-2 p-2 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <span className="text-red-400 mt-0.5">→</span>
                  <span className="text-zinc-300">{r}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "ste",
          label: "STE — Strategic Trajectories",
          icon: Target,
          content: (
            <div className="space-y-3">
              {lastResponse.ste.strategies.map((s, i) => (
                <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-sm">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-white font-medium">{s.title}</span>
                    <span className={cn(
                      "shrink-0 text-xs px-2 py-0.5 rounded-full",
                      s.probability >= 0.8 ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                      s.probability >= 0.7 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    )}>
                      {Math.round(s.probability * 100)}%
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs mb-2">{s.description.substring(0, 120)}...</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-green-400">+{s.advantages.length} advantages</span>
                    <span className="text-xs text-red-400">-{s.disadvantages.length} disadvantages</span>
                  </div>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "sve",
          label: "SVE — Validation & Evaluation",
          icon: AlertTriangle,
          content: (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/40 mb-2">
                <span className="text-zinc-400">Confidence</span>
                <span className={cn(
                  "font-bold",
                  lastResponse.sve.confidence >= 0.8 ? "text-green-400" :
                  lastResponse.sve.confidence >= 0.6 ? "text-amber-400" :
                  "text-blue-400"
                )}>
                  {Math.round(lastResponse.sve.confidence * 100)}%
                </span>
              </div>
              <p className="text-zinc-400 font-medium">Supporting Evidence:</p>
              {lastResponse.sve.supportingEvidence.map((e, i) => (
                <div key={`se-${i}`} className="flex items-start gap-2 p-2 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-zinc-300">{e}</span>
                </div>
              ))}
              <p className="text-zinc-400 font-medium mt-3">Contradicting Evidence:</p>
              {lastResponse.sve.contradictingEvidence.map((c, i) => (
                <div key={`ce-${i}`} className="flex items-start gap-2 p-2 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span className="text-zinc-300">{c}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "sae",
          label: "SAE — Strategic Actions",
          icon: Zap,
          content: (
            <div className="space-y-2 text-sm">
              {lastResponse.sae.immediateActions.map((a, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <span className="text-blue-400 mt-0.5">{i + 1}.</span>
                  <div>
                    <p className="text-zinc-300">{a.action}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{a.timeframe} · {a.effort} effort · {a.impact} impact</p>
                  </div>
                </div>
              ))}
            </div>
          ),
        },
      ]
    : [];

  const renderModeSelector = () => (
    <div className="flex flex-wrap gap-2 mb-3">
      {RESEARCH_MODES.map((mode) => {
        const isActive = researchMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => { setResearchMode(mode.id); setShowModeSelector(false); }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              isActive
                ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                : "bg-zinc-800/50 text-zinc-500 border border-zinc-800 hover:text-zinc-300 hover:bg-zinc-800"
            )}
            title={mode.description}
          >
            <span>{mode.icon}</span>
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔬</span>
            <div>
              <h1 className="text-lg font-semibold text-white">Research Agent</h1>
              <p className="text-xs text-zinc-500">
                {researchMode !== "discovery" ? `${currentModeInfo.icon} ${currentModeInfo.label}` : "Discovering truth together"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModeSelector(!showModeSelector)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-sm"
            >
              <span>{currentModeInfo.icon}</span>
              <span className="hidden sm:inline">{currentModeInfo.label}</span>
            </button>
            {savedSessions.length > 0 && (
              <button
                onClick={() => setShowSessions(!showSessions)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-sm"
              >
                <ClipboardList className="h-4 w-4" />
                Sessions ({savedSessions.length})
              </button>
            )}
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-sm"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
          </div>
        </div>
        {showModeSelector && renderModeSelector()}
      </div>

      {/* Sessions Panel */}
      {showSessions && savedSessions.length > 0 && (
        <div className="border-b border-zinc-800 bg-zinc-900/30 px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wider">Saved Research Sessions</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {savedSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => loadSavedSession(session)}
                  className="w-full text-left p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white truncate">{session.topic}</p>
                    <span className="text-xs text-zinc-600">{session.mode !== "discovery" ? RESEARCH_MODES.find(m => m.id === session.mode)?.icon : ""}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {new Date(session.timestamp).toLocaleDateString()} · Confidence: {Math.round(session.response.confidence * 100)}%
                  </p>
                </button>
              ))}
            </div>
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
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <span className="text-sm">{researchMode !== "discovery" ? currentModeInfo.icon : "🔬"}</span>
              </div>
            )}
            <div
              className={cn(
                "rounded-xl px-4 py-3 text-sm whitespace-pre-wrap",
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

      {/* Cognitive Pipeline — SPYRAL's reasoning visualized */}
      {lastResponse && (
        <div className="border-t border-zinc-800 px-6 py-4 overflow-y-auto max-h-[50vh]">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Confidence banner */}
            <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900/50 mb-2">
              <span className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                SPYRAL Confidence
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      lastResponse.confidence >= 0.8 ? "bg-green-500" :
                      lastResponse.confidence >= 0.6 ? "bg-amber-500" :
                      "bg-blue-500"
                    )}
                    style={{ width: `${Math.round(lastResponse.confidence * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-white">{Math.round(lastResponse.confidence * 100)}%</span>
              </div>
              <button
                onClick={() => setShowMentalModel(!showMentalModel)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showMentalModel ? "Hide Mental Model" : "Show Mental Model"}
              </button>
            </div>

            {/* Mental Model (hidden by default) */}
            {showMentalModel && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 mb-2">
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">SPYRAL Mental Model</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-zinc-600 text-xs mb-1">Current Reality</p>
                    <p className="text-zinc-300">{lastResponse.mentalModel.currentReality}</p>
                  </div>
                  <div>
                    <p className="text-zinc-600 text-xs mb-1">Desired Reality</p>
                    <p className="text-zinc-300">{lastResponse.mentalModel.desiredReality}</p>
                  </div>
                  <div>
                    <p className="text-zinc-600 text-xs mb-1">Constraints</p>
                    <ul className="list-disc list-inside text-zinc-300">
                      {lastResponse.mentalModel.constraints.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-zinc-600 text-xs mb-1">Unknowns</p>
                    <ul className="list-disc list-inside text-zinc-300">
                      {lastResponse.mentalModel.unknownVariables.map((u, i) => <li key={i}>{u}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Pipeline Sections */}
            {pipelineSections.map((section) => {
              const Icon = section.icon;
              const isOpen = expandedSections[section.key] ?? (section.key === "understanding" || section.key === "sve");
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
                  const text = JSON.stringify(lastResponse, null, 2);
                  copyToClipboard(text, "export-cognitive");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Export Cognitive Output
              </button>
              {copiedField === "export-cognitive" && <span className="text-xs text-green-400">Copied!</span>}
            </div>
          </div>
        </div>
      )}

      {/* Thinking indicator */}
      {isThinking && (
        <div className="border-t border-zinc-800 px-6 py-3">
          <div className="max-w-3xl mx-auto">
            <ThinkingIndicator isThinking={isThinking} />
          </div>
        </div>
      )}

      {/* Input area */}
      {!isThinking && (
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
              disabled={!prompt.trim() || isThinking}
              className="shrink-0 h-10 w-10 rounded-xl bg-white text-black flex items-center justify-center hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
