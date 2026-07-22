/**
 * SpyralSession — Global Session Store (ONE INTELLIGENCE)
 *
 * Every page reads from this. Every page writes to this.
 * Nothing exists in isolation.
 *
 * Every interaction also records to MemoryEngine:
 * Identity → Episodic → Semantic → Knowledge Graph
 * Every interaction must leave SPYRAL more intelligent.
 *
 * This is the shared brain that makes SPYRAL feel like ONE intelligence
 * instead of multiple AI pages.
 */

"use client";

import { MemoryEngine } from "@/core/memory";

// ─── Types ─────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  company: string;
  industry: string;
  mainGoals: string;
  currentProjects: string;
  thinkingPreference: string;
  writingPreference: string;
  timezone: string;
  teamOrSolo: string;
  experienceLevel: string;
  onboarded: boolean;
  joinedAt: number;
}

export interface Investigation {
  id: string;
  question: string;
  purpose: string;
  currentUnderstanding: string;
  competingHypotheses: string[];
  evidence: string[];
  unknownVariables: string[];
  contradictions: string[];
  experiments: { name: string; hypothesis: string; status: string }[];
  insights: string[];
  nextInvestigation: string;
  confidence: number;
  status: "active" | "paused" | "completed";
  createdAt: number;
  updatedAt: number;
  sessions: { timestamp: number; question: string; response: string }[];
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  status: "active" | "paused" | "completed";
  startedAt: number;
  completedAt?: number;
  objectives: string[];
  progress: number;
}

export interface KnowledgeEntry {
  id: string;
  source: string;
  content: string;
  tags: string[];
  sharedWith: string[];
  createdAt: number;
}

export interface SpyralSessionData {
  // User
  currentUser: UserProfile | null;
  
  // Active work
  currentProject: string;
  currentInvestigation: Investigation | null;
  currentReality: string;
  currentStrategy: string;
  
  // Conversation
  currentConversation: { role: string; content: string; timestamp: number }[];
  currentMemory: string[];
  currentObjectives: string[];
  recentLearning: string[];
  
  // Missions
  missions: Mission[];
  
  // Cross-agent knowledge
  knowledge: KnowledgeEntry[];
  
  // Session
  lastActiveAt: number;
  sessionCount: number;
  returnCount: number;
  
  // Active investigations (all, not just current)
  investigations: Investigation[];
}

// ─── Storage ───────────────────────────────────────────────────────────

const STORAGE_KEY = "spyral_session";

function getDefaultSession(): SpyralSessionData {
  return {
    currentUser: null,
    currentProject: "",
    currentInvestigation: null,
    currentReality: "",
    currentStrategy: "",
    currentConversation: [],
    currentMemory: [],
    currentObjectives: [],
    recentLearning: [],
    missions: [],
    knowledge: [],
    lastActiveAt: Date.now(),
    sessionCount: 0,
    returnCount: 0,
    investigations: [],
  };
}

function loadSession(): SpyralSessionData {
  if (typeof window === "undefined") return getDefaultSession();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as SpyralSessionData;
      data.returnCount = (data.returnCount || 0) + 1;
      data.lastActiveAt = Date.now();
      saveSession(data);
      return data;
    }
  } catch {}
  const fresh = getDefaultSession();
  fresh.sessionCount = 1;
  saveSession(fresh);
  return fresh;
}

function saveSession(data: SpyralSessionData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

type Listener = (data: SpyralSessionData) => void;

// ─── Store ─────────────────────────────────────────────────────────────

let sessionData: SpyralSessionData = getDefaultSession();
const listeners = new Set<Listener>();

function notify() {
  for (const fn of listeners) {
    try { fn(sessionData); } catch {}
  }
}

export const SpyralSession = {
  /**
   * Get the current session data.
   */
  get(): SpyralSessionData {
    return { ...sessionData };
  },

  /**
   * Initialize the session (load from storage).
   * Also initializes the Memory Engine.
   */
  init(): SpyralSessionData {
    sessionData = loadSession();

    // Initialize MemoryEngine alongside session
    try {
      MemoryEngine.init();

      // Record session return as an episode
      if (sessionData.returnCount > 1) {
        const greeting = this.getGreeting();
        const activitySummary = this.getLastActivitySummary();
        MemoryEngine.recordEpisode(
          "conversation",
          `${greeting} Return visit #${sessionData.returnCount}. ${activitySummary}`,
          `Session initialized with ${sessionData.investigations.length} investigations, ${sessionData.missions.length} missions`,
          ["session", "return"],
          0.3,
        );

        // Check if memory consolidation is needed
        if (MemoryEngine.shouldConsolidate()) {
          MemoryEngine.consolidate();
        }
      }
    } catch {
      // MemoryEngine is non-blocking — session works without it
    }

    return this.get();
  },

  /**
   * Update partial session data.
   */
  update(partial: Partial<SpyralSessionData>): void {
    sessionData = { ...sessionData, ...partial, lastActiveAt: Date.now() };
    saveSession(sessionData);
    notify();
  },

  /**
   * Set the current user.
   * Also records identity in MemoryEngine.
   */
  setUser(profile: UserProfile): void {
    sessionData = {
      ...sessionData,
      currentUser: profile,
      lastActiveAt: Date.now(),
    };
    saveSession(sessionData);
    notify();

    // Record identity in MemoryEngine
    try {
      MemoryEngine.setIdentity({
        name: profile.name,
        role: profile.role,
        industry: profile.industry,
        company: profile.company,
        goals: profile.mainGoals.split(",").map((g) => g.trim()),
        preferredThinkingStyle: profile.thinkingPreference,
        preferredWritingStyle: profile.writingPreference,
        timezone: profile.timezone,
        languages: ["English"],
        experience: profile.experienceLevel,
        teams: profile.teamOrSolo.split(",").map((t) => t.trim()),
        products: [],
        businesses: [],
      });

      MemoryEngine.recordEpisode(
        "conversation",
        `User ${profile.name} logged in.`,
        `${profile.role} at ${profile.company}. ${profile.industry}`,
        ["login", "user"],
        0.5,
      );
    } catch {
      // Non-blocking
    }
  },

  /**
   * Get the current user.
   */
  getUser(): UserProfile | null {
    return sessionData.currentUser;
  },

  /**
   * Check if user is onboarded.
   */
  isOnboarded(): boolean {
    return sessionData.currentUser?.onboarded ?? false;
  },

  /**
   * Start a new investigation.
   * Also records to MemoryEngine timeline and knowledge graph.
   */
  startInvestigation(question: string, purpose: string): Investigation {
    const investigation: Investigation = {
      id: `inv_${Date.now()}`,
      question,
      purpose,
      currentUnderstanding: "",
      competingHypotheses: [],
      evidence: [],
      unknownVariables: [],
      contradictions: [],
      experiments: [],
      insights: [],
      nextInvestigation: "",
      confidence: 0,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sessions: [],
    };

    sessionData.investigations = [investigation, ...sessionData.investigations];
    sessionData.currentInvestigation = investigation;
    sessionData.lastActiveAt = Date.now();
    saveSession(sessionData);
    notify();

    // Record in MemoryEngine
    try {
      MemoryEngine.recordEpisode(
        "research",
        `Started investigation: ${question}`,
        purpose,
        ["investigation", "research"],
        0.7,
      );
      MemoryEngine.recordTimeline("research", `New investigation: ${question}`, purpose);
      MemoryEngine.addNode(
        "research",
        question.length > 60 ? question.slice(0, 60) + "..." : question,
        purpose,
        { type: "investigation", status: "active" },
      );
    } catch {
      // Non-blocking
    }

    return investigation;
  },

  /**
   * Update an investigation.
   * Also updates MemoryEngine when completed.
   */
  updateInvestigation(investigation: Investigation): void {
    const wasActive = sessionData.currentInvestigation?.status === "active";
    sessionData.investigations = sessionData.investigations.map((i) =>
      i.id === investigation.id ? investigation : i,
    );
    if (sessionData.currentInvestigation?.id === investigation.id) {
      sessionData.currentInvestigation = investigation;
    }
    sessionData.lastActiveAt = Date.now();
    saveSession(sessionData);
    notify();

    // Record completion in MemoryEngine
    try {
      if (wasActive && investigation.status === "completed") {
        MemoryEngine.recordEpisode(
          "research",
          `Completed investigation: ${investigation.question}`,
          `Insights: ${investigation.insights.join("; ")}`,
          ["investigation", "completed", "research"],
          0.8,
        );
        MemoryEngine.recordTimeline("research", `Completed investigation`, investigation.question);
      }
    } catch {
      // Non-blocking
    }
  },

  /**
   * Get all investigations.
   */
  getInvestigations(): Investigation[] {
    return [...sessionData.investigations];
  },

  /**
   * Share knowledge across all agents.
   * Also stores as a semantic fact in MemoryEngine.
   */
  shareKnowledge(source: string, content: string, tags: string[] = []): void {
    const entry: KnowledgeEntry = {
      id: `k_${Date.now()}`,
      source,
      content,
      tags,
      sharedWith: ["research", "content", "consultant", "navigation", "command"],
      createdAt: Date.now(),
    };
    sessionData.knowledge = [entry, ...sessionData.knowledge];
    sessionData.recentLearning = [content, ...sessionData.recentLearning].slice(0, 20);
    sessionData.lastActiveAt = Date.now();
    saveSession(sessionData);
    notify();

    // Also store as semantic fact in MemoryEngine
    try {
      MemoryEngine.learnFact(content, "shared", source);
    } catch {
      // Non-blocking
    }
  },

  /**
   * Get shared knowledge.
   */
  getKnowledge(): KnowledgeEntry[] {
    return [...sessionData.knowledge];
  },

  /**
   * Create a mission.
   */
  createMission(title: string, description: string, objectives: string[]): Mission {
    const mission: Mission = {
      id: `ms_${Date.now()}`,
      title,
      description,
      status: "active",
      startedAt: Date.now(),
      objectives,
      progress: 0,
    };
    sessionData.missions = [mission, ...sessionData.missions];
    sessionData.lastActiveAt = Date.now();
    saveSession(sessionData);
    notify();
    return mission;
  },

  /**
   * Get all missions.
   */
  getMissions(): Mission[] {
    return [...sessionData.missions];
  },

  /**
   * Get the active mission.
   */
  getActiveMission(): Mission | undefined {
    return sessionData.missions.find((m) => m.status === "active");
  },

  /**
   * Get greeting based on time of day and user name.
   */
  getGreeting(): string {
    const user = sessionData.currentUser;
    const hour = new Date().getHours();
    let timeOfDay = "";
    if (hour < 12) timeOfDay = "Good morning";
    else if (hour < 17) timeOfDay = "Good afternoon";
    else timeOfDay = "Good evening";

    if (user?.name) {
      const firstName = user.name.split(" ")[0];
      return `${timeOfDay} ${firstName}.`;
    }
    return `${timeOfDay}.`;
  },

  /**
   * Get the last active work summary.
   */
  getLastActivitySummary(): string {
    const inv = sessionData.currentInvestigation;
    const project = sessionData.currentProject;
    const missions = sessionData.missions;

    if (inv) {
      return `Last time we were investigating "${inv.question}".`;
    }
    if (project) {
      return `Last time we were working on "${project}".`;
    }
    if (missions.length > 0) {
      return `Last time we were working on "${missions[0].title}".`;
    }
    return "";
  },

  /**
   * Reset session (for testing/development).
   */
  reset(): void {
    sessionData = getDefaultSession();
    saveSession(sessionData);
    notify();
  },

  /**
   * Subscribe to session changes.
   */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
