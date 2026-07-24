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
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Compass, ArrowRight, Clock, Plus, Trash2, Sparkles, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavigationStore } from "../navigation.store";
import { NavigationStage } from "@/kernel/contracts/NavigationStage";
import type { NavigationSession } from "@/kernel/contracts/NavigationSession";
import { WorkspaceStore } from "@/features/workspace";
import { RealityStore } from "@/features/reality";
import type { ReportData } from "@/features/reality";

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
    "Every journey starts from somewhere. Tell me about the direction you're considering, and I'll help map what's between here and there."
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

    // Acknowledge direction, then offer next perspective
    const q = NavigationStore.nextQuestion(session);
    setCurrentQuestion(q || "Let's figure out what has to change to get you there.");
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
          const ws = WorkspaceStore.create({
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

          // Generate and store Reality Report
          if (ws) {
            const domain = s.prompt.toLowerCase().includes("business") || s.prompt.toLowerCase().includes("revenue") || s.prompt.toLowerCase().includes("growth") ? "business"
              : s.prompt.toLowerCase().includes("market") || s.prompt.toLowerCase().includes("brand") || s.prompt.toLowerCase().includes("audience") ? "marketing"
              : s.prompt.toLowerCase().includes("content") || s.prompt.toLowerCase().includes("write") || s.prompt.toLowerCase().includes("social") ? "content"
              : s.prompt.toLowerCase().includes("finance") || s.prompt.toLowerCase().includes("investment") || s.prompt.toLowerCase().includes("budget") ? "finance"
              : s.prompt.toLowerCase().includes("research") || s.prompt.toLowerCase().includes("study") ? "research"
              : s.prompt.toLowerCase().includes("career") || s.prompt.toLowerCase().includes("job") ? "career"
              : s.prompt.toLowerCase().includes("health") || s.prompt.toLowerCase().includes("clinic") || s.prompt.toLowerCase().includes("medical") ? "healthcare"
              : "strategic";

            const report: ReportData = {
              goal: s.prompt,
              workspaceName: ws.name,
              cycleId: `SPYRAL-${String(Date.now()).slice(-6)}`,

              // 1. Current Reality
              situation: `Pursuing "${s.prompt}" in the ${domain} domain. Initial assessment based on stated intention.`,
              knownFactors: [
                `Clear goal defined: "${s.prompt.substring(0, 50)}"`,
                `${domain} context identified`,
                ...(s.context.targetDate ? [`Target timeline: ${s.context.targetDate}`] : []),
                "Multiple strategic approaches may be viable",
              ],
              constraints: [
                `Resources must be allocated efficiently for ${domain}`,
                "Timeline and budget constraints apply",
                "External market factors may influence outcomes",
              ],
              missingInfo: [
                "Current baseline metrics not yet measured",
                "Specific resource availability not confirmed",
                "Stakeholder alignment needs verification",
              ],
              keyAssumptions: [
                `Resources are available to pursue this ${domain} goal`,
                "Key stakeholders are aligned with the objective",
                "The chosen approach can be adapted based on feedback",
              ],

              // 2. Desired Reality
              targetOutcome: s.prompt,
              successCriteria: [
                "Goal clearly defined and measurable",
                "Progress tracked against milestones",
                "Feedback loop established for continuous improvement",
              ],
              timeline: s.context.targetDate || "90-day initial cycle with weekly reviews",

              // 3. Gap Analysis
              gapCurrentState: domain,
              gapDesiredState: s.prompt,
              gapDescription: `Moving from current "${domain}" state toward: "${s.prompt.substring(0, 80)}"`,
              mainObstacles: [
                `Limited visibility into current ${domain} baseline metrics`,
                "Resources must be allocated and prioritized",
                "Unknown factors that may emerge during execution",
              ],
              leveragePoints: [
                "Clear goal definition enables focused execution",
                "Multiple strategy options increase probability of success",
                "Structured milestones provide early validation opportunities",
              ],

              // 4. Hidden Structure
              keyVariables: [
                `Pattern: ${domain} initiatives show strongest results when aligned with core competencies`,
                "Pattern: Success correlates with clear metric definition and regular measurement",
                "Pattern: Iterative approaches outperform big-bang implementations",
              ],
              patternsDetected: [
                `The ${domain} landscape reveals interconnected factors that influence outcomes`,
                "Underlying dynamics create both opportunities and constraints",
                "Stakeholder alignment is a critical success factor often overlooked",
              ],
              bottlenecks: [
                "Goal scope may shift during execution",
                "Resource constraints may impact timeline",
                "Key assumptions may prove invalid",
              ],

              // 5. Strategies (3 auto-generated)
              strategies: [
                {
                  name: `Structured ${domain.charAt(0).toUpperCase() + domain.slice(1)} Approach`,
                  explanation: `A systematic methodology for achieving "${s.prompt.substring(0, 60)}" through phased execution with clear metrics at each stage.`,
                  whyItMayWork: "Clear, measurable progress at each milestone; Reduced risk through iterative validation; Builds organizational learning capacity",
                  steps: [
                    "Define baseline metrics and success criteria",
                    "Establish measurement infrastructure",
                    "Launch core initiatives with 2-week feedback cycles",
                    "Review progress, adapt based on data, scale what works",
                    "Document learnings and update strategy",
                  ],
                  resourcesRequired: ["Time for planning and execution", "Measurement tools", "Team/stakeholder alignment"],
                  timeline: "4 milestone phases across 16 weeks",
                  expectedOutcome: "Achieve goal through structured, measurable execution with continuous adaptation",
                  risks: ["Requires upfront planning investment", "May be slower for urgent objectives"],
                  confidenceScore: "85%",
                  measurementMethod: "Track progress against milestone success criteria with weekly reviews",
                },
                {
                  name: `Agile ${domain.charAt(0).toUpperCase() + domain.slice(1)} Sprint`,
                  explanation: `A fast-paced, iterative approach to "${s.prompt.substring(0, 60)}" with rapid experimentation and adaptation cycles.`,
                  whyItMayWork: "Quick initial results and momentum; High adaptability to changing conditions; Early validation of key assumptions",
                  steps: [
                    "Identify highest-impact initiative to start",
                    "Launch 2-week sprint with clear success criteria",
                    "Review results and adapt approach for next sprint",
                    "Scale successful patterns, discard what doesn't work",
                  ],
                  resourcesRequired: ["Execution focus", "Quick decision-making", "Minimal initial investment"],
                  timeline: "2-week sprint cycles with monthly reviews",
                  expectedOutcome: "Rapid progress with continuous adaptation based on real-world feedback",
                  risks: ["May lack comprehensive strategic coherence", "Requires strong execution discipline"],
                  confidenceScore: "72%",
                  measurementMethod: "Sprint-level success criteria with bi-weekly progress reviews",
                },
                {
                  name: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Transformation Program`,
                  explanation: `A comprehensive initiative targeting "${s.prompt.substring(0, 60)}" with full resource commitment and organizational alignment.`,
                  whyItMayWork: "Maximum strategic impact potential; Full resource commitment and focus; Creates lasting structural change",
                  steps: [
                    "Secure full resource commitment and organizational buy-in",
                    "Develop comprehensive execution roadmap",
                    "Launch multi-track initiatives with coordinated execution",
                    "Establish governance and reporting structure",
                    "Regular strategic reviews and course corrections",
                  ],
                  resourcesRequired: ["Significant investment", "Full organizational commitment", "Dedicated execution team"],
                  timeline: "Multi-phase program across 6+ months",
                  expectedOutcome: "Transformative results with lasting structural change in the domain",
                  risks: ["Highest resource and investment requirement", "Longer timeline to see results", "Higher complexity and coordination needs"],
                  confidenceScore: "63%",
                  measurementMethod: "Program-level KPIs with monthly strategic reviews and quarterly assessments",
                },
              ],

              // 6. Recommendation
              selectedStrategy: `Structured ${domain.charAt(0).toUpperCase() + domain.slice(1)} Approach`,
              reasonSelected: `This approach balances strategic clarity with execution flexibility. It provides clear milestones for measuring progress while allowing adaptation based on real-world feedback. The phased structure reduces risk while building momentum toward the desired reality.`,
              evidence: [
                "Clear, specific goal definition improves execution success",
                "Multiple strategy options generated and evaluated",
                "Structured milestone plan with success criteria defined",
                "Risk mitigation strategies identified for each phase",
              ],
              uncertainty: [
                "Perfect information is not available before starting — real-world feedback will refine the approach",
                "External factors beyond control may influence outcomes",
                "Initial assumptions need validation through early execution",
              ],

              // 7. Execution Plan
              first72h: [
                "Define specific, measurable success criteria for your goal",
                "Identify key stakeholders and establish communication channels",
                "Set up measurement and tracking infrastructure",
              ],
              first30d: [
                {
                  milestone: "Foundation & Assessment",
                  action: `Establish baseline metrics, assess current ${domain} capabilities, and define success criteria`,
                  criteria: "Baseline measured, team aligned, success criteria defined",
                },
              ],
              first90d: [
                {
                  milestone: "Initial Implementation",
                  action: "Launch core initiatives aligned with strategy. Begin measurement and feedback collection.",
                  criteria: "Core initiatives operational, first metrics collected",
                },
                {
                  milestone: "Optimization & Scaling",
                  action: "Analyze early results, optimize approaches, and scale successful initiatives.",
                  criteria: "Key metrics showing improvement, successful patterns identified and scaled",
                },
              ],

              // 8. Validation Loop
              prediction: `Following the recommended strategy will achieve the desired outcome within the defined timeline, with course corrections based on measurement data.`,
              measurement: `Track progress against milestone success criteria. Key metrics: goal clarity, execution velocity, stakeholder alignment, outcome achievement. Review cadence: weekly tactical + monthly strategic.`,
              adaptation: `If metrics deviate from expected trajectory, adjust approach based on data. Use feedback loops to identify what's working and what needs to change. Scale successful patterns, pivot away from ineffective ones.`,

              // Confidence
              confidenceScore: 45,
              confidenceReason: "Conservative base confidence (45%) per SPYRAL estimation policy. Specific goal definition and multiple strategy options add moderate confidence. Real-world execution data will increase confidence over time.",
              unknownFactors: [
                "Goal is in early stage — specificity increases confidence as execution progresses",
                "Market or audience context not fully validated",
                "Resource constraints not yet confirmed",
              ],
            };

            RealityStore.saveReport(ws.id, report as unknown as Record<string, unknown>);
          }
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
        setCurrentQuestion("Journey complete! 🎉 You've mapped out a path. Let me know when you're ready to explore a new direction.");
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
      `Welcome back. Last session you were working toward: "${session.prompt}". You can pick up where you left off or start something new.`
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
      {/* Home button */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-sm"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
      </div>

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
                setCurrentQuestion("Every journey starts from somewhere. Tell me about the direction you're considering.");
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
