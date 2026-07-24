/**
 * ContextBuilder — Assembles a complete WorkingMind from raw input.
 *
 * RC6: This is the orchestrator that runs each engine in sequence to
 * build the full WorkingMind state. It does NOT reason. It prepares
 * structured state for the LLM to reason over.
 *
 * Flow: Extract entities → Discover relationships → Build hypotheses →
 * Build simulations → Retrieve memory → Assemble WorkingMind
 */

import type { WorkingMind } from "./WorkingMind";
import { extractConcepts, extractGoal, extractSituation } from "./ConceptExtractor";
import { discoverRelationships } from "./RelationshipEngine";
import { buildHypothesisSlots } from "./HypothesisBuilder";
import { buildSimulationSlots } from "./SimulationQueue";
import { retrieveMemories } from "./MemoryRetriever";
import { getAgentGoal } from "./AgentMinds";

/**
 * Build a complete WorkingMind from a user message.
 * This is the main entry point to the Mind system.
 */
export async function buildWorkingMind(
  rawInput: string,
  agentType: string = 'research',
  options?: {
    sharedContextStore?: any;
    learningStore?: any;
    currentInvestigation?: string;
    currentMission?: string;
  },
): Promise<WorkingMind> {
  // 1. Extract entities and structure from raw input
  const entities = extractConcepts(rawInput);
  const goal = extractGoal(rawInput, agentType);
  const context = extractSituation(rawInput);

  // 2. Discover relationships between entities
  const relationships = discoverRelationships(entities, rawInput);

  // 3. Build hypothesis slots (empty containers for LLM to reason about)
  const hypotheses = buildHypothesisSlots(entities, relationships, rawInput);

  // 4. Build simulation slots (empty containers for LLM to simulate)
  const simulations = buildSimulationSlots(entities, rawInput);

  // 5. Identify constraints and unknowns
  const constraints = entities
    .filter(e => e.type === "constraint")
    .map(e => e.name);

  const unknowns = entities
    .filter(e => e.type === "unknown")
    .map(e => e.name);

  // 6. Determine possible directions
  const agentGoal = getAgentGoal(agentType);
  const possibleDirections = agentGoal?.defaultDirections ?? [];

  // 7. Retrieve relevant memories
  const activeMemory = await retrieveMemories(
    rawInput,
    agentType,
    options?.sharedContextStore,
    options?.learningStore,
  );

  // 8. Assemble the WorkingMind
  const mind: WorkingMind = {
    id: `mind_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    agentType,
    rawInput,
    goal,
    context,
    entities,
    relationships,
    constraints,
    unknowns,
    possibleDirections,
    userIntent: goal, // In RC6, goal IS the expressed intent
    currentInvestigation: options?.currentInvestigation,
    currentMission: options?.currentMission,
    activeMemory,
    hypotheses,
    simulations,
    openQuestions: [],
    confidence: entities.length > 0 ? Math.min(0.5 + entities.length * 0.05, 0.95) : 0.3,
    createdAt: Date.now(),
  };

  return mind;
}
