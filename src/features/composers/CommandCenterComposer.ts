/**
 * CommandCenterComposer — Mission Control (RC5)
 *
 * IDENTITY: Mission Control. Orchestration engine, not a chatbot.
 * Its job is routing work to the correct cognitive engine and
 * surfacing contextual awareness naturally.
 *
 * Never behaves like a chatbot.
 * Never asks questions.
 * Never generates reports.
 * Never exposes internal state labels.
 *
 * One glance, not paragraphs.
 * Routes to the right agent or gives a concise status.
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";

// ─── Routing — Natural, not interrogative ──────────────────────────────────

/**
 * Route the user to the right agent based on intent.
 * Returns a routing message — concise, directional, never questioning.
 */
function route(input: string, context?: ComposerContext): string | null {
  const text = input.toLowerCase();

  if (text.includes("research") || text.includes("investigate") || text.includes("explore") || text.includes("learn")) {
    return "That needs investigation. The Research engine is built for exploration — it thinks in first principles and cross-domain connections.";
  }
  if (text.includes("content") || text.includes("create") || text.includes("campaign") || text.includes("write") || text.includes("story")) {
    return "This is a creative challenge. The Content engine feels emotion, imagines audiences, and builds narratives that resonate.";
  }
  if (text.includes("navigate") || text.includes("goal") || text.includes("plan") || text.includes("launch") || text.includes("future")) {
    return "That's about direction. The Navigation engine thinks in journeys — where you are, where you want to be, and what's between them.";
  }
  if (text.includes("consult") || text.includes("advise") || text.includes("strategy") || text.includes("decision") || text.includes("should")) {
    return "This needs strategic thinking. The Consultant engine challenges assumptions, reveals trade-offs, and finds hidden consequences.";
  }

  return null;
}

/**
 * Surface active context conversationally.
 * Never asks a question — just states what's relevant.
 */
function surfaceContext(context?: ComposerContext): string | null {
  const { currentInvestigation, currentProject } = context || {};

  if (currentProject && currentInvestigation) {
    return `You're working on "${currentProject}" and exploring ${currentInvestigation}. Both are active.`;
  }
  if (currentProject) {
    return `You're in the middle of "${currentProject}".`;
  }
  if (currentInvestigation) {
    return `You've been exploring ${currentInvestigation}.`;
  }

  return null;
}

// ─── Main Composer ──────────────────────────────────────────────────────────

/**
 * Command Center Composer (RC5).
 * Mission Control — orchestrates, routes, surfaces context.
 * Never behaves like a chatbot. Never asks questions.
 */
export const CommandCenterComposer: ResponseComposer = (
  input: ComposerInput,
  context?: ComposerContext,
): string => {
  const text = input.input.input?.toLowerCase() || "";
  const { userName } = context || {};

  // Step 1: Try to route to the right engine
  const routing = route(text, context);
  if (routing) {
    return userName ? `${userName} — ${routing}` : routing;
  }

  // Step 2: Surface active context
  const activeContext = surfaceContext(context);
  if (activeContext) {
    return activeContext;
  }

  // Step 3: No active context, concise status
  // Never questions. Just states readiness.
  if (userName) {
    return `Everything's quiet. I'm here when you need to research, create, navigate, or strategize.`;
  }

  return `All clear. Research, Content, Navigation, and Consultant engines are ready. What's the mission?`;
};
