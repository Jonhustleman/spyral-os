/**
 * SimulationQueue — Creates structured what-if scenario slots for the LLM to simulate.
 *
 * RC6: This does NOT simulate anything. It does NOT evaluate outcomes.
 * It simply creates the STRUCTURE for possible what-if scenarios.
 * The LLM receives these slots and performs the actual mental simulation.
 *
 * Think of this as setting up empty sandboxes that the LLM fills with simulation.
 */

import type { Entity, SimulationSlot } from "./WorkingMind";

let _simCounter = 0;

function nextSimId(): string {
  return `simulation_${++_simCounter}`;
}

/**
 * Build simulation slots based on entities.
 *
 * Each simulation is just a structured container: title, description, entities involved.
 * No evaluation. No outcomes. No plausibility scores.
 * The LLM decides how the simulation plays out.
 */
export function buildSimulationSlots(
  entities: Entity[],
  rawInput: string,
): SimulationSlot[] {
  const slots: SimulationSlot[] = [];

  const userEntities = entities.filter(e => e.source === "user");
  if (userEntities.length === 0) return slots;

  const primary = userEntities[0];

  // Simulation 1: What breaks?
  slots.push({
    id: nextSimId(),
    title: `What Breaks`,
    description: `If the premise about "${primary.name}" is true — what existing systems, assumptions, or structures would break or become obsolete?`,
    entities: userEntities.map(e => e.id),
  });

  // Simulation 2: What emerges?
  slots.push({
    id: nextSimId(),
    title: `What Emerges`,
    description: `What new opportunities, behaviors, or structures would emerge that don't exist today?`,
    entities: userEntities.map(e => e.id),
  });

  // Simulation 3: What survives?
  const nonPrimary = userEntities.filter(e => e.id !== primary.id);
  if (nonPrimary.length > 0) {
    slots.push({
      id: nextSimId(),
      title: `What Survives`,
      description: `What existing elements remain relevant or become more important even after this change?`,
      entities: userEntities.map(e => e.id),
    });
  }

  // Simulation 4: Unexpected consequence
  slots.push({
    id: nextSimId(),
    title: `Unexpected Consequence`,
    description: `What is a non-obvious, second-order consequence that most people would overlook?`,
    entities: userEntities.map(e => e.id),
  });

  return slots;
}
