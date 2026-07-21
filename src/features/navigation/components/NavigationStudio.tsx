/**
 * NavigationStudio — The front door of SPYRAL OS.
 *
 * Per ADR-0046, this is the first product-layer capability.
 * Per ADR-0047, Navigation is conversational — it asks only the next necessary question.
 * Per ADR-0048, the UI is a projection of session state.
 *
 * Golden Rule: Never ask for information unless you can immediately use it.
 * Personality: Senior strategist, not an interviewer.
 * Three Moments of Delight: Recognition, Guidance, Continuity.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Compass, ArrowRight, Clock, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavigationStore } from "../navigation.store";
import { NavigationStage } from "@/kernel/contracts/NavigationStage";
import type { NavigationSession } from "@/kernel/contracts/NavigationSession";
import { WorkspaceStore } from "@/features/workspace";

// ─── Props ──────────────────────────────────────────────────────────────

interface NavigationStudioProps {
  workspaceId?: string;
}

// ─── Component ──────────────────────────────────────────────────────────

export function NavigationStudio({ workspaceId = "default" }: NavigationStudioProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState(searchParams.get("prompt") ?? "");
  const [activeSessions, setActiveSessions] = useState<NavigationSession[]>([]);
  const [recentDestinations, setRecentDestinations] = useState<NavigationSession[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(
    "Where do you want to go today—in reality?"
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setActiveSessions(NavigationStore.getActiveSessions());
    setRecentDestinations(NavigationStore.getRecentDestinations());
  }, []);

  useEffect(() => {
    refresh();
    const unsub = NavigationStore.subscribe(refresh);
    return unsub;
  }, [refresh]);

  const handleSubmitPrompt = () => {
    if (!prompt.trim()) return;

    setIsNavigating(true);
    const session = NavigationStore.createFromPrompt(prompt.trim(), workspaceId);
    setActiveSessionId(session.id);
    setPrompt("");

    // First clarifying question
    const q = NavigationStore.nextQuestion(session);
    setCurrentQuestion(q || "Great. Let's figure out what has to change to get you there.");
  };

  const handleAnswerQuestion = (answer: string) => {
    if (!activeSessionId || !answer.trim()) return;

    const session = NavigationStore.getById(activeSessionId);
    if (!session) return;

    // Add the answer to history
    NavigationStore.addTurn(activeSessionId, {
      role: "user",
      message: answer,
      timestamp: new Date(),
    });

    // Update context based on current stage
    const stage = session.stage;
    let contextUpdate: Record<string, any> = {};

    if (stage === NavigationStage.INTENT || stage === NavigationStage.CLARIFICATION) {
      // CLARIFICATION: just collect the target date, then proceed to REALITY/GAP
      if (!session.context.targetDate) {
        contextUpdate.targetDate = answer;
      }
    }

    NavigationStore.updateContext(activeSessionId, contextUpdate);

    // Transition through stages until we reach one that needs user input or has a route
    let current = NavigationStore.getById(activeSessionId)!;
    while (NavigationStore.canProceed(current)) {
      const nextStage = NavigationStore.next(current);
      NavigationStore.updateStage(activeSessionId, nextStage);
      NavigationStore.addTurn(activeSessionId, {
        role: "system",
        message: `Moving to ${nextStage.toLowerCase()} phase.`,
        timestamp: new Date(),
      });

      // Handle routing for dedicated stage pages
      if (nextStage === NavigationStage.REALITY) {
        setCurrentQuestion(null);
        const s = NavigationStore.getById(activeSessionId);
        if (s) {
          WorkspaceStore.create({
            name: s.prompt.length > 50 ? s.prompt.slice(0, 50) + "…" : s.prompt,
            type: "strategic",
            description: s.prompt,
            goal: s.prompt,
            dna: {
              industry: "",
              mission: s.prompt,
              planningHorizon: "medium",
              riskAppetite: "moderate",
              growthStyle: "balanced",
              successMetric: s.context.successMetric || "",
            },
          });
        }
        router.push("/");
        return;
      } else if (nextStage === NavigationStage.DECISION) {
        setCurrentQuestion(null);
        router.push("/decisions");
        return;
      } else if (nextStage === NavigationStage.EXECUTION) {
        setCurrentQuestion(null);
        router.push("/execution");
        return;
      } else if (nextStage === NavigationStage.COMPLETE) {
        NavigationStore.updateStatus(activeSessionId, "COMPLETED");
        setCurrentQuestion("Journey complete! 🎉 What would you like to navigate next?");
        setActiveSessionId(null);
        setIsNavigating(false);
        return;
      }

      // Refresh current session and continue loop
      current = NavigationStore.getById(activeSessionId)!;
    }

    // Now the current stage needs user input — ask the next question
    const q = NavigationStore.nextQuestion(current);
    setCurrentQuestion(q);
  };

  const handleContinueJourney = (sessionId: string) => {
    const session = NavigationStore.getById(sessionId);
    if (!session) return;

    NavigationStore.updateStatus(sessionId, "ACTIVE");
    setActiveSessionId(sessionId);
    setIsNavigating(true);
    setCurrentQuestion(
      `Welcome back! Yesterday we were working toward: "${session.prompt}". Ready to continue?`
    );
  };

  const handleDeleteSession = (sessionId: string) => {
    NavigationStore.deleteSession(sessionId);
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setIsNavigating(false);
      setCurrentQuestion("Where do you want to go today—in reality?");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4">
      {/* Logo / Brand */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 mb-4">
          <Compass className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">SPYRAL</h1>
      </div>

      {/* Main prompt area */}
      {!isNavigating ? (
        <div className="w-full max-w-2xl space-y-8">
          {/* Prompt input */}
          <div className="space-y-3">
            <p className="text-sm text-zinc-500 text-center">
              Where do you want to go today—in reality?
            </p>
            <div className="flex items-center gap-2 bg-zinc-900 rounded-xl border border-zinc-800 focus-within:border-zinc-600 transition-colors px-4">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitPrompt();
                }}
                placeholder="e.g., Grow monthly revenue to ₦10M..."
                className="flex-1 bg-transparent py-3 text-sm text-white placeholder-zinc-600 outline-none"
              />
              <button
                onClick={handleSubmitPrompt}
                disabled={!prompt.trim()}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors",
                  prompt.trim()
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                )}
              >
                Navigate
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Continue Journey (active sessions) */}
          {activeSessions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Continue Journey
              </h2>
              <div className="space-y-2">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="group flex items-center justify-between bg-zinc-900/50 rounded-lg border border-zinc-800/50 hover:border-zinc-700/50 transition-colors px-3 py-2.5"
                  >
                    <button
                      onClick={() => handleContinueJourney(session.id)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left"
                    >
                      <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{session.prompt}</p>
                        <p className="text-xs text-zinc-600">
                          {session.stage.toLowerCase()} · {new Date(session.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="p-1 hover:bg-zinc-700 rounded text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Destinations */}
          {recentDestinations.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Recent Destinations
              </h2>
              <div className="space-y-2">
                {recentDestinations.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between bg-zinc-900/30 rounded-lg border border-zinc-800/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Compass className="w-4 h-4 text-zinc-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-zinc-400 truncate">{session.prompt}</p>
                        <p className="text-xs text-zinc-700">
                          Completed · {new Date(session.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setPrompt(session.prompt);
                      }}
                      className="text-xs text-zinc-600 hover:text-white transition-colors shrink-0"
                    >
                      Repeat
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {activeSessions.length === 0 && recentDestinations.length === 0 && (
            <div className="text-center">
              <p className="text-xs text-zinc-700">
                Describe your destination and SPYRAL will help you navigate there.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Active navigation conversation */
        <div className="w-full max-w-2xl space-y-6">
          {/* Current question / context */}
          {currentQuestion && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
              <p className="text-sm text-zinc-400 mb-2">SPYRAL</p>
              <p className="text-base text-white leading-relaxed">{currentQuestion}</p>
            </div>
          )}

          {/* Answer input */}
          <div className="flex items-center gap-2 bg-zinc-900 rounded-xl border border-zinc-800 focus-within:border-zinc-600 transition-colors px-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAnswerQuestion(prompt);
                  setPrompt("");
                }
              }}
              placeholder="Type your answer..."
              className="flex-1 bg-transparent py-3 text-sm text-white placeholder-zinc-600 outline-none"
              autoFocus
            />
            <button
              onClick={() => {
                handleAnswerQuestion(prompt);
                setPrompt("");
              }}
              disabled={!prompt.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
            >
              Answer
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cancel */}
          <div className="text-center">
            <button
              onClick={() => {
                if (activeSessionId) {
                  NavigationStore.updateStatus(activeSessionId, "PAUSED");
                }
                setActiveSessionId(null);
                setIsNavigating(false);
                setCurrentQuestion("Where do you want to go today—in reality?");
              }}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Cancel and save for later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
