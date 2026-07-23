/**
 * SPYRAL OS — Cognitive Techniques
 *
 * RC5.1: SPYRAL Cognitive Techniques are INTERNAL reasoning behaviors.
 * They are NOT UI features.
 * They are NOT exposed to users.
 * They are NOT listed or explained.
 *
 * Occasionally, when appropriate, a composer may reference one naturally
 * as part of a response — but never by name, never as an announcement.
 *
 * Example (never say this):
 *   "I will now apply Reality Compression..."
 *
 * Instead (natural reference):
 *   "There are several assumptions bundled into this idea.
 *    I'm going to separate them before we continue."
 *
 * Each technique has:
 *   - A natural phrase for subtle use
 *   - A `shouldUse()` check (internal)
 *   - An `apply()` guidance (internal — hints at response direction)
 */

// ─── Technique Definition ───────────────────────────────────────────────────

export interface CognitiveTechnique {
  /** Internal name only — never shown to users */
  name: string;
  /** Internal description of what this technique does */
  description: string;
  /** A natural phrase that SPYRAL might weave into conversation (not by name) */
  naturalPhrase: string;
  /** Whether this technique should be used given the context */
  shouldUse: (input: string, agentType: string, turnCount: number) => boolean;
  /** Guidance for what the composer should do (never exposed) */
  apply: () => { direction: string; emphasis: string };
}

// ═════════════════════════════════════════════════════════════════════════════
// TECHNIQUES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Reality Compression — Reduce a complex situation to its governing constraints.
 * Use when: user describes a complicated situation with many variables.
 */
const RealityCompression: CognitiveTechnique = {
  name: "Reality Compression",
  description: "Reduce complexity by identifying the 2-3 governing constraints that control the system.",
  naturalPhrase: "The challenge seems larger than it really is. Let me separate what's essential from what's noise.",
  shouldUse: (input: string, _agentType: string, _turnCount: number) => {
    const wordCount = input.split(/\s+/).length;
    return wordCount > 30 || /complex|complicated|many|several|multiple|various/i.test(input);
  },
  apply: () => ({
    direction: "Identify 2-3 core constraints that govern the situation. Everything else follows from these.",
    emphasis: "Focus on leverage points — small changes that affect multiple variables.",
  }),
};

/**
 * Constraint Inversion — Turn constraints into creative fuel.
 * Use when: user lists obstacles, limitations, or things they can't do.
 */
const ConstraintInversion: CognitiveTechnique = {
  name: "Constraint Inversion",
  description: "Reframe limitations as design parameters. Ask what becomes possible within the constraint.",
  naturalPhrase: "Interesting — let's work with that limitation instead of against it. Sometimes constraints make the best decisions for you.",
  shouldUse: (input: string, _agentType: string, _turnCount: number) => {
    return /can't|cannot|don't have|limited|lack|no budget|no time|restricted|constraint|obstacle|barrier|problem/i.test(input);
  },
  apply: () => ({
    direction: "Reframe constraints as creative parameters. What emerges when we accept the limitation?",
    emphasis: "Constraints reduce optionality, which paradoxically can lead to more focused solutions.",
  }),
};

/**
 * Cross-Domain Linking — Connect patterns from unrelated fields.
 * Use when: the problem seems stuck or conventional approaches aren't working.
 */
const CrossDomainLinking: CognitiveTechnique = {
  name: "Cross-Domain Linking",
  description: "Map the problem structure onto a different domain to find novel solutions.",
  naturalPhrase: "This reminds me of problems from another field. The structure is surprisingly similar.",
  shouldUse: (input: string, _agentType: string, turnCount: number) => {
    return turnCount > 2 || /stuck|tried|conventional|typical|standard|usual/i.test(input);
  },
  apply: () => ({
    direction: "Map the underlying structure of this problem onto a different domain. What do they share?",
    emphasis: "The structural similarity between domains reveals solutions the conventional view misses.",
  }),
};

/**
 * Pattern Resonance — Recognize recurring patterns from memory.
 * Use when: the current situation matches something SPYRAL has seen before.
 */
const PatternResonance: CognitiveTechnique = {
  name: "Pattern Resonance",
  description: "Identify how current patterns echo previous experiences, investigations, or outcomes.",
  naturalPhrase: "There's a pattern here I've seen before — not identical, but structurally related.",
  shouldUse: (_input: string, _agentType: string, turnCount: number) => {
    return turnCount > 1;
  },
  apply: () => ({
    direction: "Check memory for structurally similar situations. What patterns repeat?",
    emphasis: "Past patterns inform present decisions but don't dictate them — context always matters.",
  }),
};

/**
 * Divergence Mapping — Generate multiple competing possibilities.
 * Use when: exploring an open-ended question or early-stage investigation.
 */
const DivergenceMapping: CognitiveTechnique = {
  name: "Divergence Mapping",
  description: "Branch into multiple possible explanations, strategies, or futures before converging.",
  naturalPhrase: "There are several directions we could take here. Let me map them out before we commit to one.",
  shouldUse: (input: string, _agentType: string, turnCount: number) => {
    const isEarly = turnCount <= 2;
    const isExploratory = /what if|maybe|could|possib|option|alternat|explore|think about/i.test(input);
    return isEarly || isExploratory;
  },
  apply: () => ({
    direction: "Generate 3-5 distinct possibilities before narrowing. Don't converge too early.",
    emphasis: "Early divergence prevents premature commitment to a single frame.",
  }),
};

/**
 * Convergence Synthesis — Synthesize multiple threads into a coherent direction.
 * Use when: there's enough information to form a recommendation.
 */
const ConvergenceSynthesis: CognitiveTechnique = {
  name: "Convergence Synthesis",
  description: "Weigh competing possibilities against evidence, constraints, and goals to find the strongest path.",
  naturalPhrase: "We've explored several angles. Let me pull together what seems most relevant here.",
  shouldUse: (input: string, _agentType: string, turnCount: number) => {
    return turnCount >= 3 || /decide|choose|recommend|which|best|compare|trade.?off/i.test(input);
  },
  apply: () => ({
    direction: "Synthesize available information into a coherent direction. Show your reasoning implicitly.",
    emphasis: "Convergence is strongest when it honors the best of each divergent thread.",
  }),
};

/**
 * Mission Decomposition — Break a large mission into manageable sub-goals.
 * Use when: the user describes an ambitious, multi-step goal.
 */
const MissionDecomposition: CognitiveTechnique = {
  name: "Mission Decomposition",
  description: "Break abstract ambitions into concrete, sequenced objectives.",
  naturalPhrase: "That's an ambitious goal. Let me break it down into pieces that are easier to think about.",
  shouldUse: (input: string, _agentType: string, _turnCount: number) => {
    const isAmbitious = /want to (build|create|become|start|launch|grow|scale|transform|revolutionize)/i.test(input);
    const isLongTerm = /year|decade|eventually|someday|long.?term|ultimately/i.test(input);
    return isAmbitious || isLongTerm || input.split(/\s+/).length > 25;
  },
  apply: () => ({
    direction: "Break the goal into sequenced milestones. Each milestone should feel achievable.",
    emphasis: "People overestimate what they can do in a year and underestimate what they can do in a decade.",
  }),
};

/**
 * Assumption Fracture — Identify and challenge hidden assumptions.
 * Use when: the user makes absolute statements or seems to operate on unexamined beliefs.
 */
const AssumptionFracture: CognitiveTechnique = {
  name: "Assumption Fracture",
  description: "Surface and test the assumptions the user is operating on without realizing it.",
  naturalPhrase: "There are several assumptions bundled into this idea. Let me separate them before we continue.",
  shouldUse: (input: string, _agentType: string, _turnCount: number) => {
    const hasAbsolutes = /always|never|everyone|nobody|obviously|clearly|of course|just|simply|only/i.test(input);
    const hasCertainty = /i know|i'm sure|certainly|definitely|undoubtedly/i.test(input);
    return hasAbsolutes || hasCertainty;
  },
  apply: () => ({
    direction: "Identify 2-3 implicit assumptions. Gently examine each one. Which hold? Which don't?",
    emphasis: "The most dangerous assumptions are the ones we don't know we're making.",
  }),
};

/**
 * Evidence Weaving — Connect claims to evidence naturally.
 * Use when: confidence needs to be calibrated or claims need support.
 */
const EvidenceWeaving: CognitiveTechnique = {
  name: "Evidence Weaving",
  description: "Tie conclusions to their supporting evidence without announcing the process.",
  naturalPhrase: "What we know suggests one thing, but what we don't know suggests we should be careful before concluding.",
  shouldUse: (input: string, _agentType: string, turnCount: number) => {
    return turnCount > 1 && /because|reason|evidence|proof|data|research|study|found|shows|suggests/i.test(input);
  },
  apply: () => ({
    direction: "Ground claims in evidence naturally. Distinguish what's supported from what's assumed.",
    emphasis: "Confidence should match evidence. Strong claims need strong support.",
  }),
};

/**
 * Future State Simulation — Project current trajectory forward.
 * Use when: discussing decisions with long-term consequences.
 */
const FutureStateSimulation: CognitiveTechnique = {
  name: "Future State Simulation",
  description: "Project the likely outcomes of current decisions across different time horizons.",
  naturalPhrase: "If we follow this path, here's what I think happens in 3 months, 6 months, and a year.",
  shouldUse: (input: string, _agentType: string, _turnCount: number) => {
    const hasFuture = /future|long.?term|eventually|impact|consequence|outcome|result|lead to/i.test(input);
    const hasDecision = /should i|what if|if we|when we|after|next/i.test(input);
    return hasFuture || hasDecision;
  },
  apply: () => ({
    direction: "Project 3 scenarios: optimistic, realistic, pessimistic. What drives each?",
    emphasis: "The value of simulation isn't prediction — it's preparation.",
  }),
};

/**
 * Reality Gap Projection — Highlight the gap between current and desired states.
 * Use when: there's a clear disconnect between where the user is and where they want to be.
 */
const RealityGapProjection: CognitiveTechnique = {
  name: "Reality Gap Projection",
  description: "Make the gap between current reality and desired outcome visible and actionable.",
  naturalPhrase: "Here's where you are, here's where you want to be. The interesting part is everything in between.",
  shouldUse: (input: string, _agentType: string, turnCount: number) => {
    const hasGoal = /want to|wish|goal|dream|aspire|target|aim|hope/i.test(input);
    const hasGap = /but|however|yet|still|current|right now|today/i.test(input);
    return (hasGoal || _agentType === "navigation") && (hasGap || turnCount > 0);
  },
  apply: () => ({
    direction: "Make the gap concrete. What specific things need to change to close it?",
    emphasis: "Goals without a reality check are wishes. Reality checks without goals are complaints.",
  }),
};

/**
 * Context Expansion — Broaden the frame to reveal what's being missed.
 * Use when: the user's framing seems too narrow or a problem keeps recurring.
 */
const ContextExpansion: CognitiveTechnique = {
  name: "Context Expansion",
  description: "Zoom out to reveal systemic factors, stakeholder perspectives, or longer timelines.",
  naturalPhrase: "Let me zoom out for a moment — I think there's something bigger at play here.",
  shouldUse: (input: string, _agentType: string, turnCount: number) => {
    const isNarrow = /problem|issue|fix|solve|this (one|specific|particular)/i.test(input);
    const isRecurring = /again|still|keeps|always|every time|recurring|repeat/i.test(input);
    return isNarrow || isRecurring || (_agentType === "consultant" && turnCount > 0);
  },
  apply: () => ({
    direction: "Zoom out to reveal 3 levels up: system, stakeholders, longer timeline.",
    emphasis: "The level of the problem is never the level of the solution.",
  }),
};

// ═════════════════════════════════════════════════════════════════════════════
// REGISTRY
// ═════════════════════════════════════════════════════════════════════════════

export const COGNITIVE_TECHNIQUES: CognitiveTechnique[] = [
  RealityCompression,
  ConstraintInversion,
  CrossDomainLinking,
  PatternResonance,
  DivergenceMapping,
  ConvergenceSynthesis,
  MissionDecomposition,
  AssumptionFracture,
  EvidenceWeaving,
  FutureStateSimulation,
  RealityGapProjection,
  ContextExpansion,
];

/**
 * Select techniques that are appropriate for the current context.
 * Returns techniques sorted by relevance (most relevant first).
 */
export function selectTechniques(
  input: string,
  agentType: string,
  turnCount: number,
  maxTechniques: number = 2,
): CognitiveTechnique[] {
  const applicable = COGNITIVE_TECHNIQUES.filter((t) => t.shouldUse(input, agentType, turnCount));
  // Shuffle applicable and pick up to maxTechniques to avoid predictability
  const shuffled = [...applicable].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, maxTechniques);
}

/**
 * Get a natural phrase for a technique that might be appropriate.
 * Returns null if no technique seems relevant — don't force it.
 */
export function getNaturalTechniqueHint(
  input: string,
  agentType: string,
  turnCount: number,
): string | null {
  const techniques = selectTechniques(input, agentType, turnCount, 1);
  if (techniques.length === 0) return null;
  // Only use a technique hint some of the time — never overuse
  if (Math.random() > 0.4) return null;
  return techniques[0].naturalPhrase;
}

/**
 * Get the direction guidance from applicable techniques.
 * Used internally by composers to shape their response.
 */
export function getTechniqueDirections(
  input: string,
  agentType: string,
  turnCount: number,
): { direction: string; emphasis: string }[] {
  return selectTechniques(input, agentType, turnCount, 3).map((t) => t.apply());
}
