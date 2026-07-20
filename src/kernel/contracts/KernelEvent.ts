/**
 * SPYRAL OS — Kernel Contract
 * KernelEvent — the canonical event contract for inter-capability communication.
 *
 * ADR-0010: Events must exist before plugins start talking to each other.
 * This is the contract ONLY. The event bus will be built later.
 *
 * FROZEN — Core API. Do not modify after Sprint 3.
 */

/**
 * A kernel event represents something that happened in the system.
 * Capabilities emit events; other capabilities may observe and react.
 *
 * The kernel defines the shape of events.
 * Capabilities define the meaning of specific event types.
 */
export interface KernelEvent {
  /** Globally unique event identifier. */
  readonly id: string;

  /** Event type string (e.g. "workspace.created", "capability.enabled"). */
  readonly type: string;

  /** When the event occurred. */
  readonly timestamp: Date;

  /** ID of the source that emitted this event (e.g. capability ID, workspace ID). */
  readonly source: string;

  /** Event-specific payload. Structure depends on event type. */
  readonly payload: unknown;
}
