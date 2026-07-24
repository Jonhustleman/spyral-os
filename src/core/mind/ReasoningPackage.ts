/**
 * ReasoningPackage — Universal model-agnostic input to any LLM.
 *
 * RC7: This is the ONLY thing any LLM ever receives from SPYRAL.
 * It is the complete context for a reasoning request.
 *
 * The ReasoningPackage contains everything the model needs:
 *   - Identity (who the model should be)
 *   - Goal + Mission (what we're trying to achieve)
 *   - WorkingMind (the structured state of the current problem)
 *   - Memory (what SPYRAL remembers from past interactions)
 *   - Knowledge Graph (entities, relationships, patterns)
 *   - Conversation History (recent conversation turns)
 *   - Instructions (how the model should reason)
 *
 * Design principle: Never let the mind depend on a specific model provider.
 * This package is serialized to text for any model to consume.
 */

import type { WorkingMind } from "./WorkingMind";

// ═══════════════════════════════════════════════════════════════════════════
// REASONING PACKAGE — The universal interface
// ═══════════════════════════════════════════════════════════════════════════

export interface ReasoningPackage {
  // ─── IDENTITY ──────────────────────────────────────────────────────

  /** Agent identity for the LLM to adopt */
  identity: {
    name: string;
    role: string;
    traits: string[];
  };

  // ─── GOAL & MISSION ────────────────────────────────────────────────

  /** Current goal derived from user input */
  currentGoal: string;

  /** Current mission (persists across conversation, from ConversationMind) */
  currentMission?: string;

  /** Current investigation (more exploratory than a mission) */
  currentInvestigation?: string;

  // ─── WORKING MIND ──────────────────────────────────────────────────

  /** The complete WorkingMind state for this turn */
  mind: WorkingMind;

  // ─── MEMORY ────────────────────────────────────────────────────────

  /** Identity memory (who SPYRAL is) */
  identityMemory: string[];

  /** Patterns observed across conversations */
  patterns: string[];

  /** User preferences */
  userPreferences: string[];

  /** Previous discoveries */
  previousDiscoveries: string[];

  // ─── KNOWLEDGE GRAPH ───────────────────────────────────────────────

  /** Relevant knowledge graph entities */
  knowledgeGraph: {
    entities: string[];
    relationships: { source: string; target: string; type: string }[];
  };

  // ─── CONVERSATION HISTORY ─────────────────────────────────────────

  /** Recent conversation turns (up to last 10) */
  conversationHistory: { role: "user" | "assistant"; content: string }[];

  // ─── INSTRUCTIONS ──────────────────────────────────────────────────

  /** Instructions for the LLM */
  instructions: {
    primary: string;
    constraints: string[];
    approach: string;
  };

  // ─── METADATA ──────────────────────────────────────────────────────

  /** Agent type that initiated this reasoning */
  agentType: string;

  /** Package format version */
  version: string;

  /** When this package was created */
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

// ─── Builder ─────────────────────────────────────────────────────────────

/**
 * Build a complete ReasoningPackage from WorkingMind + additional context.
 * This is the final step before sending to any LLM.
 */
export function buildReasoningPackage(
  mind: WorkingMind,
  options?: {
    customIdentity?: { name: string; role: string; traits: string[] };
    conversationHistory?: { role: "user" | "assistant"; content: string }[];
    knowledgeGraph?: { entities: string[]; relationships: { source: string; target: string; type: string }[] };
    patterns?: string[];
    predictions?: string[];
    userPreferences?: string[];
  },
): ReasoningPackage {
  const identity = options?.customIdentity ?? AGENT_IDENTITIES[mind.agentType] ?? DEFAULT_IDENTITY;

  // Build instructions based on WorkingMind state
  const instructions = buildInstructions(mind, identity);

  // Collect memory from WorkingMind
  const identityMemory = [...mind.activeMemory.identity];
  const patterns = options?.patterns ?? [...mind.activeMemory.patterns];
  const userPreferences = options?.userPreferences ?? [...mind.activeMemory.preferences];
  const previousDiscoveries = options?.patterns ?? [...mind.activeMemory.previousDiscoveries];

  return {
    identity,
    currentGoal: mind.goal,
    currentMission: mind.currentMission,
    currentInvestigation: mind.currentInvestigation,
    mind,
    identityMemory,
    patterns,
    userPreferences,
    previousDiscoveries,
    knowledgeGraph: options?.knowledgeGraph ?? { entities: [], relationships: [] },
    conversationHistory: options?.conversationHistory ?? [],
    instructions,
    agentType: mind.agentType,
    version: "2.0.0",
    createdAt: Date.now(),
  };
}

// ─── Serialization ───────────────────────────────────────────────────────

/**
 * Serialize a ReasoningPackage to structured text for any LLM to consume.
 * This is NOT a prompt template — it's a structural serialization.
 * Every adapter receives this but can use its own serialization.
 */
export function serializeReasoningPackage(pkg: ReasoningPackage): string {
  const sections: string[] = [];

  // Identity
  sections.push(`# ${pkg.identity.name}`);
  sections.push(`Role: ${pkg.identity.role}`);
  sections.push(`Traits: ${pkg.identity.traits.join(", ")}`);
  sections.push("");

  // Mission / Investigation
  if (pkg.currentMission) {
    sections.push(`## Current Mission`);
    sections.push(pkg.currentMission);
    sections.push("");
  }
  if (pkg.currentInvestigation) {
    sections.push(`## Current Investigation`);
    sections.push(pkg.currentInvestigation);
    sections.push("");
  }

  // Goal + Context
  sections.push(`## Goal`);
  sections.push(pkg.currentGoal);
  sections.push("");
  sections.push(`## Context`);
  sections.push(pkg.mind.context);
  sections.push("");

  // Entities
  if (pkg.mind.entities.length > 0) {
    sections.push(`## Key Concepts`);
    for (const e of pkg.mind.entities) {
      sections.push(`- ${e.name} (${e.type})${e.source === 'user' ? '' : ' [from memory]'}`);
    }
    sections.push("");
  }

  // Relationships
  if (pkg.mind.relationships.length > 0) {
    sections.push(`## Relationships`);
    for (const r of pkg.mind.relationships) {
      const source = pkg.mind.entities.find(e => e.id === r.sourceId)?.name ?? r.sourceId;
      const target = pkg.mind.entities.find(e => e.id === r.targetId)?.name ?? r.targetId;
      sections.push(`- ${source} ${r.type} ${target} (${r.strength})`);
    }
    sections.push("");
  }

  // Constraints
  if (pkg.mind.constraints.length > 0) {
    sections.push(`## Constraints`);
    for (const c of pkg.mind.constraints) sections.push(`- ${c}`);
    sections.push("");
  }

  // Unknowns
  if (pkg.mind.unknowns.length > 0) {
    sections.push(`## Unknowns / Gaps`);
    for (const u of pkg.mind.unknowns) sections.push(`- ${u}`);
    sections.push("");
  }

  // Memory
  const memoryEntries = [
    ...pkg.identityMemory,
    ...pkg.patterns,
    ...pkg.userPreferences,
    ...pkg.previousDiscoveries,
  ];
  if (memoryEntries.length > 0) {
    sections.push(`## Relevant Memory`);
    for (const m of memoryEntries) sections.push(`- ${m}`);
    sections.push("");
  }

  // Knowledge Graph
  if (pkg.knowledgeGraph.entities.length > 0 || pkg.knowledgeGraph.relationships.length > 0) {
    sections.push(`## Knowledge Graph`);
    if (pkg.knowledgeGraph.entities.length > 0) {
      sections.push(`Entities: ${pkg.knowledgeGraph.entities.join(", ")}`);
    }
    for (const r of pkg.knowledgeGraph.relationships) {
      sections.push(`- ${r.source} ${r.type} ${r.target}`);
    }
    sections.push("");
  }

  // Hypotheses
  if (pkg.mind.hypotheses.length > 0) {
    sections.push(`## Possible Hypotheses`);
    for (const h of pkg.mind.hypotheses) {
      sections.push(`### ${h.title}`);
      sections.push(h.description);
    }
    sections.push("");
  }

  // Simulations
  if (pkg.mind.simulations.length > 0) {
    sections.push(`## What-If Scenarios`);
    for (const s of pkg.mind.simulations) {
      sections.push(`### ${s.title}`);
      sections.push(s.description);
    }
    sections.push("");
  }

  // Conversation History
  if (pkg.conversationHistory.length > 0) {
    sections.push(`## Recent Conversation`);
    for (const turn of pkg.conversationHistory.slice(-6)) {
      sections.push(`**${turn.role === "user" ? "User" : "You"}**: ${turn.content}`);
    }
    sections.push("");
  }

  // Instructions
  sections.push(`## Instructions`);
  sections.push(pkg.instructions.primary);
  if (pkg.instructions.constraints.length > 0) {
    sections.push("");
    sections.push(`### Constraints`);
    for (const c of pkg.instructions.constraints) sections.push(`- ${c}`);
  }
  sections.push("");
  sections.push(`### Approach`);
  sections.push(pkg.instructions.approach);

  return sections.join("\n");
}

// ─── Instruction builder ─────────────────────────────────────────────────

function buildInstructions(
  mind: WorkingMind,
  identity: { name: string; role: string; traits: string[] },
): ReasoningPackage['instructions'] {
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
