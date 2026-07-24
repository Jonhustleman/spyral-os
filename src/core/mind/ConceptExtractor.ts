/**
 * ConceptExtractor — Parses natural language into structured Entities.
 *
 * RC6: Never reason over text. Decompose language into objects.
 * "What if humans could fly?" becomes entities: Human, Ability, Flight,
 * Implications, Transportation, Architecture, Economics, etc.
 *
 * SPYRAL then reasons over these objects — not over words.
 *
 * This is a parser, not a reasoning engine.
 */

import type { Entity, EntityType } from "./WorkingMind";

let _conceptCounter = 0;

function nextConceptId(): string {
  return `concept_${++_conceptCounter}`;
}

// ─── Well-known entity categories for common words ───────────────────────

const CATEGORY_HINTS: Record<string, EntityType> = {
  // Entities
  human: "person",
  people: "person",
  person: "person",
  company: "person",
  business: "person",
  organization: "person",
  team: "person",
  user: "person",
  customer: "person",
  market: "domain",
  industry: "domain",

  // Actions
  fly: "action",
  flight: "action",
  create: "action",
  build: "action",
  change: "action",
  improve: "action",
  solve: "action",
  decide: "action",
  launch: "action",
  grow: "action",

  // Domains
  technology: "domain",
  science: "domain",
  health: "domain",
  finance: "domain",
  education: "domain",
  transportation: "domain",
  energy: "domain",
  architecture: "domain",
  economics: "domain",
  culture: "domain",
  psychology: "domain",
  military: "domain",
  politics: "domain",
  environment: "domain",

  // Properties
  fast: "property",
  slow: "property",
  big: "property",
  small: "property",
  expensive: "property",
  cheap: "property",
  efficient: "property",
  difficult: "property",
  easy: "property",
  possible: "property",
  impossible: "property",
};

// ─── Common domain expansion prefixes ──────────────────────────────────────

const DOMAIN_TRIGGERS: Record<string, string[]> = {
  fly: ["flight", "transportation", "infrastructure", "cities", "architecture", "energy", "evolution"],
  car: ["transportation", "infrastructure", "manufacturing", "energy", "environment", "cities"],
  ai: ["technology", "science", "labor", "economics", "ethics", "education", "psychology"],
  health: ["medicine", "biology", "technology", "insurance", "psychology", "society"],
  education: ["learning", "technology", "psychology", "society", "economics", "culture"],
  business: ["market", "customers", "product", "strategy", "finance", "operations", "competition"],
  climate: ["environment", "energy", "politics", "economics", "technology", "society", "agriculture"],
};

// ─── Extractor ─────────────────────────────────────────────────────────────

/**
 * Extract entities from natural language input.
 * Returns an array of Entity objects ready for the WorkingMind.
 */
export function extractConcepts(input: string): Entity[] {
  const entities: Entity[] = [];
  const seen = new Set<string>();
  const lower = input.toLowerCase();

  // 1. Extract explicit named entities (capitalized words, quoted phrases)
  const explicitMatches = input.match(/"([^"]+)"|'([^']+)'/g);
  if (explicitMatches) {
    for (const match of explicitMatches) {
      const name = match.replace(/["']/g, "").trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        entities.push({
          id: nextConceptId(),
          name,
          type: "concept",
          properties: { source: "explicit", confidence: 0.9 },
          source: "user",
        });
      }
    }
  }

  // 2. Extract key nouns and concepts (words longer than 3 chars)
  const words = lower.split(/[^a-z0-9]+/).filter(w => w.length > 3);

  for (const word of words) {
    if (seen.has(word)) continue;

    const type = CATEGORY_HINTS[word] || "concept";
    const confidence = CATEGORY_HINTS[word] ? 0.85 : 0.6;

    seen.add(word);
    entities.push({
      id: nextConceptId(),
      name: word.charAt(0).toUpperCase() + word.slice(1),
      type,
      properties: { confidence, category: type },
      source: "user",
    });
  }

  // 3. Expand into related domains (for deeper reasoning)
  for (const word of words) {
    const expansions = DOMAIN_TRIGGERS[word];
    if (expansions) {
      for (const expansion of expansions) {
        if (!seen.has(expansion)) {
          seen.add(expansion);
          entities.push({
            id: nextConceptId(),
            name: expansion.charAt(0).toUpperCase() + expansion.slice(1),
            type: "domain",
            properties: { triggered_by: word, confidence: 0.5 },
            source: "inference",
          });
        }
      }
    }
  }

  // 4. Extract implicit unknowns (question words, uncertainties)
  const uncertaintyWords = lower.match(/what if|how|why|maybe|perhaps|uncertain|unknown|what about|what would/g);
  if (uncertaintyWords) {
    entities.push({
      id: nextConceptId(),
      name: "Unknown Implications",
      type: "unknown",
      properties: { triggered_by: uncertaintyWords[0], confidence: 0.7 },
      source: "inference",
    });
  }

  return entities;
}

/**
 * Extract the primary goal from user input.
 */
export function extractGoal(input: string, agentType?: string): string {
  const lower = input.toLowerCase();

  // Look for explicit goal patterns
  const goalPatterns = [
    /i want to (.+?)(?:\.|$)/i,
    /i need to (.+?)(?:\.|$)/i,
    /i'm trying to (.+?)(?:\.|$)/i,
    /my goal is to (.+?)(?:\.|$)/i,
    /help me (.+?)(?:\.|$)/i,
    /what if (.+?)(?:\?|$)/i,
    /how (?:do|can|would|should) i (.+?)(?:\?|$)/i,
    /should i (.+?)(?:\?|$)/i,
  ];

  for (const pattern of goalPatterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // Fallback: use the whole input as the goal context
  return input.length > 120 ? input.substring(0, 120) + "..." : input;
}

/**
 * Extract current situation/context from user input.
 */
export function extractSituation(input: string): string {
  const lower = input.toLowerCase();

  // Look for situation descriptions
  const situationPatterns = [
    /i (?:am|have|work|live|run|manage) (.+?)(?:\.|but|and|$)/i,
    /currently (.+?)(?:\.|$)/i,
    /right now (.+?)(?:\.|$)/i,
    /we (?:are|have|run|build) (.+?)(?:\.|but|and|$)/i,
  ];

  for (const pattern of situationPatterns) {
    const match = input.match(pattern);
    if (match && match[1].length > 5) {
      return match[1].trim();
    }
  }

  return "Exploring: " + input.substring(0, 80);
}
