/**
 * MemoryRetriever — Pulls relevant memory into the WorkingMind before reasoning.
 *
 * RC6: Memory is persistent state across conversations.
 * The MemoryRetriever queries existing memory stores and filters
 * for relevance to the current input.
 *
 * This is NOT a reasoning engine. It's a query+filter function.
 * The LLM decides how to use the retrieved memories.
 */

import type { WorkingMind } from "./WorkingMind";

// ─── Memory source interfaces ───────────────────────────────────────────
// These match the existing memory infrastructure.

interface MemoryEntry {
  type: 'learning' | 'pattern' | 'preference' | 'identity' | 'discovery';
  content: string;
  tags?: string[];
}

/**
 * Retrieve relevant memories from available stores.
 * Currently queries SharedContextStore and LearningStore.
 * Returns empty arrays if stores are unavailable (graceful degradation).
 */
export async function retrieveMemories(
  rawInput: string,
  agentType: string,
  _sharedContextStore?: any,
  _learningStore?: any,
): Promise<WorkingMind['activeMemory']> {
  const memory: WorkingMind['activeMemory'] = {
    identity: [],
    patterns: [],
    preferences: [],
    previousDiscoveries: [],
  };

  const inputWords = new Set(
    rawInput.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
  );

  // Helper: score relevance by keyword overlap
  const relevanceScore = (content: string): number => {
    const words = content.toLowerCase().split(/\s+/);
    const matches = words.filter(w => inputWords.has(w)).length;
    return matches / Math.max(words.length, 1);
  };

  try {
    // Try SharedContextStore
    const scs = await _sharedContextStore?.getAll?.();
    if (scs) {
      const entries = Object.entries(scs) as [string, string][];
      for (const [key, value] of entries) {
        const score = relevanceScore(`${key} ${value}`);
        if (score > 0.1) {
          if (key.toLowerCase().includes('identity')) {
            memory.identity.push(`${key}: ${value}`);
          } else if (key.toLowerCase().includes('discover')) {
            memory.previousDiscoveries.push(`${key}: ${value}`);
          } else {
            memory.patterns.push(`${key}: ${value}`);
          }
        }
      }
    }
  } catch {
    // Store unavailable — degrade gracefully
  }

  try {
    // Try LearningStore
    const ls = await _learningStore?.getAll?.();
    if (ls) {
      const entries = (Array.isArray(ls) ? ls : Object.values(ls)) as MemoryEntry[];
      for (const entry of entries) {
        const score = relevanceScore(entry.content);
        if (score > 0.1) {
          switch (entry.type) {
            case 'preference':
              memory.preferences.push(entry.content);
              break;
            case 'identity':
              memory.identity.push(entry.content);
              break;
            case 'discovery':
              memory.previousDiscoveries.push(entry.content);
              break;
            default:
              memory.patterns.push(entry.content);
          }
        }
      }
    }
  } catch {
    // Store unavailable — degrade gracefully
  }

  return memory;
}
