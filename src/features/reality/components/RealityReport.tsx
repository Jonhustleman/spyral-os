/**
 * RealityReport — Formatted Reality Cycle Report for the frontend.
 *
 * Displays the full SPYRAL cycle output including:
 *   - Current Reality assessment
 *   - Desired Reality
 *   - Gap Analysis
 *   - Hidden Structure Analysis
 *   - Strategy Generation (3 strategies)
 *   - Strategy Recommendation
 *   - Execution Plan (72h / 30d / 90d)
 *   - Validation Loop
 *   - Confidence Assessment
 *
 * Reads data from RealityStore snapshot or accepts report data as props.
 */

"use client";

import { useState } from "react";
import {
  Eye,
  Brain,
  Target,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Shield,
  TrendingUp,
  FileText,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  BarChart3,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ReportData {
  goal: string;
  workspaceName: string;
  cycleId: string;

  // 1. Current Reality
  situation: string;
  knownFactors: string[];
  constraints: string[];
  missingInfo: string[];
  keyAssumptions: string[];

  // 2. Desired Reality
  targetOutcome: string;
  successCriteria: string[];
  timeline: string;

  // 3. Gap Analysis
  gapCurrentState: string;
  gapDesiredState: string;
  gapDescription: string;
  mainObstacles: string[];
  leveragePoints: string[];

  // 4. Hidden Structure
  keyVariables: string[];
  patternsDetected: string[];
  bottlenecks: string[];

  // 5. Strategies
  strategies: StrategyReportItem[];

  // 6. Recommendation
  selectedStrategy: string;
  reasonSelected: string;
  evidence: string[];
  uncertainty: string[];

  // 7. Execution Plan
  first72h: string[];
  first30d: { milestone: string; action: string; criteria: string }[];
  first90d: { milestone: string; action: string; criteria: string }[];

  // 8. Validation Loop
  prediction: string;
  measurement: string;
  adaptation: string;

  // Confidence
  confidenceScore: number;
  confidenceReason: string;
  unknownFactors: string[];
}

export interface StrategyReportItem {
  name: string;
  explanation: string;
  whyItMayWork: string;
  steps: string[];
  resourcesRequired: string[];
  timeline: string;
  expectedOutcome: string;
  risks: string[];
  confidenceScore: string;
  measurementMethod: string;
}

// ─── Section wrapper ────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  number,
  children,
  defaultOpen = true,
}: {
  icon: React.ElementType;
  title: string;
  number: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-800 text-[10px] font-bold text-zinc-400">
            {number}
          </span>
          <Icon className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-zinc-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        )}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface RealityReportProps {
  data: ReportData;
  onStartNewCycle?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function RealityReport({ data, onStartNewCycle }: RealityReportProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-xs font-bold text-black">S</span>
          </div>
          <span className="text-xs font-mono text-zinc-600">{data.cycleId}</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-1">SPYRAL Reality Report</h1>
        <p className="text-sm text-zinc-500">{data.goal.substring(0, 80)}</p>
        <p className="text-[11px] text-zinc-600 mt-1">Workspace: {data.workspaceName}</p>
      </div>

      {/* 1. Current Reality */}
      <Section icon={Eye} title="Current Reality" number="1">
        <p className="text-sm text-zinc-300">{data.situation}</p>
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Known factors</p>
          <div className="flex flex-wrap gap-1.5">
            {data.knownFactors.map((f, i) => (
              <span key={i} className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400 border border-emerald-500/20">
                {f}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Constraints</p>
          <ul className="space-y-1">
            {data.constraints.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <span className="text-zinc-600 mt-0.5">•</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-amber-500 mb-1.5 uppercase tracking-wider">Missing information</p>
          <ul className="space-y-1">
            {data.missingInfo.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-400/70">
                <span className="text-amber-500/50 mt-0.5">?</span>
                {m}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-blue-500 mb-1.5 uppercase tracking-wider">Key assumptions</p>
          <ul className="space-y-1">
            {data.keyAssumptions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-blue-400/70">
                <span className="text-blue-500/50 mt-0.5">→</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 2. Desired Reality */}
      <Section icon={Target} title="Desired Reality" number="2">
        <p className="text-sm text-zinc-300">{data.targetOutcome}</p>
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Success criteria</p>
          <ul className="space-y-1">
            {data.successCriteria.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <CheckCircle className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Clock className="h-3 w-3" />
          Timeline: {data.timeline}
        </div>
      </Section>

      {/* 3. Gap Analysis */}
      <Section icon={AlertTriangle} title="Gap Analysis" number="3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-1">Current state</p>
            <p className="text-sm text-zinc-300">{data.gapCurrentState}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-1">Desired state</p>
            <p className="text-sm text-zinc-300">{data.gapDesiredState.substring(0, 60)}</p>
          </div>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-[10px] font-medium text-amber-500 uppercase tracking-wider mb-1">Gap</p>
          <p className="text-xs text-amber-400/80">{data.gapDescription}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-red-500 mb-1.5 uppercase tracking-wider">Main obstacles</p>
            <ul className="space-y-1">
              {data.mainObstacles.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                  <span className="text-red-500 mt-0.5">✕</span>
                  {o}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-500 mb-1.5 uppercase tracking-wider">Leverage points</p>
            <ul className="space-y-1">
              {data.leveragePoints.map((l, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                  <span className="text-emerald-500 mt-0.5">+</span>
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* 4. Hidden Structure */}
      <Section icon={Brain} title="Hidden Structure Analysis" number="4">
        <div>
          <p className="text-xs font-medium text-purple-500 mb-1.5 uppercase tracking-wider">Key variables controlling outcome</p>
          <ul className="space-y-1">
            {data.keyVariables.map((v, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <Lightbulb className="h-3 w-3 text-purple-500 mt-0.5 shrink-0" />
                {v}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-cyan-500 mb-1.5 uppercase tracking-wider">Patterns detected</p>
          <ul className="space-y-1">
            {data.patternsDetected.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <span className="text-cyan-500 mt-0.5">~</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-rose-500 mb-1.5 uppercase tracking-wider">Possible bottlenecks</p>
          <ul className="space-y-1">
            {data.bottlenecks.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-rose-400/70">
                <Shield className="h-3 w-3 text-rose-500 mt-0.5 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 5. Strategies */}
      <Section icon={TrendingUp} title="Strategy Generation" number="5" defaultOpen={false}>
        {data.strategies.map((strategy, i) => (
          <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">
                Strategy {i + 1}: {strategy.name}
              </h4>
              <span className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                parseInt(strategy.confidenceScore) >= 70
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : parseInt(strategy.confidenceScore) >= 50
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
              )}>
                {strategy.confidenceScore} confidence
              </span>
            </div>
            <p className="text-xs text-zinc-400">{strategy.explanation}</p>
            <p className="text-[11px] text-zinc-500">
              <span className="text-zinc-400 font-medium">Why it may work:</span> {strategy.whyItMayWork}
            </p>
            <div>
              <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-1">Steps</p>
              <ol className="space-y-1">
                {strategy.steps.map((step, si) => (
                  <li key={si} className="flex items-start gap-2 text-[11px] text-zinc-400">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-[9px] text-zinc-500 shrink-0 mt-0.5">
                      {si + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500">
              <span>📋 {strategy.resourcesRequired.join(", ")}</span>
              <span>⏱ {strategy.timeline}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500">
              <span>🎯 {strategy.expectedOutcome.substring(0, 80)}</span>
            </div>
            <div>
              <p className="text-[10px] font-medium text-rose-500 uppercase tracking-wider mb-1">Risks</p>
              <p className="text-[11px] text-rose-400/70">{strategy.risks.join("; ")}</p>
            </div>
            <p className="text-[10px] text-zinc-600">📊 Measurement: {strategy.measurementMethod}</p>
          </div>
        ))}
      </Section>

      {/* 6. Recommendation */}
      <Section icon={CheckCircle} title="Strategy Recommendation" number="6">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
          <p className="text-xs font-semibold text-emerald-400">Selected: {data.selectedStrategy}</p>
          <p className="text-xs text-zinc-400">{data.reasonSelected}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-emerald-500 mb-1.5 uppercase tracking-wider">Evidence supporting choice</p>
          <ul className="space-y-1">
            {data.evidence.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <span className="text-emerald-500 mt-0.5">✓</span>
                {e}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-amber-500 mb-1.5 uppercase tracking-wider">Uncertainty remaining</p>
          <ul className="space-y-1">
            {data.uncertainty.map((u, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-400/70">
                <span className="text-amber-500 mt-0.5">?</span>
                {u}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 7. Execution Plan */}
      <Section icon={BarChart3} title="Execution Plan" number="7">
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            First 72 hours
          </p>
          <ol className="space-y-1.5">
            {data.first72h.map((task, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[9px] text-zinc-500 shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {task}
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Target className="h-3 w-3" />
            First 30 days
          </p>
          {data.first30d.map((m, i) => (
            <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 mb-2">
              <p className="text-xs font-medium text-white mb-0.5">{m.milestone}</p>
              <p className="text-[11px] text-zinc-400 mb-1">{m.action}</p>
              <p className="text-[10px] text-zinc-600">✓ Success: {m.criteria}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3" />
            First 90 days
          </p>
          {data.first90d.map((m, i) => (
            <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 mb-2">
              <p className="text-xs font-medium text-white mb-0.5">{m.milestone}</p>
              <p className="text-[11px] text-zinc-400 mb-1">{m.action}</p>
              <p className="text-[10px] text-zinc-600">✓ Success: {m.criteria}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 8. Validation Loop */}
      <Section icon={RefreshCw} title="Validation Loop" number="8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
            <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wider mb-1">Prediction</p>
            <p className="text-[11px] text-blue-400/80">{data.prediction.substring(0, 100)}</p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-[10px] font-medium text-emerald-500 uppercase tracking-wider mb-1">Measurement</p>
            <p className="text-[11px] text-emerald-400/80">{data.measurement.substring(0, 100)}</p>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-[10px] font-medium text-amber-500 uppercase tracking-wider mb-1">Adaptation</p>
            <p className="text-[11px] text-amber-400/80">{data.adaptation.substring(0, 100)}</p>
          </div>
        </div>
      </Section>

      {/* Confidence Assessment */}
      <Section icon={Shield} title="Confidence Assessment" number="9">
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-14 w-14 rounded-full flex items-center justify-center text-sm font-bold border-2",
              data.confidenceScore >= 70
                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                : data.confidenceScore >= 50
                  ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                  : "border-zinc-500/40 text-zinc-400 bg-zinc-500/10"
            )}>
              {data.confidenceScore}%
            </div>
            <div>
              <p className="text-xs text-zinc-400">Confidence score</p>
              <p className="text-[10px] text-zinc-600">Floor: 45% | Ceiling: 85%</p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Reason</p>
          <p className="text-xs text-zinc-400">{data.confidenceReason}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-amber-500 mb-1.5 uppercase tracking-wider">Unknown factors</p>
          <ul className="space-y-1">
            {data.unknownFactors.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-400/70">
                <span className="text-amber-500 mt-0.5">?</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Next actions */}
      <div className="text-center pt-4">
        {onStartNewCycle && (
          <button
            onClick={onStartNewCycle}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Start New Reality Cycle
          </button>
        )}
      </div>
    </div>
  );
}
