/**
 * RelationshipEngine — Discovers connections between entities.
 *
 * RC6: This is NOT a reasoning engine. It finds basic connections
 * between entities extracted from user input and known domain mappings.
 * The LLM reasons OVER these relationships — this engine only surfaces them.
 *
 * This is like drawing lines between dots. The LLM decides what the lines mean.
 */

import type { Entity, Relationship } from "./WorkingMind";

let _relCounter = 0;

function nextRelId(): string {
  return `rel_${++_relCounter}`;
}

// ─── Domain relationship knowledge base ──────────────────────────────────
// These are well-known structural connections between domains.
// Not reasoning — just known relationships.

const DOMAIN_MAP: [string, string, string, string][] = [
  // [source, target, type, description]
  ["transportation", "infrastructure", "depends_on", "Transportation depends on infrastructure"],
  ["transportation", "cities", "shapes", "Transportation shapes how cities develop"],
  ["transportation", "energy", "consumes", "Transportation consumes energy"],
  ["transportation", "environment", "affects", "Transportation affects the environment"],
  ["transportation", "economics", "enables", "Transportation enables economic activity"],

  ["architecture", "cities", "shapes", "Architecture shapes cities"],
  ["architecture", "culture", "reflects", "Architecture reflects culture"],
  ["architecture", "energy", "consumes", "Architecture consumes energy"],

  ["energy", "economics", "enables", "Energy enables economic activity"],
  ["energy", "environment", "affects", "Energy production affects the environment"],
  ["energy", "technology", "depends_on", "Modern energy depends on technology"],

  ["technology", "science", "depends_on", "Technology depends on scientific discovery"],
  ["technology", "economics", "transforms", "Technology transforms economic structures"],
  ["technology", "culture", "changes", "Technology changes culture and behavior"],

  ["economics", "culture", "shapes", "Economic systems shape culture"],
  ["economics", "society", "structures", "Economics structures society"],

  ["health", "medicine", "depends_on", "Health depends on medicine"],
  ["health", "technology", "enabled_by", "Modern health is enabled by technology"],
  ["health", "economics", "costs", "Healthcare costs affect economics"],

  ["education", "technology", "uses", "Education increasingly uses technology"],
  ["education", "culture", "transmits", "Education transmits culture"],
  ["education", "economics", "requires", "Education requires economic investment"],

  ["culture", "society", "defines", "Culture defines society"],
  ["culture", "psychology", "shapes", "Culture shapes psychology"],

  ["cities", "infrastructure", "require", "Cities require infrastructure"],
  ["cities", "culture", "concentrate", "Cities concentrate culture"],
  ["cities", "economics", "concentrate", "Cities concentrate economic activity"],
  ["cities", "environment", "impact", "Cities impact the environment"],

  ["business", "market", "depends_on", "Business depends on market conditions"],
  ["business", "customers", "requires", "Business requires customers"],
  ["business", "strategy", "requires", "Business requires strategy"],
  ["business", "finance", "depends_on", "Business depends on finance"],

  ["climate", "environment", "affects", "Climate affects the environment"],
  ["climate", "energy", "related_to", "Climate and energy are deeply connected"],
  ["climate", "politics", "influences", "Climate influences politics"],
  ["climate", "economics", "affects", "Climate affects economics"],
];

// ─── Pattern-based extraction ────────────────────────────────────────────

const RELATIONSHIP_PATTERNS: [RegExp, string][] = [
  [/(\w+)\s+(?:causes|leads to|creates|produces|triggers)\s+(\w+)/gi, "causes"],
  [/(\w+)\s+(?:enables|allows|permits|makes possible)\s+(\w+)/gi, "enables"],
  [/(\w+)\s+(?:requires|needs|depends on|relies on)\s+(\w+)/gi, "requires"],
  [/(\w+)\s+(?:prevents|blocks|stops|limits|constrains)\s+(\w+)/gi, "prevents"],
  [/(\w+)\s+(?:replaces|substitutes|supplants)\s+(\w+)/gi, "replaces"],
  [/(\w+)\s+(?:transforms|changes|alters)\s+(\w+)/gi, "transforms"],
  [/(\w+)\s+(?:contradicts|opposes|is opposite to)\s+(\w+)/gi, "contradicts"],
  [/(\w+)\s+(?:is like|is similar to|resembles|is analogous to)\s+(\w+)/gi, "similar_to"],
  [/(\w+)\s+(?:is part of|belongs to|is a component of)\s+(\w+)/gi, "part_of"],
];

/**
 * Discover relationships between entities in a WorkingMind.
 * Uses pattern matching on input text + domain knowledge base.
 * Never reasons — just surfaces known and likely connections.
 */
export function discoverRelationships(
  entities: Entity[],
  rawInput: string,
): Relationship[] {
  const relationships: Relationship[] = [];
  const seenPairs = new Set<string>();
  const lowerInput = rawInput.toLowerCase();

  // 1. Extract explicit relationships from user's own language
  for (const [pattern, relType] of RELATIONSHIP_PATTERNS) {
    let match: RegExpExecArray | null;
    const re = new RegExp(pattern.source, 'gi');
    while ((match = re.exec(rawInput)) !== null) {
      const sourceName = match[1].toLowerCase();
      const targetName = match[2].toLowerCase();
      const sourceEntity = entities.find(e => e.name.toLowerCase() === sourceName);
      const targetEntity = entities.find(e => e.name.toLowerCase() === targetName);

      if (sourceEntity && targetEntity && sourceEntity.id !== targetEntity.id) {
        const pairKey = `${sourceEntity.id}-${targetEntity.id}`;
        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey);
          relationships.push({
            id: nextRelId(),
            sourceId: sourceEntity.id,
            targetId: targetEntity.id,
            type: relType,
            strength: "strong",
            description: match[0].trim(),
          });
        }
      }
    }
  }

  // 2. Discover relationships from domain knowledge base
  const domainEntities = entities.filter(e => e.type === "domain" || e.type === "concept");

  for (let i = 0; i < domainEntities.length; i++) {
    for (let j = i + 1; j < domainEntities.length; j++) {
      const a = domainEntities[i];
      const b = domainEntities[j];
      const pairKey = `${a.id}-${b.id}`;
      if (seenPairs.has(pairKey)) continue;

      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // Check both directions in the domain map
      const match = DOMAIN_MAP.find(
        ([src, tgt]) =>
          (aName.includes(src) && bName.includes(tgt)) ||
          (aName.includes(tgt) && bName.includes(src))
      );

      if (match) {
        const [src, , type, desc] = match;
        seenPairs.add(pairKey);
        const isReversed = !aName.includes(src);
        relationships.push({
          id: nextRelId(),
          sourceId: isReversed ? b.id : a.id,
          targetId: isReversed ? a.id : b.id,
          type,
          strength: "moderate",
          description: isReversed ? `${b.name} ${type} ${a.name}` : `${a.name} ${type} ${b.name}`,
        });
      }
    }
  }

  // 3. Surface-level co-occurrence (same sentence = likely related)
  const sentences = rawInput.split(/[.!?]+/).filter(s => s.trim().length > 10);
  for (const sentence of sentences) {
    const sentenceLower = sentence.toLowerCase();
    const sentenceEntities = entities.filter(e =>
      e.source === "user" && sentenceLower.includes(e.name.toLowerCase())
    );

    for (let i = 0; i < sentenceEntities.length; i++) {
      for (let j = i + 1; j < sentenceEntities.length; j++) {
        const a = sentenceEntities[i];
        const b = sentenceEntities[j];
        const pairKey = `${a.id}-${b.id}`;
        if (seenPairs.has(pairKey)) continue;

        seenPairs.add(pairKey);
        relationships.push({
          id: nextRelId(),
          sourceId: a.id,
          targetId: b.id,
          type: "related_to",
          strength: "weak",
          description: `${a.name} and ${b.name} appear in the same context`,
        });
      }
    }
  }

  return relationships;
}
