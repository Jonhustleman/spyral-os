/**
 * HypothesisBuilder — Creates structured hypothesis slots for the LLM to reason about.
 *
 * RC6: This does NOT reason. It does NOT evaluate hypotheses.
 * It simply creates the STRUCTURE for possible explanations.
 * The LLM receives these slots and reasons over them.
 *
 * Think of this as setting up empty containers that the LLM fills with reasoning.
 */

import type { Entity, HypothesisSlot, Relationship } from "./WorkingMind";

let _hypCounter = 0;

function nextHypId(): string {
  return `hypothesis_${++_hypCounter}`;
}

/**
 * Build hypothesis slots based on entities and relationships.
 *
 * Each hypothesis is just a structured container: title, description, entities involved.
 * No evaluation. No reasoning. No confidence scores.
 * The LLM decides which hypotheses are valid and interesting.
 */
export function buildHypothesisSlots(
  entities: Entity[],
  relationships: Relationship[],
  rawInput: string,
): HypothesisSlot[] {
  const slots: HypothesisSlot[] = [];

  // Filter to user-provided entities (the core concepts to reason about)
  const userEntities = entities.filter(e => e.source === "user");
  if (userEntities.length === 0) return slots;

  // Hypothesis 1: Direct impact — what does the primary entity directly affect?
  const primary = userEntities[0];
  const directRels = relationships.filter(r => r.sourceId === primary.id || r.targetId === primary.id);
  if (directRels.length > 0) {
    const connectedIds = new Set<string>();
    directRels.forEach(r => {
      connectedIds.add(r.sourceId === primary.id ? r.targetId : r.sourceId);
    });
    const connectedNames = [...connectedIds]
      .map(id => entities.find(e => e.id === id)?.name)
      .filter(Boolean);

    slots.push({
      id: nextHypId(),
      title: `Direct Impact of ${primary.name}`,
      description: `How does ${primary.name} affect or relate to ${connectedNames.join(", ")}?`,
      entities: [primary.id, ...connectedIds],
    });
  }

  // Hypothesis 2: Broader implications
  const domains = entities.filter(e => e.type === "domain");
  if (domains.length > 0) {
    slots.push({
      id: nextHypId(),
      title: `Broader Implications`,
      description: `What are the broader implications across ${domains.map(d => d.name).join(", ")}?`,
      entities: domains.map(d => d.id),
    });
  }

  // Hypothesis 3: Contrarian or non-obvious
  if (userEntities.length >= 2) {
    const last = userEntities[userEntities.length - 1];
    slots.push({
      id: nextHypId(),
      title: `Non-Obvious Connection`,
      description: `What is the least obvious relationship between ${primary.name} and ${last.name}?`,
      entities: [primary.id, last.id],
    });
  }

  // Hypothesis 4: Change over time
  slots.push({
    id: nextHypId(),
    title: `What Changes`,
    description: `If the core premise is true, what existing structures would change most? What would stay the same?`,
    entities: userEntities.map(e => e.id),
  });

  return slots;
}
