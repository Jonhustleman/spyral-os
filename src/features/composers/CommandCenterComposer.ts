/**
 * CommandCenterComposer — Mission Control
 *
 * RC5.1 Identity: Mission Control.
 * Its job is orchestration — routing work to the correct cognitive engine.
 * This is NOT a chat composer. It's the mission control dashboard.
 * One glance, not paragraphs.
 *
 * Workflow:
 *   Assess current state → Surface what matters →
 *   Route to the right engine → Stay out of the way
 *
 * Never generates reports. Never exposes internal state labels.
 * If the user says something open-ended, responds briefly and
 * directs them to the appropriate agent naturally.
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";

/**
 * Command Center Composer.
 * RC5.1: Mission Control — orchestration, not chat.
 * Routes work to the correct cognitive engine.
 * One glance, not paragraphs. Never exposes internal state.
 */
export const CommandCenterComposer: ResponseComposer = (
  input: ComposerInput,
  context?: ComposerContext,
): string => {
  const { currentInvestigation, currentProject, userName } = context || {};
  const text = input.input.input?.toLowerCase() || "";

  // ─── Orchestration: Route to the right engine ─────────────────────────
  // If the user explicitly mentions an engine, route them naturally.
  if (text.includes("research") || text.includes("investigate") || text.includes("explore")) {
    return "That sounds like a research question. You'll want the Research engine for this — it's built for exploration.";
  }
  if (text.includes("content") || text.includes("create") || text.includes("campaign")) {
    return "This feels like a creative challenge. The Content engine would be the right place for this.";
  }
  if (text.includes("navigate") || text.includes("goal") || text.includes("plan") || text.includes("launch")) {
    return "Sounds like you're mapping out a direction. The Navigation engine will help you think through the path.";
  }
  if (text.includes("consult") || text.includes("advise") || text.includes("strategy") || text.includes("decision")) {
    return "This needs strategic thinking. The Consultant engine is the right partner for this.";
  }

  // ─── Active context — surface what matters conversationally ─────────
  if (currentInvestigation || currentProject) {
    const parts: string[] = [];

    if (currentProject && currentInvestigation) {
      parts.push(`You're working on "${currentProject}" and digging into ${currentInvestigation}.`);
    } else if (currentProject) {
      parts.push(`You're in the middle of "${currentProject}".`);
    } else if (currentInvestigation) {
      parts.push(`You've been exploring ${currentInvestigation}.`);
    }

    if (userName) {
      parts.push(`What would move this forward right now, ${userName}?`);
    } else {
      parts.push("What would move this forward right now?");
    }

    return parts.join(" ");
  }

  // ─── No active context — natural welcome ────────────────────────────
  const defaultGreetings = [
    "Everything's quiet. What are we working on today?",
    "Ready when you are. What needs attention?",
    "All clear. What's next?",
  ];
  const greeting = defaultGreetings[Math.floor(Math.random() * defaultGreetings.length)];

  if (userName) {
    return `${userName} — ${greeting}`;
  }

  return greeting;
};
