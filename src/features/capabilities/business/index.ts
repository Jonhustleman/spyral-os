/**
 * SPYRAL OS — Business Capabilities
 *
 * These are the first production capabilities for the Business workspace type.
 * They are registered at import time and managed by the CapabilityRegistry.
 */

import { CapabilityRegistry } from "@/features/capabilities/registry/CapabilityRegistry";
import type { Capability } from "@/kernel/contracts/Capability";

// ─── Core Capabilities ─────────────────────────────────────────────────────

/**
 * Command Studio — AI-powered command interface.
 */
const CommandCapability: Capability = {
  id: "command",
  name: "Command Studio",
  version: "1.0.0",
  icon: "Command",
  routes: ["/command"],
  permissions: ["ai", "decisions"],
  manifest: {
    title: "Command Studio",
    description: "AI-powered command interface and decision engine.",
    author: "SPYRAL",
    version: "1.0.0",
    category: "core",
  },
};

/**
 * Reality Studio — Assess current reality, define desired goals, and track gaps.
 */
const RealityCapability: Capability = {
  id: "reality",
  name: "Reality Studio",
  version: "1.0.0",
  icon: "Compass",
  routes: ["/"],
  permissions: ["feed", "notifications"],
  manifest: {
    title: "Reality Studio",
    description: "Assess current reality, define desired goals, and track gaps.",
    author: "SPYRAL",
    version: "1.0.0",
    category: "core",
  },
};

/**
 * Decision — Decision Studio for mapping choices and trade-offs.
 */
const DecisionCapability: Capability = {
  id: "decision",
  name: "Decision Studio",
  version: "1.0.0",
  icon: "GitBranch",
  routes: ["/decisions"],
  permissions: ["decisions", "analysis"],
  manifest: {
    title: "Decision Studio",
    description: "Map choices, compare options, and build a decision graph.",
    author: "SPYRAL",
    version: "1.0.0",
    category: "core",
  },
};

/**
 * Navigation Studio — The front door of SPYRAL OS.
 * Conversational entry point for navigating reality.
 */
const NavigationCapability: Capability = {
  id: "navigation",
  name: "Navigation Studio",
  version: "2.0.0",
  icon: "Navigation",
  routes: ["/navigate"],
  permissions: ["workspaces", "navigation"],
  manifest: {
    title: "Navigation Studio",
    description: "The front door of SPYRAL. Tell us where you want to go.",
    author: "SPYRAL",
    version: "2.0.0",
    category: "core",
  },
};

/**
 * Execution — Execution Studio for planning and tracking work.
 */
const ExecutionCapability: Capability = {
  id: "execution",
  name: "Execution Studio",
  version: "1.0.0",
  icon: "Play",
  routes: ["/execution"],
  permissions: ["execution", "tasks"],
  manifest: {
    title: "Execution Studio",
    description: "Plan milestones, manage tasks, and track execution health.",
    author: "SPYRAL",
    version: "1.0.0",
    category: "core",
  },
};

/**
 * Validation Studio — Compare expected vs observed results.
 */
const ValidationCapability: Capability = {
  id: "validation",
  name: "Validation Studio",
  version: "1.0.0",
  icon: "BarChart3",
  routes: ["/validation"],
  permissions: ["validation", "analytics"],
  manifest: {
    title: "Validation Studio",
    description: "Compare expected vs observed results and track outcomes.",
    author: "SPYRAL",
    version: "1.0.0",
    category: "core",
  },
};

/**
 * Intelligence Studio — Knowledge base, research tools, and insights.
 */
const IntelligenceCapability: Capability = {
  id: "intelligence",
  name: "Intelligence Studio",
  version: "1.0.0",
  icon: "BookOpen",
  routes: ["/intelligence"],
  permissions: ["knowledge", "research"],
  manifest: {
    title: "Intelligence Studio",
    description: "Knowledge base, research tools, and insights.",
    author: "SPYRAL",
    version: "1.0.0",
    category: "core",
  },
};

/**
 * Learning — Learning Studio for discovering patterns and generating insights.
 */
const LearningCapability: Capability = {
  id: "learning",
  name: "Learning Studio",
  version: "1.0.0",
  icon: "Brain",
  routes: ["/learning"],
  permissions: ["learning", "analytics"],
  manifest: {
    title: "Learning Studio",
    description: "Discover patterns, generate insights, and track recommendations.",
    author: "SPYRAL",
    version: "1.0.0",
    category: "core",
  },
};

/**
 * Settings — Workspace and system configuration.
 */
const SettingsCapability: Capability = {
  id: "settings",
  name: "Settings",
  version: "1.0.0",
  icon: "Settings",
  routes: ["/settings"],
  permissions: ["config"],
  manifest: {
    title: "Settings",
    description: "Workspace and system configuration.",
    author: "SPYRAL",
    version: "1.0.0",
    category: "core",
  },
};

// ─── Register all capabilities ─────────────────────────────────────────────

const BUSINESS_CAPABILITIES = [
  CommandCapability,
  RealityCapability,
  DecisionCapability,
  ExecutionCapability,
  ValidationCapability,
  NavigationCapability,
  IntelligenceCapability,
  LearningCapability,
  SettingsCapability,
];

/**
 * Initialize all Business workspace capabilities.
 * Called once at application startup.
 */
export function initBusinessCapabilities(): void {
  for (const cap of BUSINESS_CAPABILITIES) {
    if (!CapabilityRegistry.get(cap.id)) {
      CapabilityRegistry.register(cap);
    }
  }
}

export {
  CommandCapability,
  RealityCapability,
  ExecutionCapability,
  ValidationCapability,
  NavigationCapability,
  IntelligenceCapability,
  LearningCapability,
  SettingsCapability,
};
