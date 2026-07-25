"use client";

import { useState, useRef, useEffect } from "react";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";
import { DeveloperOverlay } from "@/components/dev/DeveloperOverlay";
import { WorkingMind } from "@/lib/working-mind";
import type { WorkingMindResult } from "@/lib/working-mind";
import Link from "next/link";
import { Send, Home, Bug } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Message types ─────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "agent" | "user";
  content: string;
  timestamp: Date;
};

// ─── Research Agent Page ────────────────────────────────────────────────────

export default function ResearchAgentPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      content: "What's the question that's been pulling at you? Not the easy one — the one that keeps coming back.",
      timestamp: new Date(),
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [lastResponse, setLastResponse] = useState<WorkingMindResult | null>(null);
  const [devModeEnabled, setDevModeEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("spyral_dev_mode") === "true";
      } catch {
        return false;
      }
    }
    return false;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    // Create a placeholder agent message — content will stream in
    const agentId = `agent-${Date.now()}`;
    const agentMsg: Message = {
      id: agentId,
      role: "agent",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, agentMsg]);

    // Stream the response via WorkingMind (server-side reasoning)
    let accumulatedContent = "";

    try {
      const stream = await WorkingMind.stream(prompt, "research", {
        conversation: {
          currentInvestigation: undefined,
          currentProject: undefined,
          currentStrategy: undefined,
          currentAssumptions: [],
          currentHypotheses: [],
          recentTopics: [],
          turnCount: 0,
        },
      });

      for await (const chunk of stream) {
        accumulatedContent += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === agentId
              ? { ...msg, content: accumulatedContent }
              : msg,
          ),
        );
      }

      const complete = await stream.complete();

      // Finalize with the formatted response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentId
            ? { ...msg, content: complete.response }
            : msg,
        ),
      );

      // Save for Developer Overlay
      setLastResponse(complete);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Reasoning failed";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentId
            ? { ...msg, content: msg.content + `\n\nError: ${errorMsg}` }
            : msg,
        ),
      );
    }

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
              <p className="text-xs text-zinc-500">Curiosity — not answers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !devModeEnabled;
                setDevModeEnabled(next);
                try {
                  localStorage.setItem("spyral_dev_mode", next ? "true" : "false");
                } catch {
                  // localStorage unavailable
                }
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-sm",
                devModeEnabled
                  ? "border-green-700 bg-green-900/40 text-green-400 hover:bg-green-900/60"
                  : "border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60",
              )}
              title="Toggle Developer Mode"
            >
              <Bug className="h-4 w-4" />
              <span className="hidden sm:inline">Dev</span>
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

      {/* Developer Overlay */}
      <DeveloperOverlay lastResponse={lastResponse} enabled={devModeEnabled} />

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
              placeholder="What's worth investigating?"
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
