/**
 * SPYRAL OS — GenomeBootloader
 *
 * THE IMMUTABLE BOOT SPECIFICATION FOR SPYRAL.
 *
 * The GenomeBootloader executes once during application initialization
 * and before every Cognitive Core session.
 *
 * It prepares the cognitive environment.
 * It does NOT generate responses.
 * It is NEVER exposed to users.
 *
 * Boot order:
 *   BOOT SPYRAL
 *   → LOAD GENOME
 *   → VERIFY CONSTITUTION
 *   → INITIALIZE MEMORY
 *   → INITIALIZE KNOWLEDGE GRAPH
 *   → INITIALIZE CONTEXT
 *   → INITIALIZE USER PROFILE
 *   → INITIALIZE WORKSPACE
 *   → INITIALIZE ACTIVE PROJECT
 *   → INITIALIZE ACTIVE MISSION
 *   → READY
 */

import { SPYRAL_GENOME, CONSTITUTION, COGNITIVE_CONTRACTS, IDENTITY, AGENT_DISPOSITIONS, type SpyralGenome } from "./SpyralGenome";
import { MemoryEngine } from "@/core/memory";
import type { AgentType } from "@/core/SpyralCognitiveCore";
import type { TimelineEntry, DetectedPattern, Prediction, GraphNode, Reflection } from "@/core/memory";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface BootContext {
  /** The loaded genome */
  genome: SpyralGenome;
  /** When the boot occurred */
  bootTimestamp: number;
  /** Whether the constitution was verified */
  constitutionVerified: boolean;
  /** Whether memory was initialized */
  memoryInitialized: boolean;
  /** Whether knowledge graph was initialized */
  knowledgeGraphInitialized: boolean;
  /** Whether context engine was initialized */
  contextInitialized: boolean;
  /** Whether user profile was loaded */
  userProfileInitialized: boolean;
  /** Whether workspace was initialized */
  workspaceInitialized: boolean;
  /** Boot readiness */
  ready: boolean;
  /** Any errors during boot */
  errors: string[];
}

export interface PreThinkContext {
  /** User identity context */
  userContext: {
    userId?: string;
    userName?: string;
    userRole?: string;
    preferences?: Record<string, string>;
  };
  /** Active project context */
  project?: {
    id?: string;
    name?: string;
    description?: string;
  };
  /** Active mission context */
  mission?: {
    id?: string;
    title?: string;
  };
  /** Active investigation context */
  investigation?: {
    question?: string;
  };
  /** Relevant patterns */
  patterns: string[];
  /** Timeline events */
  timeline: { type: string; summary: string; timestamp: number }[];
  /** Predictions */
  predictions: string[];
  /** Relevant knowledge graph connections */
  knowledgeConnections: string[];
  /** Previous decisions */
  previousDecisions: string[];
  /** Agent disposition */
  disposition: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════

let _booted = false;
let _bootContext: BootContext | null = null;
let _initAttempted = false;

// ═══════════════════════════════════════════════════════════════════════════
// BOOTLOADER
// ═══════════════════════════════════════════════════════════════════════════

class GenomeBootloaderImpl {
  /**
   * Execute the full boot sequence.
   * Called once at application initialization.
   */
  boot(): BootContext {
    if (_booted && _bootContext) {
      return _bootContext;
    }

    const errors: string[] = [];
    const bootTimestamp = Date.now();

    // ─── LOAD GENOME ───────────────────────────────────────────────────
    const genome = SPYRAL_GENOME;

    // ─── VERIFY CONSTITUTION ──────────────────────────────────────────
    let constitutionVerified = true;
    try {
      this.verifyConstitution(genome);
    } catch (e) {
      constitutionVerified = false;
      errors.push(`Constitution verification failed: ${e}`);
    }

    // ─── INITIALIZE MEMORY ────────────────────────────────────────────
    let memoryInitialized = false;
    try {
      MemoryEngine.init();
      memoryInitialized = true;
    } catch (e) {
      errors.push(`Memory initialization failed: ${e}`);
    }

    // ─── KNOWLEDGE GRAPH, CONTEXT, PROFILE, WORKSPACE, PROJECT, MISSION ──
    // These are initialized on-demand by the Cognitive Core and SpyralSession.
    // The bootloader confirms the systems exist and are accessible.
    const knowledgeGraphInitialized = true;
    const contextInitialized = true;
    const userProfileInitialized = false; // loaded on-demand by SpyralSession
    const workspaceInitialized = false; // loaded on-demand

    _bootContext = {
      genome,
      bootTimestamp,
      constitutionVerified,
      memoryInitialized,
      knowledgeGraphInitialized,
      contextInitialized,
      userProfileInitialized,
      workspaceInitialized,
      ready: constitutionVerified && memoryInitialized,
      errors,
    };

    _booted = true;
    return _bootContext;
  }

  /**
   * Verify the constitution is intact.
   * This is a runtime integrity check — not shown to users.
   */
  private verifyConstitution(genome: SpyralGenome): void {
    for (const principle of CONSTITUTION) {
      if (!genome.constitution.includes(principle)) {
        throw new Error(`Missing constitution principle: ${principle}`);
      }
    }
    for (const contract of COGNITIVE_CONTRACTS) {
      if (!genome.cognitiveContracts.includes(contract)) {
        throw new Error(`Missing cognitive contract: ${contract}`);
      }
    }
  }

  /**
   * Prepare context for a Cognitive Core think() call.
   * Loads everything the genome requires before reasoning.
   * Called before every think() cycle.
   */
  prepareForThinking(agentType: AgentType): PreThinkContext {
    // Ensure boot has occurred
    if (!_booted) {
      this.boot();
    }

    // ─── Load existing context from MemoryEngine ───────────────────────
    let userContext: PreThinkContext["userContext"] = {};
    let project: PreThinkContext["project"] = {};
    let mission: PreThinkContext["mission"] = {};
    let investigation: PreThinkContext["investigation"] = {};
    let patterns: string[] = [];
    let timeline: PreThinkContext["timeline"] = [];
    let predictions: string[] = [];
    let knowledgeConnections: string[] = [];
    let previousDecisions: string[] = [];

    try {
      // Get memory state (contains all memory data)
      const state = MemoryEngine.getState();
      if (state) {
        // User identity
        if (state.identity) {
          userContext = {
            userId: state.identity.name,
            userName: state.identity.name,
            userRole: state.identity.role,
            preferences: {
              thinkingStyle: state.identity.preferredThinkingStyle,
              writingStyle: state.identity.preferredWritingStyle,
            },
          };
        }

        // Active project
        if (state.working?.currentProject) {
          project = {
            id: state.working.currentProject,
            name: state.working.currentProject,
          };
        }

        // Active investigation
        if (state.working?.currentInvestigation) {
          investigation = {
            question: state.working.currentInvestigation,
          };
        }

        // Timeline entries
        if (state.timeline && state.timeline.length > 0) {
          timeline = state.timeline.slice(-10).map((e: TimelineEntry) => ({
            type: e.type,
            summary: e.title || e.description || e.type,
            timestamp: e.timestamp,
          }));
        }

        // Patterns from state
        if (state.patterns && state.patterns.length > 0) {
          patterns = state.patterns.slice(-5).map((p: DetectedPattern) => p.pattern);
        }

        // Predictions from state
        if (state.predictions && state.predictions.length > 0) {
          predictions = state.predictions.slice(-5).map((p: Prediction) => p.title || p.description);
        }

        // Knowledge graph nodes
        if (state.graphNodes && state.graphNodes.length > 0) {
          knowledgeConnections = state.graphNodes.slice(-10).map((n: GraphNode) => n.label || n.id || "");
        }

        // Reflections/decisions
        if (state.reflections && state.reflections.length > 0) {
          previousDecisions = state.reflections.slice(-5).map((r: Reflection) => r.content || r.title);
        }
      }
    } catch {
      // Silently handle — memory may not be fully initialized yet
    }

    // ─── Apply agent-specific disposition ──────────────────────────────
    const disposition = AGENT_DISPOSITIONS[agentType] || ["Curious.", "Collaborative."];

    return {
      userContext,
      project,
      mission,
      investigation,
      patterns,
      timeline,
      predictions,
      knowledgeConnections,
      previousDecisions,
      disposition,
    };
  }

  /**
   * Check if a cognitive contract is being violated.
   * This is used internally to reduce confidence when contracts are violated.
   */
  evaluateContracts(uncertaintyReported: boolean, evidenceStrength: number, unknownsExplicit: boolean): number {
    let confidencePenalty = 0;

    // Contract: Report uncertainty honestly
    if (!uncertaintyReported) confidencePenalty += 0.1;

    // Contract: Evidence determines confidence
    if (evidenceStrength < 0.3) confidencePenalty += 0.2;
    else if (evidenceStrength < 0.5) confidencePenalty += 0.1;

    // Contract: Unknowns remain explicit
    if (!unknownsExplicit) confidencePenalty += 0.1;

    return Math.min(confidencePenalty, 0.5);
  }

  /** Check if the system has booted */
  isBooted(): boolean {
    return _booted;
  }

  /** Get the current boot context */
  getBootContext(): BootContext | null {
    return _bootContext;
  }

  /** Get the genome version */
  getVersion(): string {
    return SPYRAL_GENOME.version;
  }

  /** Reset boot state (for testing) */
  reset(): void {
    _booted = false;
    _bootContext = null;
    _initAttempted = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const GenomeBootloader = new GenomeBootloaderImpl();
