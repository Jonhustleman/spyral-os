/**
 * DecisionRelationship — A directed edge in the Decision Graph.
 *
 * Per ADR-0022, decisions can reference other decisions to form
 * a graph of dependencies, blocks, enablers, supersessions, and duplicates.
 */

export enum DecisionRelationshipType {
  /** This decision depends on the target decision being made first. */
  DEPENDS_ON = "depends_on",

  /** This decision blocks the target decision from being made. */
  BLOCKS = "blocks",

  /** This decision enables the target decision. */
  ENABLES = "enables",

  /** This decision supersedes/overrides the target decision. */
  SUPERSEDES = "supersedes",

  /** This decision duplicates the target decision (should be merged). */
  DUPLICATES = "duplicates",
}

export interface DecisionRelationship {
  /** The source decision ID. */
  fromDecisionId: string;

  /** The target decision ID. */
  toDecisionId: string;

  /** The type of relationship. */
  relationship: DecisionRelationshipType;

  /** Optional description of the relationship. */
  description?: string;
}
