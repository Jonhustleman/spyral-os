/**
 * DecisionDetail — Full view of a single decision.
 *
 * Includes:
 * - Decision info (title, status, context)
 * - Options editor with expected benefit/cost/risk/effort
 * - Dimension score sliders (Impact, Cost, Risk, Time, Confidence)
 * - Trade-off matrix visualization (option comparison)
 * - Explainability panel
 * - Decision graph (incoming/outgoing relationships)
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GitBranch,
  Target,
  BarChart3,
  Lightbulb,
  Share2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DecisionStore, type Decision, type DecisionOption, type DecisionScore, type DecisionRelationship } from "../decision.store";
import { DecisionRelationshipType } from "@/kernel/contracts/DecisionRelationship";

// ─── Props ──────────────────────────────────────────────────────────────

interface DecisionDetailProps {
  decisionId: string;
  onBack: () => void;
}

// ─── Dimension labels ───────────────────────────────────────────────────

const DIMENSION_COLORS: Record<string, string> = {
  Impact: "bg-emerald-500",
  Cost: "bg-red-500",
  Risk: "bg-amber-500",
  Time: "bg-blue-500",
  Confidence: "bg-purple-500",
};

// ─── Component ──────────────────────────────────────────────────────────

export function DecisionDetail({ decisionId, onBack }: DecisionDetailProps) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [relationships, setRelationships] = useState<DecisionRelationship[]>([]);
  const [activeTab, setActiveTab] = useState<string>("options");

  const refresh = useCallback(() => {
    const d = DecisionStore.getById(decisionId);
    setDecision(d ? { ...d } : null);
    setRelationships(DecisionStore.getRelationshipsFor(decisionId));
  }, [decisionId]);

  useEffect(() => {
    refresh();
    const unsub = DecisionStore.subscribe(refresh);
    return unsub;
  }, [refresh]);

  if (!decision) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-zinc-500">Decision not found</p>
        <button onClick={onBack} className="mt-2 text-xs text-zinc-600 hover:text-white">
          Go back
        </button>
      </div>
    );
  }

  // ── Add option ───────────────────────────────────────────────────────

  const handleAddOption = () => {
    const newOption: DecisionOption = {
      id: `opt_${Date.now()}`,
      title: `Option ${String.fromCharCode(65 + decision.options.length)}`,
      description: "Describe this option",
      expectedBenefit: "",
      expectedCost: "",
      expectedRisk: "",
      requiredEffort: "",
      confidence: 0.5,
    };
    const newScore = DecisionStore.createDefaultScores(newOption.id);
    DecisionStore.update(decisionId, {
      options: [...decision.options, newOption],
      scores: [...decision.scores, newScore],
    });
  };

  const handleRemoveOption = (optionId: string) => {
    DecisionStore.update(decisionId, {
      options: decision.options.filter((o) => o.id !== optionId),
      scores: decision.scores.filter((s) => s.optionId !== optionId),
    });
    if (decision.selectedOptionId === optionId) {
      DecisionStore.update(decisionId, { selectedOptionId: null });
    }
  };

  const handleSelectOption = (optionId: string) => {
    DecisionStore.update(decisionId, {
      selectedOptionId: optionId,
      status: "made",
    });
  };

  // ── Update option field ──────────────────────────────────────────────

  const updateOption = (optionId: string, field: keyof DecisionOption, value: string | number) => {
    const options = decision.options.map((o) =>
      o.id === optionId ? { ...o, [field]: value } : o
    );
    DecisionStore.update(decisionId, { options });
  };

  // ── Update dimension score ───────────────────────────────────────────

  const updateScore = (optionId: string, dimIdx: number, value: number) => {
    const scores = decision.scores.map((s) => {
      if (s.optionId !== optionId) return s;
      const dimensions = s.dimensions.map((d, i) =>
        i === dimIdx ? { ...d, value } : d
      );
      return { ...s, dimensions };
    });
    DecisionStore.update(decisionId, { scores });
  };

  // ── Update explanation ───────────────────────────────────────────────

  const updateExplanation = (field: string, value: string | number) => {
    DecisionStore.update(decisionId, {
      explanation: { ...decision.explanation, [field]: value },
    });
  };

  // ── Update status ────────────────────────────────────────────────────

  const handleStatusChange = (status: Decision["status"]) => {
    DecisionStore.update(decisionId, { status });
  };

  // ── Tabs ─────────────────────────────────────────────────────────────

  const tabs = [
    { id: "options", label: "Options", icon: Target },
    { id: "scores", label: "Scores", icon: BarChart3 },
    { id: "explanation", label: "Explainability", icon: Lightbulb },
    { id: "relationships", label: "Graph", icon: Share2 },
  ];

  // ── Render score bars for an option ──────────────────────────────────

  const renderScoreBars = (score: DecisionScore) => (
    <div className="space-y-2 mt-3">
      {score.dimensions.map((dim, idx) => (
        <div key={dim.name}>
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="text-zinc-400">{dim.name}</span>
            <span className="text-white font-medium">{dim.value}/{dim.max}</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", DIMENSION_COLORS[dim.name] || "bg-zinc-500")}
              style={{ width: `${(dim.value / dim.max) * 100}%` }}
            />
          </div>
          {/* Inline slider */}
          <input
            type="range"
            min={0}
            max={dim.max}
            value={dim.value}
            onChange={(e) => updateScore(score.optionId, idx, parseInt(e.target.value))}
            className="w-full h-1 mt-1 accent-white opacity-50 hover:opacity-100 transition-opacity"
          />
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-white truncate">{decision.title}</h2>
          <p className="text-[10px] text-zinc-600">
            {decision.options.length} options · Score dimensions: Impact, Cost, Risk, Time, Confidence
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column - Options */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors",
                    activeTab === tab.id
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab === "options" && (
            <div className="space-y-3">
              {decision.options.map((option, idx) => {
                const isSelected = decision.selectedOptionId === option.id;
                return (
                  <div
                    key={option.id}
                    className={cn(
                      "rounded-lg border p-3 transition-colors",
                      isSelected
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-zinc-800 bg-zinc-900/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[9px] font-medium text-zinc-400">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <input
                          type="text"
                          value={option.title}
                          onChange={(e) => updateOption(option.id, "title", e.target.value)}
                          className="bg-transparent text-sm font-medium text-white border-b border-transparent hover:border-zinc-700 focus:border-zinc-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        {!isSelected && (
                          <button
                            onClick={() => handleSelectOption(option.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-800 hover:text-emerald-400 transition-colors"
                            title="Select this option"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {decision.options.length > 1 && (
                          <button
                            onClick={() => handleRemoveOption(option.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-800 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <textarea
                      value={option.description}
                      onChange={(e) => updateOption(option.id, "description", e.target.value)}
                      placeholder="Describe this option"
                      rows={2}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none resize-none mb-2"
                    />

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-zinc-600 block mb-0.5">Expected Benefit</label>
                        <input
                          type="text"
                          value={option.expectedBenefit}
                          onChange={(e) => updateOption(option.id, "expectedBenefit", e.target.value)}
                          placeholder="e.g., Revenue growth"
                          className="w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-[10px] text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-600 block mb-0.5">Expected Cost</label>
                        <input
                          type="text"
                          value={option.expectedCost}
                          onChange={(e) => updateOption(option.id, "expectedCost", e.target.value)}
                          placeholder="e.g., $50,000"
                          className="w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-[10px] text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-600 block mb-0.5">Expected Risk</label>
                        <input
                          type="text"
                          value={option.expectedRisk}
                          onChange={(e) => updateOption(option.id, "expectedRisk", e.target.value)}
                          placeholder="e.g., Market volatility"
                          className="w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-[10px] text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-600 block mb-0.5">Required Effort</label>
                        <input
                          type="text"
                          value={option.requiredEffort}
                          onChange={(e) => updateOption(option.id, "requiredEffort", e.target.value)}
                          placeholder="e.g., 3 months"
                          className="w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-[10px] text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={handleAddOption}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-800 px-4 py-3 text-xs text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 w-full justify-center transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Option
              </button>
            </div>
          )}

          {activeTab === "scores" && (
            <div className="space-y-4">
              {decision.options.length === 0 ? (
                <p className="text-xs text-zinc-500">Add options first to score them.</p>
              ) : (
                decision.options.map((option, idx) => {
                  const score = decision.scores.find((s) => s.optionId === option.id);
                  const isSelected = decision.selectedOptionId === option.id;
                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "rounded-lg border p-3",
                        isSelected ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-white">
                          {String.fromCharCode(65 + idx)}. {option.title}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] text-emerald-400 font-medium uppercase">Selected</span>
                        )}
                      </div>
                      {score && renderScoreBars(score)}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "explanation" && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Explainability (ADR-0019)</p>

              <div>
                <label className="text-[10px] text-zinc-600 block mb-1">Reasoning</label>
                <textarea
                  value={decision.explanation.reasoning}
                  onChange={(e) => updateExplanation("reasoning", e.target.value)}
                  placeholder="Why was this decision made?"
                  rows={2}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-600 block mb-1">Evidence</label>
                <textarea
                  value={decision.explanation.evidence}
                  onChange={(e) => updateExplanation("evidence", e.target.value)}
                  placeholder="What data supports this?"
                  rows={2}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-600 block mb-1">
                  Confidence: {Math.round(decision.explanation.confidence * 100)}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={decision.explanation.confidence}
                  onChange={(e) => updateExplanation("confidence", parseFloat(e.target.value))}
                  className="w-full accent-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-600 block mb-1">Missing Information</label>
                <textarea
                  value={decision.explanation.missingInformation || ""}
                  onChange={(e) => updateExplanation("missingInformation", e.target.value)}
                  placeholder="What would improve confidence?"
                  rows={2}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === "relationships" && (
            <div>
              <RelationshipPanel decisionId={decisionId} relationships={relationships} refresh={refresh} />
            </div>
          )}
        </div>

        {/* Right column - Status & Actions */}
        <div className="space-y-3">
          {/* Status */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Status</p>
            <div className="flex flex-wrap gap-1">
              {(["draft", "made", "executing", "executed", "superseded"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={cn(
                    "rounded-full px-2 py-1 text-[9px] font-medium uppercase transition-colors",
                    decision.status === s
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Decision info */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Details</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Options</span>
                <span className="text-white">{decision.options.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Selected</span>
                <span className="text-emerald-400">
                  {decision.selectedOptionId
                    ? decision.options.find((o) => o.id === decision.selectedOptionId)?.title || "—"
                    : "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Relationships</span>
                <span className="text-white">{relationships.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Relationship Panel ─────────────────────────────────────────────────

function RelationshipPanel({
  decisionId,
  relationships,
  refresh,
}: {
  decisionId: string;
  relationships: DecisionRelationship[];
  refresh: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [relType, setRelType] = useState<DecisionRelationshipType>(DecisionRelationshipType.DEPENDS_ON);
  const [allDecisions, setAllDecisions] = useState<Decision[]>([]);

  useEffect(() => {
    setAllDecisions(DecisionStore.getAll().filter((d) => d.id !== decisionId));
  }, [decisionId]);

  const handleAdd = () => {
    if (!targetId) return;
    DecisionStore.addRelationship({
      fromDecisionId: decisionId,
      toDecisionId: targetId,
      relationship: relType,
    });
    setTargetId("");
    setRelType(DecisionRelationshipType.DEPENDS_ON);
    setShowAdd(false);
  };

  const relTypeLabels: Record<string, string> = {
    depends_on: "Depends On",
    blocks: "Blocks",
    enables: "Enables",
    supersedes: "Supersedes",
    duplicates: "Duplicates",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Decision Graph</p>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 rounded-md border border-zinc-800 px-2 py-1 text-[10px] text-zinc-400 hover:text-white transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add Relation
        </button>
      </div>

      {showAdd && (
        <div className="mb-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-2">
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
          >
            <option value="">Select target decision...</option>
            {allDecisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
          <select
            value={relType}
            onChange={(e) => setRelType(e.target.value as DecisionRelationshipType)}
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
          >
            <option value={DecisionRelationshipType.DEPENDS_ON}>Depends On</option>
            <option value={DecisionRelationshipType.BLOCKS}>Blocks</option>
            <option value={DecisionRelationshipType.ENABLES}>Enables</option>
            <option value={DecisionRelationshipType.SUPERSEDES}>Supersedes</option>
            <option value={DecisionRelationshipType.DUPLICATES}>Duplicates</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!targetId}
              className="rounded-md bg-white px-3 py-1.5 text-[10px] font-medium text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="rounded-md border border-zinc-800 px-3 py-1.5 text-[10px] text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {relationships.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <Share2 className="h-6 w-6 text-zinc-700 mx-auto mb-1" />
          <p className="text-[10px] text-zinc-600">No relationships yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {relationships.map((rel, i) => {
            const isOutgoing = rel.fromDecisionId === decisionId;
            const otherId = isOutgoing ? rel.toDecisionId : rel.fromDecisionId;
            const otherDecision = allDecisions.find((d) => d.id === otherId);
            return (
              <div
                key={`${rel.fromDecisionId}_${rel.toDecisionId}_${i}`}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-2"
              >
                <div className="flex items-center gap-2 text-[10px] min-w-0">
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 font-medium uppercase",
                    isOutgoing ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"
                  )}>
                    {isOutgoing ? "→" : "←"}
                  </span>
                  <span className="text-zinc-400">{relTypeLabels[rel.relationship] || rel.relationship}</span>
                  <span className="text-white truncate">{otherDecision?.title || otherId.slice(0, 8)}</span>
                </div>
                <button
                  onClick={() => DecisionStore.removeRelationship(rel.fromDecisionId, rel.toDecisionId)}
                  className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
