/**
 * SPYRAL OS — Workspace Registry
 *
 * Rule #004: The kernel never knows concrete workspace types.
 * This registry is the single source of truth for available workspace types.
 * Plugins register themselves here; the kernel remains oblivious.
 */

export interface WorkspaceTypeInfo {
  /** Unique identifier for this workspace type (e.g. "business", "medical"). */
  id: string;

  /** Human-readable label (e.g. "Business", "Medical Research"). */
  label: string;

  /** Short description shown in the wizard type selector. */
  description: string;

  /** Icon identifier for UI rendering. */
  icon: string;

  /** Default DNA template for this type. */
  defaultDNA: {
    industry: string;
    planningHorizon: "short" | "medium" | "long";
    riskAppetite: "conservative" | "moderate" | "aggressive";
    growthStyle: "steady" | "balanced" | "rapid";
    successMetric: string;
  };
}

/**
 * Registry of all available workspace types.
 * Workspace types are registered at startup and remain immutable thereafter.
 */
class WorkspaceRegistryImpl {
  private types = new Map<string, WorkspaceTypeInfo>();

  /**
   * Register a new workspace type.
   * Throws if a type with the same ID is already registered.
   */
  register(info: WorkspaceTypeInfo): void {
    if (this.types.has(info.id)) {
      throw new Error(`Workspace type "${info.id}" is already registered.`);
    }
    this.types.set(info.id, info);
  }

  /**
   * Get a workspace type by its ID.
   * Returns undefined if the type is not found.
   */
  get(id: string): WorkspaceTypeInfo | undefined {
    return this.types.get(id);
  }

  /**
   * Get all registered workspace types.
   */
  getAll(): WorkspaceTypeInfo[] {
    return Array.from(this.types.values());
  }

  /**
   * Check if a workspace type is registered.
   */
  has(id: string): boolean {
    return this.types.has(id);
  }
}

/** Singleton registry instance. */
export const WorkspaceRegistry = new WorkspaceRegistryImpl();

// ─── Built-in workspace types ──────────────────────────────────────────────
// These are the default types that ship with SPYRAL OS.
// Plugins can register additional types at import time.

WorkspaceRegistry.register({
  id: "business",
  label: "Business",
  description: "Strategic business planning, operations, and growth management.",
  icon: "Briefcase",
  defaultDNA: {
    industry: "Technology",
    planningHorizon: "medium",
    riskAppetite: "moderate",
    growthStyle: "balanced",
    successMetric: "Revenue growth",
  },
});

WorkspaceRegistry.register({
  id: "marketing",
  label: "Marketing",
  description: "Campaign strategy, brand positioning, and market analysis.",
  icon: "Megaphone",
  defaultDNA: {
    industry: "Marketing",
    planningHorizon: "short",
    riskAppetite: "moderate",
    growthStyle: "rapid",
    successMetric: "ROI",
  },
});

WorkspaceRegistry.register({
  id: "content",
  label: "Content",
  description: "Content planning, creation pipelines, and editorial calendars.",
  icon: "FileText",
  defaultDNA: {
    industry: "Media",
    planningHorizon: "medium",
    riskAppetite: "conservative",
    growthStyle: "steady",
    successMetric: "Engagement",
  },
});

WorkspaceRegistry.register({
  id: "finance",
  label: "Finance",
  description: "Financial modeling, budget tracking, and investment analysis.",
  icon: "TrendingUp",
  defaultDNA: {
    industry: "Finance",
    planningHorizon: "long",
    riskAppetite: "conservative",
    growthStyle: "steady",
    successMetric: "Portfolio return",
  },
});

WorkspaceRegistry.register({
  id: "research",
  label: "Research",
  description: "Academic research, data analysis, and knowledge discovery.",
  icon: "Flask",
  defaultDNA: {
    industry: "Research",
    planningHorizon: "long",
    riskAppetite: "moderate",
    growthStyle: "steady",
    successMetric: "Publications",
  },
});

WorkspaceRegistry.register({
  id: "career",
  label: "Career",
  description: "Career planning, skill development, and professional growth.",
  icon: "Target",
  defaultDNA: {
    industry: "Personal Development",
    planningHorizon: "long",
    riskAppetite: "conservative",
    growthStyle: "balanced",
    successMetric: "Milestones achieved",
  },
});
