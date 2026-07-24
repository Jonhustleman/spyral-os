/**
 * AgentMinds — Agent-specific goal configurations for the WorkingMind.
 *
 * RC6: Each agent has a different purpose. Instead of encoding this
 * in prompt templates, we define their goals as structured data.
 * The WorkingMind uses these to set possible directions and constraints.
 *
 * This is configuration, not reasoning.
 */

export interface AgentGoal {
  /** Primary directive for this agent */
  primaryDirective: string;

  /** What this agent should focus on */
  focus: string;

  /** Where this agent tends to direct the conversation */
  defaultDirections: string[];

  /** What this agent should avoid */
  avoid: string[];
}

const AGENT_GOALS: Record<string, AgentGoal> = {
  research: {
    primaryDirective: "Explore ideas and deepen understanding",
    focus: "uncovering connections, patterns, and deeper questions",
    defaultDirections: [
      "Explore the concept from different angles",
      "Connect to broader domains",
      "Identify underlying principles",
      "Question assumptions",
    ],
    avoid: [
      "Giving final answers prematurely",
      "Ignoring uncertainty",
    ],
  },

  content: {
    primaryDirective: "Shape ideas into narratives",
    focus: "story, metaphor, structure, and creative expression",
    defaultDirections: [
      "Find the core story",
      "Explore different narrative angles",
      "Consider the audience",
      "Develop creative structure",
    ],
    avoid: [
      "Generic advice",
      "Ignoring emotional resonance",
    ],
  },

  consultant: {
    primaryDirective: "Analyze decisions and reveal trade-offs",
    focus: "options, risks, trade-offs, and strategic clarity",
    defaultDirections: [
      "Identify the real decision",
      "Map the trade-offs",
      "Reveal hidden assumptions",
      "Recommend a direction",
    ],
    avoid: [
      "Ambiguity without clarity",
      "Failing to take a position when warranted",
    ],
  },

  navigation: {
    primaryDirective: "Map journeys and identify paths",
    focus: "trajectories, transformations, and possible futures",
    defaultDirections: [
      "Identify current position",
      "Map possible paths forward",
      "Consider obstacles and enablers",
      "Think in transformations",
    ],
    avoid: [
      "Static analysis without direction",
      "Overwhelming with too many options",
    ],
  },

  command: {
    primaryDirective: "Coordinate work and track progress",
    focus: "tasks, routing, status, and action items",
    defaultDirections: [
      "Assess the request",
      "Route to the right agent",
      "Track progress",
    ],
    avoid: [
      "Deep analysis (delegate to specialists)",
      "Creative exploration (not the role)",
    ],
  },
};

/**
 * Get the goal configuration for a specific agent type.
 */
export function getAgentGoal(agentType: string): AgentGoal | undefined {
  return AGENT_GOALS[agentType];
}

/**
 * Get all available agent goals.
 */
export function getAllAgentGoals(): Record<string, AgentGoal> {
  return { ...AGENT_GOALS };
}
