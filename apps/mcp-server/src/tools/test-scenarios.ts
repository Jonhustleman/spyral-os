/**
 * Tool: spyral_get_test_scenario
 *
 * Phase E.2 — Canonical Test Scenarios
 *
 * Provides structured test scenarios for pilot testers.
 * These are designed to produce high-quality validation data.
 * Each scenario specifies the input goal, what to measure,
 * and what SPYRAL should demonstrate.
 *
 * Architecture:
 *   ChatGPT → spyral_get_test_scenario (MCP resource) → Structured test data
 */

import { z } from "zod";

// ─── Test Scenarios ─────────────────────────────────────────────────────────

const TEST_SCENARIOS = {
  business_growth: {
    id: "business_growth",
    category: "Business Growth",
    goal: "I want to increase my clinic patients by 50%.",
    description:
      "A business growth challenge. Tests SPYRAL's ability to analyze a concrete growth objective, identify leverage points, and produce an actionable strategy with measurable milestones.",
    measures: [
      "Strategy quality — Does SPYRAL identify specific growth levers?",
      "Prediction quality — Are the expected outcomes realistic?",
      "Execution usefulness — Can the user act on the plan?",
    ],
    expectedCapabilities: [
      "Domain detection (healthcare/clinic)",
      "Market analysis framing",
      "Milestone-based execution planning",
      "Risk identification",
    ],
  },
  content_creation: {
    id: "content_creation",
    category: "Content Creation",
    goal: "Create a 30-day content strategy.",
    description:
      "A content strategy challenge. Tests SPYRAL's ability to generate a structured content plan with audience understanding, content themes, and engagement predictions.",
    measures: [
      "Audience understanding — Does SPYRAL ask about the target audience?",
      "Content relevance — Are the content suggestions appropriate?",
      "Engagement prediction — Does SPYRAL predict outcomes?",
    ],
    expectedCapabilities: [
      "Content strategy generation",
      "Audience analysis",
      "Platform-specific recommendations",
      "Engagement metrics prediction",
    ],
  },
  decision_making: {
    id: "decision_making",
    category: "Decision Making",
    goal: "Should I hire another employee?",
    description:
      "A decision support challenge. Tests SPYRAL's ability to frame a binary decision, analyze trade-offs, identify risks, and provide a structured decision framework.",
    measures: [
      "Risk analysis — Does SPYRAL identify key risks?",
      "Trade-off evaluation — Are pros and cons properly weighted?",
      "Decision framework — Is a clear recommendation provided?",
    ],
    expectedCapabilities: [
      "Decision framing",
      "Risk/benefit analysis",
      "Trade-off evaluation",
      "Confidence scoring",
    ],
  },
  research: {
    id: "research",
    category: "Research",
    goal: "Research whether this market opportunity is viable.",
    description:
      "A research challenge. Tests SPYRAL's ability to structure a research question, identify assumptions, detect knowledge gaps, and propose an investigation framework.",
    measures: [
      "Assumption detection — Does SPYRAL identify what needs validation?",
      "Evidence handling — Does SPYRAL distinguish known from unknown?",
      "Research structure — Is there a clear investigation plan?",
    ],
    expectedCapabilities: [
      "Research question structuring",
      "Assumption identification",
      "Knowledge gap analysis",
      "Investigation planning",
    ],
  },
} as const;

export type TestScenarioId = keyof typeof TEST_SCENARIOS;

export const GetTestScenarioInputSchema = z.object({
  scenarioId: z
    .enum(["business_growth", "content_creation", "decision_making", "research"])
    .optional()
    .describe("The test scenario to load. If omitted, lists all available scenarios."),
});

export type GetTestScenarioInput = z.infer<typeof GetTestScenarioInputSchema>;

export const getTestScenarioToolDefinition = {
  name: "spyral_get_test_scenario",
  description: `Load a structured test scenario for the SPYRAL pilot.

Available scenarios:
1. Business Growth — "I want to increase my clinic patients by 50%."
2. Content Creation — "Create a 30-day content strategy."
3. Decision Making — "Should I hire another employee?"
4. Research — "Research whether this market opportunity is viable."

Each scenario includes the goal to submit, what to measure, and what SPYRAL should demonstrate.

Use this to run structured tests during the pilot phase.`,
  inputSchema: {
    type: "object" as const,
    properties: {
      scenarioId: {
        type: "string",
        enum: ["business_growth", "content_creation", "decision_making", "research"] as const,
        description: "The test scenario to load. If omitted, lists all available scenarios.",
      },
    },
  },
};

export async function handleGetTestScenario(input: GetTestScenarioInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  if (!input.scenarioId) {
    // Return list of all scenarios
    const summary = Object.values(TEST_SCENARIOS)
      .map(
        (s) =>
          `## ${s.category}\nGoal: "${s.goal}"\n${s.description}\n\nMeasures:\n${s.measures.map((m) => `- ${m}`).join("\n")}`,
      )
      .join("\n\n---\n\n");

    return {
      content: [
        {
          type: "text" as const,
          text: `# SPYRAL Pilot — Canonical Test Scenarios\n\n${summary}\n\nUse \`spyral_get_test_scenario\` with a specific scenarioId to load a scenario.`,
        },
      ],
    };
  }

  const scenario = TEST_SCENARIOS[input.scenarioId];
  if (!scenario) {
    throw new Error(`Unknown scenario: ${input.scenarioId}`);
  }

  return {
    content: [
      {
        type: "text" as const,
        text: [
          `# Test Scenario: ${scenario.category}`,
          ``,
          `## Goal to submit to SPYRAL`,
          `"${scenario.goal}"`,
          ``,
          `## What this tests`,
          scenario.description,
          ``,
          `## Measures`,
          ...scenario.measures.map((m) => `- ${m}`),
          ``,
          `## Expected SPYRAL capabilities`,
          ...scenario.expectedCapabilities.map((c) => `- ${c}`),
          ``,
          `## Instructions`,
          `1. Copy the goal above and submit it via \`spyral_begin_reality_cycle\``,
          `2. Evaluate the Reality Report against the measures`,
          `3. Submit feedback via \`spyral_submit_reality_feedback\``,
          `4. Create predictions via \`spyral_create_prediction\``,
        ].join("\n"),
      },
    ],
  };
}
