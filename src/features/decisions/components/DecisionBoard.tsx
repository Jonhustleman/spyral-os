/**
 * DecisionBoard — List view of all decisions for a workspace.
 *
 * Shows decisions with their status, option count, and key scores.
 * Users can create new decisions, click to edit, or delete.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, GitBranch, Target, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DecisionStore, type Decision, type DecisionOption, type DecisionScore } from "../decision.store";
import { DecisionDetail } from "./DecisionDetail";

// ─── Props ──────────────────────────────────────────────────────────────

interface DecisionBoardProps {
  workspaceId: string;
}

// ─── Status config ───────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  draft: { label: "Draft", icon: Clock, color: "text-zinc-500 bg-zinc-500/10" },
  made: { label: "Made", icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10" },
  executing: { label: "Executing", icon: AlertCircle, color: "text-blue-400 bg-blue-500/10" },
  executed: { label: "Executed", icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10" },
  superseded: { label: "Superseded", icon: GitBranch, color: "text-amber-400 bg-amber-500/10" },
};

// ─── Component ──────────────────────────────────────────────────────────

export function DecisionBoard({ workspaceId }: DecisionBoardProps) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const refresh = useCallback(() => {
    setDecisions(DecisionStore.getByWorkspace(workspaceId));
  }, [workspaceId]);

  useEffect(() => {
    refresh();
    const unsub = DecisionStore.subscribe(refresh);
    return unsub;
  }, [refresh]);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const defaultContext = {
      workspaceId,
      realitySnapshotId: "",
      goalIds: [],
      constraints: [],
      assumptions: [],
      timestamp: new Date(),
    };
    const defaultOption: DecisionOption = {
      id: `opt_${Date.now()}`,
      title: "Option A",
      description: "Describe this option",
      expectedBenefit: "",
      expectedCost: "",
      expectedRisk: "",
      requiredEffort: "",
      confidence: 0.5,
    };
    const defaultScore = DecisionStore.createDefaultScores(defaultOption.id);
    const decision = DecisionStore.create({
      context: defaultContext,
      title: newTitle.trim(),
      options: [defaultOption],
      scores: [defaultScore],
      selectedOptionId: null,
      updatedAt: new Date(),
      explanation: {
        reasoning: "",
        evidence: "",
        confidence: 0.5,
        missingInformation: "More data needed to improve confidence",
        alternativeViews: [],
      },
      status: "draft",
      madeBy: "User",
    });
    setNewTitle("");
    setShowNewForm(false);
    setSelectedId(decision.id);
  };

  // If a decision is selected, show the detail view
  if (selectedId) {
    return <DecisionDetail decisionId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-white">Decision Board</h2>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 transition-colors"
        >
          <Plus className="h-3 w-3" />
          New Decision
        </button>
      </div>

      {/* New decision form */}
      {showNewForm && (
        <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What decision do you need to make?"
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none mb-2"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => { setShowNewForm(false); setNewTitle(""); }}
              className="rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Decision list */}
      {decisions.length === 0 && !showNewForm ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <GitBranch className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500 mb-1">No decisions yet</p>
          <p className="text-xs text-zinc-600">
            Create your first decision to start mapping choices and trade-offs.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {decisions.map((decision) => {
            const status = statusConfig[decision.status] || statusConfig.draft;
            const StatusIcon = status.icon;
            return (
              <button
                key={decision.id}
                onClick={() => setSelectedId(decision.id)}
                className="w-full text-left rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 hover:bg-zinc-800/50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {decision.title}
                      </p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase shrink-0",
                          status.color
                        )}
                      >
                        <StatusIcon className="h-2.5 w-2.5" />
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-600">
                      <span>{decision.options.length} option{decision.options.length !== 1 ? "s" : ""}</span>
                      <span>
                        {decision.scores.length > 0
                          ? `${decision.scores[0].dimensions.length} dimensions scored`
                          : "Not scored"}
                      </span>
                      <span>
                        {decision.relationships?.length
                          ? `${decision.relationships.length} relationship${decision.relationships.length !== 1 ? "s" : ""}`
                          : "No relationships"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      DecisionStore.delete(decision.id);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 opacity-0 group-hover:opacity-100 hover:bg-zinc-800 hover:text-red-400 transition-all shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
