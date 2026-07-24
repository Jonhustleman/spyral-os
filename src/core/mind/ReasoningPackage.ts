/**
 * ReasoningPackage — Model-agnostic structured thought format.
 *
 * RC6: This is the output of the WorkingMind system and the input to any LLM.
 * It converts the WorkingMind state + genome identity into a neutral
 * structured package that ANY model can consume (OpenAI, Claude, local, etc.).
 *
 * The ReasoningPackage is the bridge between the mind and the language layer.
 * It is NOT a prompt template. It is structured data that can be
 * serialized to text in a model-agnostic way.
 *
 * Design principle: Never let the mind depend on a specific model provider.
 */

import type { WorkingMind } from "./WorkingMind";

export interface ReasoningPackage {
  /** The WorkingMind state that produced this package */
  mind: WorkingMind;

  /** Agent identity/genome for the LLM to adopt */
  identity: {
    name: string;
    role: string;
    traits: string[];
  };

  /** Instructions for the LLM — written to guide, not prescribe */
  instructions: {
    primary: string;
    constraints: string[];
    approach: string;
  };

  /** Metadata */
  version: string;
  createdAt: number;
}

// ─── Agent identity definitions ──────────────────────────────────────────

const AGENT_IDENTITIES: Record<string, { name: string; role: string; traits: string[] }> = {
  research: {
    name: "Researcher",
    role: "Explore ideas, ask deeper questions, connect concepts across domains",
    traits: ["curious", "cross-disciplinary", "precision-seeking", "pattern-aware"],
  },
  content: {
    name: "Creative Director",
    role: "Shape raw ideas into narratives, find the story, guide creative expression",
    traits: ["creative", "narrative-focused", "metaphor-driven", "audience-aware"],
  },
  consultant: {
    name: "Executive Strategist",
    role: "Analyze decisions, reveal trade-offs, recommend direction",
    traits: ["analytical", "clear-eyed", "decision-focused", "honest"],
  },
  navigation: {
    name: "Future Planner",
    role: "Map journeys, identify paths, think in trajectories and transformations",
    traits: ["visionary", "strategic", "direction-oriented", "possibility-aware"],
  },
  command: {
    name: "Mission Control",
    role: "Coordinate work, track progress, route requests to the right agent",
    traits: ["organized", "efficient", "action-oriented", "clear"],
  },
};

const DEFAULT_IDENTITY = {
  name: "SPYRAL Agent",
  role: "Think carefully and respond thoughtfully",
  traits: ["thoughtful", "precise", "helpful"],
};

/**
 * Build a ReasoningPackage from a WorkingMind.
 * This is the final step before serialization to natural language.
 * Any LLM can consume this package.
 */
export function buildReasoningPackage(
  mind: WorkingMind,
  options?: {
    customIdentity?: { name: string; role: string; traits: string[] };
    customInstructions?: string;
  },
): ReasoningPackage {
  const identity = options?.customIdentity ?? AGENT_IDENTITIES[mind.agentType] ?? DEFAULT_IDENTITY;

  // Build structured instructions based on WorkingMind state
  const instructions = buildInstructions(mind, identity);

  return {
    mind,
    identity,
    instructions,
    version: "1.0.0",
    createdAt: Date.now(),
  };
}

/**
 * Serialize a ReasoningPackage to natural language text.
 * This is NOT a prompt template — it's a structural serialization
 * that any model can consume.
 */
export function serializeReasoningPackage(pkg: ReasoningPackage): string {
  const { mind, identity, instructions } = pkg;

  const sections: string[] = [];

  // Identity
  sections.push(`# ${identity.name}`);
  sections.push(`Role: ${identity.role}`);
  sections.push(`Traits: ${identity.traits.join(", ")}`);
  sections.push("");

  // Goal + Context
  sections.push(`## Goal`);
  sections.push(mind.goal);
  sections.push("");
  sections.push(`## Context`);
  sections.push(mind.context);
  sections.push("");

  // Entities
  if (mind.entities.length > 0) {
    sections.push(`## Key Concepts`);
    for (const e of mind.entities) {
      sections.push(`- ${e.name} (${e.type})${e.source === 'user' ? '' : ' [from memory]'}`);
    }
    sections.push("");
  }

  // Relationships
  if (mind.relationships.length > 0) {
    sections.push(`## Relationships`);
    for (const r of mind.relationships) {
      const source = mind.entities.find(e => e.id === r.sourceId)?.name ?? r.sourceId;
      const target = mind.entities.find(e => e.id === r.targetId)?.name ?? r.targetId;
      sections.push(`- ${source} ${r.type} ${target} (${r.strength})`);
    }
    sections.push("");
  }

  // Constraints
  if (mind.constraints.length > 0) {
    sections.push(`## Constraints`);
    for (const c of mind.constraints) sections.push(`- ${c}`);
    sections.push("");
  }

  // Unknowns
  if (mind.unknowns.length > 0) {
    sections.push(`## Unknowns / Gaps`);
    for (const u of mind.unknowns) sections.push(`- ${u}`);
    sections.push("");
  }

  // Possible Directions
  if (mind.possibleDirections.length > 0) {
    sections.push(`## Possible Directions`);
    for (const d of mind.possibleDirections) sections.push(`- ${d}`);
    sections.push("");
  }

  // Memory
  const memoryEntries = [
    ...mind.activeMemory.identity,
    ...mind.activeMemory.patterns,
    ...mind.activeMemory.preferences,
    ...mind.activeMemory.previousDiscoveries,
  ];
  if (memoryEntries.length > 0) {
    sections.push(`## Relevant Memory`);
    for (const m of memoryEntries) sections.push(`- ${m}`);
    sections.push("");
  }

  // Hypotheses (empty slots for LLM to fill)
  if (mind.hypotheses.length > 0) {
    sections.push(`## Possible Hypotheses`);
    for (const h of mind.hypotheses) {
      sections.push(`### ${h.title}`);
      sections.push(h.description);
    }
    sections.push("");
  }

  // Simulations (empty slots for LLM to fill)
  if (mind.simulations.length > 0) {
    sections.push(`## What-If Scenarios`);
    for (const s of mind.simulations) {
      sections.push(`### ${s.title}`);
      sections.push(s.description);
    }
    sections.push("");
  }

  // Instructions
  sections.push(`## Instructions`);
  sections.push(instructions.primary);
  if (instructions.constraints.length > 0) {
    sections.push("");
    sections.push(`### Constraints`);
    for (const c of instructions.constraints) sections.push(`- ${c}`);
  }
  sections.push("");
  sections.push(`### Approach`);
  sections.push(instructions.approach);

  return sections.join("\n");
}

// ─── Instruction builder ─────────────────────────────────────────────────

function buildInstructions(
  mind: WorkingMind,
  identity: { name: string; role: string; traits: string[] },
): ReasoningPackage['instructions'] {
  // Determine approach based on WorkingMind state
  let approach = "Think carefully about the user's input and context.";

  if (mind.hypotheses.length > 0) {
    approach = `Consider the possible hypotheses: which seems most plausible and why? What evidence supports or contradicts each one?`;
  }

  if (mind.simulations.length > 0) {
    approach += ` Also explore the what-if scenarios: what would break, emerge, survive, or surprise?`;
  }

  if (mind.relationships.length > 0) {
    approach += ` Pay particular attention to the relationships between concepts — which connections are most significant?`;
  }

  return {
    primary: `As ${identity.name}, help the user think through their question. ${mind.rawInput ? `The user said: "${mind.rawInput}"` : ''}`,
    constraints: [
      "Do not ask questions the user can't answer yet",
      "If confident, contribute before asking",
      "Be honest about uncertainty",
    ],
    approach,
  };
}
