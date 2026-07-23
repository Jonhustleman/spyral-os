/**
 * CommandCenterComposer — Mission Control.
 *
 * This is NOT a chat composer. Command center is the user's dashboard:
 * current project, investigation, mission, recent progress,
 * recommended next action. One glance, not paragraphs.
 *
 * RC4 spec: "Mission control."
 * Current project → Investigation → Mission → Recent progress →
 * Recommended next action. One glance, not paragraphs.
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";

/**
 * Command Center Composer.
 * Not chat — provides a concise status overview for the dashboard.
 * If the user says something open-ended, responds briefly and
 * directs them to the appropriate agent.
 */
export const CommandCenterComposer: ResponseComposer = (
  _input: ComposerInput,
  context?: ComposerContext,
): string => {
  const { currentInvestigation, currentProject, recentMemories, userName } = context || {};

  const greeting = userName ? `${userName}—` : "";

  // If there's active context, summarize at a glance
  if (currentInvestigation || currentProject) {
    const parts: string[] = [];

    if (currentProject) {
      parts.push(`**Project:** ${currentProject}`);
    }
    if (currentInvestigation) {
      parts.push(`**Exploring:** ${currentInvestigation}`);
    }
    if (recentMemories && recentMemories.length > 0) {
      const latest = recentMemories.slice(0, 2).join(" · ");
      parts.push(`**Recent:** ${latest}`);
    }

    parts.push(`**Next:** What would move this forward right now?`);

    return `${greeting}${parts.join("\n")}`;
  }

  // No active context — welcome to command center
  return `${greeting}Everything's quiet. What are we working on today?`;
};
