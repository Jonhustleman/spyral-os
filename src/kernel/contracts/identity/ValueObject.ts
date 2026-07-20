/**
 * SPYRAL OS — Identity Layer
 * Rule #003: Every domain object inherits consistent identity semantics.
 *
 * Value Object contract — objects defined entirely by their attribute values.
 * Two value objects with the same attributes are interchangeable.
 * Immutable by convention — once created, their state should not change.
 */
export interface ValueObject {
  /** Structural equality check — compares all relevant attributes. */
  equals(other: this): boolean;

  /** Returns a frozen representation for serialization and comparison. */
  toPrimitive(): Record<string, unknown>;
}
