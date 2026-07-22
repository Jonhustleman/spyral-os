"use client";

import { useState, useRef, useEffect } from "react";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";
import Link from "next/link";
import { Send, Home, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpyralCognitiveCore } from "@/core";
import { SpyralSession } from "@/features/session";

// ─── Message types ─────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "agent" | "user";
  content: string;
  timestamp: Date;
};

// ─── Investigation ─────────────────────────────────────────────────────────

type InvestigationItem = {
  question: string;
  hypotheses: string[];
  evidence: string[];
  unknowns: string[];
  experiments: string[];
  followUp: string;
  timestamp: number;
};

// ─── Research Agent Page ────────────────────────────────────────────────────

export default function ResearchAgentPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      content: "I'm your research partner — not an answer machine.\n\nLet's explore ideas, challenge assumptions, and discover what's really going on.\n\nWhat would you like to investigate together?",
      timestamp: new Date(),
    },
  ]);
  const [investigations, setInvestigations] = useState<InvestigationItem[]>([]);
  const [showInvestigations, setShowInvestigations] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load past investigations from SpyralSession
  useEffect(() => {
    SpyralSession.init();
    const stored = SpyralSession.getInvestigations();
    if (stored && stored.length > 0) {
      setInvestigations(stored.map((inv) => ({
        question: inv.question,
        hypotheses: inv.competingHypotheses,
        evidence: inv.evidence,
        unknowns: inv.unknownVariables,
        experiments: inv.experiments.map((e) => e.name),
        followUp: inv.nextInvestigation,
        timestamp: inv.createdAt,
      })));
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadInvestigation = (inv: InvestigationItem) => {
    setMessages([
      {
        id: "welcome",
        role: "agent",
        content: "I'm your research partner — not an answer machine.\n\nLet's explore ideas, challenge assumptions, and discover what's really going on.\n\nWhat would you like to investigate together?",
        timestamp: new Date(),
      },
      {
        id: `user-${inv.timestamp}`,
        role: "user",
        content: inv.question,
        timestamp: new Date(inv.timestamp),
      },
    ]);
    setShowInvestigations(false);
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

    // Use the Cognitive Core
    const cognitiveResponse = SpyralCognitiveCore.think({
      input: prompt,
      agentType: "research",
      researchMode: "discovery",
    });

    // Build investigation structure
    const inv: InvestigationItem = {
      question: prompt,
      hypotheses: cognitiveResponse.sop.facts.slice(0, 3).map(f => f) || [
        "Exploring initial hypothesis based on your question",
        "Considering alternative explanations",
        "Looking for underlying patterns",
      ],
      evidence: cognitiveResponse.sop.assumptions.slice(0, 3).map(a => a) || [
        "Gathering initial observations",
        "Reviewing known information",
      ],
      unknowns: cognitiveResponse.lde.hiddenVariables.slice(0, 3).map(h => h) || [
        "What information might we be missing?",
        "Are there factors we haven't considered?",
      ],
      experiments: cognitiveResponse.sae.immediateActions.slice(0, 3).map(a => a.action) || [
        "Investigate deeper into the patterns discovered",
        "Seek alternative perspectives on this topic",
      ],
      followUp: `Based on what we've learned, I'd ask: What new questions does this raise for you?`,
      timestamp: Date.now(),
    };

    // Auto-save to SpyralSession
    SpyralSession.init();
    SpyralSession.startInvestigation(prompt, `Research: ${prompt.slice(0, 60)}`);

    const allInvestigations = SpyralSession.getInvestigations();
    setInvestigations(allInvestigations.map((i) => ({
      question: i.question,
      hypotheses: i.competingHypotheses,
      evidence: i.evidence,
      unknowns: i.unknownVariables,
      experiments: i.experiments.map((e) => e.name),
      followUp: i.nextInvestigation,
      timestamp: i.createdAt,
    })));

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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔬</span>
            <div>
              <h1 className="text-lg font-semibold text-white">Research</h1>
              <p className="text-xs text-zinc-500">Investigation never finishes — it only deepens</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {investigations.length > 0 && (
              <button
                onClick={() => setShowInvestigations(!showInvestigations)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-sm"
              >
                <Clock className="h-4 w-4" />
                Past Investigations ({investigations.length})
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
