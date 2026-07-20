/**
 * SPYRAL OS — Identity Layer
 * Rule #003: Every domain object inherits consistent identity semantics.
 *
 * Aggregate contract — a cluster of domain objects treated as a single unit.
 * Aggregates enforce transactional consistency boundaries.
 * External references must only point to the aggregate root (the Aggregate itself).
 */
export interface Aggregate {
  /** The aggregate root identifier — the only ID exposed to external consumers. */
  readonly id: string;

  /** Current version number — used for optimistic concurrency control. */
  readonly version: number;

  /** When this aggregate was first persisted. */
  readonly createdAt: Date;

  /** When this aggregate was last committed. */
  readonly updatedAt: Date;
}
