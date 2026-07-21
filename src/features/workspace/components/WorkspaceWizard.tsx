/**
 * WorkspaceWizard — 4-step stepper for creating a new workspace.
 *
 * Steps:
 * 1. Identity — name + description
 * 2. Purpose — type selection + goal
 * 3. DNA — configure strategic DNA profile
 * 4. Review — summary + create
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceRegistry, type WorkspaceTypeInfo } from "@/features/workspace/WorkspaceRegistry";
import { WorkspaceStore } from "@/features/workspace/workspace.store";
import type { WorkspaceDNA } from "@/kernel/contracts/Workspace";
import {
  Briefcase,
  Megaphone,
  FileText,
  TrendingUp,
  FlaskRoundIcon as Flask,
  Target,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Steps ─────────────────────────────────────────────────────────────────

const STEPS = [
  { id: "identity", label: "Identity" },
  { id: "purpose", label: "Purpose" },
  { id: "dna", label: "DNA" },
  { id: "review", label: "Review" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// ─── Icon map ──────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Briefcase,
  Megaphone,
  FileText,
  TrendingUp,
  Flask,
  Target,
};

function getTypeIcon(type: WorkspaceTypeInfo) {
  const Icon = ICON_MAP[type.icon];
  return Icon ? <Icon className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />;
}

// ─── Props ─────────────────────────────────────────────────────────────────

interface WorkspaceWizardProps {
  onClose: () => void;
  onCreated?: () => void;
}

// ─── Form state ────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  description: string;
  type: string;
  goal: string;
  dna: WorkspaceDNA;
}

const DEFAULT_DNA: WorkspaceDNA = {
  industry: "",
  mission: "",
  planningHorizon: "medium",
  riskAppetite: "moderate",
  growthStyle: "balanced",
  successMetric: "",
};

// ─── Component ─────────────────────────────────────────────────────────────

export function WorkspaceWizard({ onClose, onCreated }: WorkspaceWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("identity");
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    type: "",
    goal: "",
    dna: { ...DEFAULT_DNA },
  });
  const [creating, setCreating] = useState(false);

  const currentIndex = STEPS.findIndex((s) => s.id === step);
  const totalSteps = STEPS.length;
  const progress = ((currentIndex + 1) / totalSteps) * 100;

  const types = WorkspaceRegistry.getAll();

  // ── Step validation ────────────────────────────────────────────────────

  const canProceed = (): boolean => {
    switch (step) {
      case "identity":
        return form.name.trim().length >= 2;
      case "purpose":
        return form.type !== "" && form.goal.trim().length >= 3;
      case "dna":
        return (
          form.dna.industry.trim().length >= 2 &&
          form.dna.mission.trim().length >= 3 &&
          form.dna.successMetric.trim().length >= 2
        );
      case "review":
        return true;
    }
  };

  // ── Navigation ─────────────────────────────────────────────────────────

  const goNext = () => {
    if (currentIndex < totalSteps - 1) {
      setStep(STEPS[currentIndex + 1].id);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1].id);
    }
  };

  // ── Creation ───────────────────────────────────────────────────────────

  const handleCreate = async () => {
    setCreating(true);
    try {
      const workspace = WorkspaceStore.create({
        name: form.name.trim(),
        type: form.type,
        description: form.description.trim(),
        goal: form.goal.trim(),
        dna: form.dna,
      });
      onCreated?.();
      onClose?.();
      router.push(`/navigate/${workspace.id}`);
    } catch (e) {
      console.error("Failed to create workspace:", e);
    } finally {
      setCreating(false);
    }
  };

  // ── DNA helpers ────────────────────────────────────────────────────────

  const setDNA = <K extends keyof WorkspaceDNA>(key: K, value: WorkspaceDNA[K]) => {
    setForm((prev) => ({ ...prev, dna: { ...prev.dna, [key]: value } }));
  };

  // ── Render step content ────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      case "identity":
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Workspace Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Across Mart"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                autoFocus
              />
              <p className="mt-1 text-[11px] text-zinc-600">
                Give your workspace a unique, identifiable name.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What is this workspace for?"
                rows={3}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none"
              />
            </div>
          </div>
        );

      case "purpose":
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Workspace Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {types.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        type: type.id,
                        dna: {
                          ...prev.dna,
                          industry: type.defaultDNA.industry,
                          planningHorizon: type.defaultDNA.planningHorizon,
                          riskAppetite: type.defaultDNA.riskAppetite,
                          growthStyle: type.defaultDNA.growthStyle,
                          successMetric: type.defaultDNA.successMetric,
                        },
                      }));
                    }}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
                      form.type === type.id
                        ? "border-zinc-600 bg-zinc-800/50"
                        : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                    )}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-400">
                      {getTypeIcon(type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{type.label}</p>
                      <p className="text-[11px] text-zinc-500 line-clamp-2">{type.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Primary Goal
              </label>
              <input
                type="text"
                value={form.goal}
                onChange={(e) => setForm((prev) => ({ ...prev, goal: e.target.value }))}
                placeholder="e.g. Scale marketplace to 10k sellers"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
          </div>
        );

      case "dna":
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Industry
              </label>
              <input
                type="text"
                value={form.dna.industry}
                onChange={(e) => setDNA("industry", e.target.value)}
                placeholder="e.g. E-commerce, Healthcare, Finance"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Mission Statement
              </label>
              <textarea
                value={form.dna.mission}
                onChange={(e) => setDNA("mission", e.target.value)}
                placeholder="What is the core mission of this workspace?"
                rows={2}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">
                  Planning Horizon
                </label>
                <select
                  value={form.dna.planningHorizon}
                  onChange={(e) => setDNA("planningHorizon", e.target.value as WorkspaceDNA["planningHorizon"])}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
                >
                  <option value="short">Short-term</option>
                  <option value="medium">Medium-term</option>
                  <option value="long">Long-term</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">
                  Risk Appetite
                </label>
                <select
                  value={form.dna.riskAppetite}
                  onChange={(e) => setDNA("riskAppetite", e.target.value as WorkspaceDNA["riskAppetite"])}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">
                  Growth Style
                </label>
                <select
                  value={form.dna.growthStyle}
                  onChange={(e) => setDNA("growthStyle", e.target.value as WorkspaceDNA["growthStyle"])}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
                >
                  <option value="steady">Steady</option>
                  <option value="balanced">Balanced</option>
                  <option value="rapid">Rapid</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Success Metric
              </label>
              <input
                type="text"
                value={form.dna.successMetric}
                onChange={(e) => setDNA("successMetric", e.target.value)}
                placeholder="e.g. Revenue growth, User adoption, ROI"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
          </div>
        );

      case "review":
        const typeInfo = WorkspaceRegistry.get(form.type);
        const Icon = typeInfo ? getTypeIcon(typeInfo) : null;
        return (
          <div className="space-y-5">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="text-base font-medium text-white mb-4">Review Your Workspace</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                    {Icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{form.name}</p>
                    <p className="text-xs text-zinc-500">{typeInfo?.label ?? form.type}</p>
                  </div>
                </div>

                {form.description && (
                  <p className="text-xs text-zinc-400">{form.description}</p>
                )}

                <div className="border-t border-zinc-800 pt-3">
                  <p className="text-xs text-zinc-500 mb-1">Goal</p>
                  <p className="text-sm text-white">{form.goal}</p>
                </div>

                <div className="border-t border-zinc-800 pt-3">
                  <p className="text-xs text-zinc-500 mb-1">DNA Profile</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500">Industry:</span>{" "}
                      <span className="text-zinc-300">{form.dna.industry}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Horizon:</span>{" "}
                      <span className="text-zinc-300">{form.dna.planningHorizon}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Risk:</span>{" "}
                      <span className="text-zinc-300">{form.dna.riskAppetite}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Growth:</span>{" "}
                      <span className="text-zinc-300">{form.dna.growthStyle}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-500">Metric:</span>{" "}
                      <span className="text-zinc-300">{form.dna.successMetric}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4">
        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-0">
            <h2 className="text-lg font-semibold text-white">Create Workspace</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-5 pt-4">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium transition-all",
                      i < currentIndex
                        ? "bg-white text-black"
                        : i === currentIndex
                          ? "border border-white text-white"
                          : "border border-zinc-700 text-zinc-600"
                    )}
                  >
                    {i < currentIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  {i < totalSteps - 1 && (
                    <div
                      className={cn(
                        "h-px w-12 mx-2 transition-colors",
                        i < currentIndex ? "bg-white" : "bg-zinc-800"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mb-4">
              {STEPS.map((s) => (
                <span
                  key={s.id}
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wider",
                    s.id === step ? "text-zinc-400" : "text-zinc-700"
                  )}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-5">{renderStep()}</div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-4">
            <button
              onClick={currentIndex === 0 ? onClose : goBack}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {currentIndex === 0 ? "Cancel" : "Back"}
            </button>

            {step === "review" ? (
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? (
                  "Creating..."
                ) : (
                  <>
                    Create Workspace
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
