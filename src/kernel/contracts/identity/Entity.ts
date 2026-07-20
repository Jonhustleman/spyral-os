/**
 * SPYRAL OS — Identity Layer
 * Rule #003: Every domain object inherits consistent identity semantics.
 *
 * Entity contract — objects with a persistent identity thread.
 * Entities are defined by their ID, not their attributes.
 * Two entities with the same ID are the same entity regardless of attribute differences.
 */
export interface Entity {
  /** Unique identifier — stable across time and state changes. */
  readonly id: string;

  /** When this entity was born into the system. Immutable after creation. */
  readonly createdAt: Date;

  /** When this entity was last mutated. Updated on every state change. */
  updatedAt: Date;
}
