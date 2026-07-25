/**
 * CognitivePackage — RC8 universal cognitive context builder.
 *
 * Every adapter MUST send the complete cognitive package to the model:
 *   Identity → Relevant Memory → Knowledge Graph → Current Mission
 *   → WorkingMind → Conversation History → Agent Identity → User Message
 *
 * This file is shared across all adapters.
 * It is the single source of truth for how SPYRAL presents itself to any LLM.
 *
 * No UI logic. No React. No formatting. No business logic.
 * Just the model's complete reality context.
 */

import type { ReasoningPackage } from "@/core/mind";
import type { ModelProfile } from "../ReasoningProvider";

export interface CognitivePackage {
  systemPrompt: string;
  userMessage: string;
}

/**
 * Build the complete cognitive package for any model.
 *
 * @param pkg - The ReasoningPackage (identity, mind, memory, KG, history)
 * @param profile - ModelProfile (personality, constraints, behavior rules)
 * @returns systemPrompt (who the model IS) + userMessage (what to think about)
 */
export function buildCognitivePackage(
  pkg: ReasoningPackage,
  profile: ModelProfile,
): CognitivePackage {
  const { identity, instructions, mind } = pkg;

  // ══════════════════════════════════════════════════════════════════════
  // SYSTEM PROMPT — Who the model IS
  // ══════════════════════════════════════════════════════════════════════

  const systemSections: string[] = [
    `You are ${identity.name}, a cognitive agent within the SPYRAL operating system.`,
    ``,
    `Your role: ${identity.role}`,
    `Your traits: ${identity.traits.join(", ")}`,
    ``,
  ];

  // Agent personality (systemPromptExtra from profile)
  if (profile.systemPromptExtra) {
    systemSections.push(profile.systemPromptExtra);
    systemSections.push(``);
  }

  // ─── COGNITIVE LAWS (RC8) ──────────────────────────────────────────
  // These govern ALL agent behavior. Never removed, never overridden.

  systemSections.push(`COGNITIVE LAWS — These govern every response:`);
  systemSections.push(``);
  systemSections.push(`1. CONTRIBUTION: Every response must move thinking forward. Never merely ask another question.`);
  systemSections.push(`2. INFERENCE: Never ask for information that can reasonably be inferred. Think first. Ask only when blocked.`);
  systemSections.push(`3. CURIOSITY: Curiosity is exploration, not interrogation.`);
  systemSections.push(`4. INVISIBLE MACHINERY: Never expose WorkingMind, concepts, relationships, hypotheses, pipelines, confidence, memory retrieval, or any internal reasoning. Users experience intelligence, not implementation.`);
  systemSections.push(`5. NATURAL CONVERSATION: Responses must sound like two intelligent people thinking together. Never like an AI facilitator.`);
  systemSections.push(`6. DIRECTNESS: Be direct. Contribute substance before asking anything.`);
  systemSections.push(``);

  // ─── CONSTRAINTS ──────────────────────────────────────────────────

  if (instructions.constraints.length > 0) {
    systemSections.push(`CONSTRAINTS:`);
    for (const c of instructions.constraints) systemSections.push(`- ${c}`);
    systemSections.push(``);
  }

  systemSections.push(`Primary Instruction: ${instructions.primary}`);

  const systemPrompt = systemSections.join("\n");

  // ══════════════════════════════════════════════════════════════════════
  // USER MESSAGE — What the model needs to think about
  // ══════════════════════════════════════════════════════════════════════

  const userSections: string[] = [];

  // 1. RELEVANT MEMORY
  const memoryEntries = [
    ...mind.activeMemory.identity,
    ...mind.activeMemory.patterns,
    ...mind.activeMemory.preferences,
    ...mind.activeMemory.previousDiscoveries,
  ];
  if (memoryEntries.length > 0) {
    userSections.push(`RELEVANT MEMORY:`);
    for (const m of memoryEntries) userSections.push(`- ${m}`);
    userSections.push(``);
  }

  // 2. KNOWLEDGE GRAPH
  if (pkg.knowledgeGraph.entities.length > 0) {
    userSections.push(`KNOWLEDGE GRAPH:`);
    for (const e of pkg.knowledgeGraph.entities) userSections.push(`- Entity: ${e}`);
    for (const r of pkg.knowledgeGraph.relationships) {
      userSections.push(`- ${r.source} → ${r.target}: ${r.type}`);
    }
    userSections.push(``);
  }

  // 3. CURRENT MISSION / INVESTIGATION
  if (mind.currentMission || mind.currentInvestigation) {
    userSections.push(`CURRENT MISSION: ${mind.currentMission ?? mind.currentInvestigation}`);
    userSections.push(``);
  }

  // 4. WORKING MIND — structured state (the "RAM" of the cognitive system)
  userSections.push(`GOAL: ${mind.goal}`);
  userSections.push(``);
  userSections.push(`CONTEXT: ${mind.context}`);
  userSections.push(``);

  if (mind.entities.length > 0) {
    userSections.push(`KEY CONCEPTS:`);
    for (const e of mind.entities) userSections.push(`- ${e.name} (${e.type})`);
    userSections.push(``);
  }

  if (mind.relationships.length > 0) {
    userSections.push(`RELATIONSHIPS:`);
    for (const r of mind.relationships) {
      const source = mind.entities.find(e => e.id === r.sourceId)?.name ?? r.sourceId;
      const target = mind.entities.find(e => e.id === r.targetId)?.name ?? r.targetId;
      userSections.push(`- ${source} → ${target}: ${r.type}`);
    }
    userSections.push(``);
  }

  if (mind.constraints.length > 0) {
    userSections.push(`CONSTRAINTS:`);
    for (const c of mind.constraints) userSections.push(`- ${c}`);
    userSections.push(``);
  }

  if (mind.unknowns.length > 0) {
    userSections.push(`UNKNOWNS / GAPS:`);
    for (const u of mind.unknowns) userSections.push(`- ${u}`);
    userSections.push(``);
  }

  if (mind.hypotheses.length > 0) {
    userSections.push(`HYPOTHESES TO CONSIDER:`);
    for (const h of mind.hypotheses) userSections.push(`- ${h.title}: ${h.description}`);
    userSections.push(``);
  }

  if (mind.simulations.length > 0) {
    userSections.push(`WHAT-IF SCENARIOS:`);
    for (const s of mind.simulations) userSections.push(`- ${s.title}: ${s.description}`);
    userSections.push(``);
  }

  // 5. CONVERSATION HISTORY
  if (pkg.conversationHistory.length > 0) {
    const recent = pkg.conversationHistory.slice(-8);
    userSections.push(`RECENT CONVERSATION:`);
    for (const turn of recent) {
      const label = turn.role === "user" ? "User" : "You";
      userSections.push(`${label}: ${turn.content}`);
    }
    userSections.push(``);
  }

  // 6. USER MESSAGE — the current query (final prompt)
  userSections.push(`---`);
  userSections.push(mind.rawInput);

  const userMessage = userSections.join("\n");

  return { systemPrompt, userMessage };
}
