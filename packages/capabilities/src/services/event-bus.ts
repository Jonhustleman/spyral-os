/**
 * EventBus — Lightweight synchronous in-memory domain event dispatcher.
 *
 * Phase C.2 — Domain Events
 *
 * Architecture:
 *   Capability/Service → emit(event) → EventBus → dispatch(handlers)
 *
 * Initially synchronous. Can be swapped for RabbitMQ/Kafka/Redis later
 * by implementing the same EventBus interface.
 */

import type {
  DomainEvent,
  DomainEventName,
  DomainEventHandler,
} from "@spyral/kernel";

export class EventBus {
  private handlers: Map<DomainEventName, DomainEventHandler[]> = new Map();
  private history: DomainEvent[] = [];

  /**
   * Register a handler for a specific event type.
   */
  on(eventName: DomainEventName, handler: DomainEventHandler): void {
    const existing = this.handlers.get(eventName) ?? [];
    existing.push(handler);
    this.handlers.set(eventName, existing);
  }

  /**
   * Remove a handler for a specific event type.
   */
  off(eventName: DomainEventName, handler: DomainEventHandler): void {
    const existing = this.handlers.get(eventName) ?? [];
    this.handlers.set(
      eventName,
      existing.filter((h) => h !== handler),
    );
  }

  /**
   * Emit an event — dispatches to all registered handlers synchronously.
   */
  async emit(event: DomainEvent): Promise<void> {
    this.history.push(event);

    const handlers = this.handlers.get(event.eventName) ?? [];
    const allHandlers = this.handlers.get("*" as DomainEventName) ?? [];

    const errors: Error[] = [];

    for (const handler of [...handlers, ...allHandlers]) {
      try {
        await Promise.resolve(handler(event));
      } catch (err) {
        errors.push(err instanceof Error ? err : new Error(String(err)));
      }
    }

    if (errors.length > 0) {
      console.error(`[EventBus] ${errors.length} handler(s) failed for ${event.eventName}:`, errors);
    }
  }

  /**
   * Get event history for debugging/observability.
   */
  getHistory(): DomainEvent[] {
    return [...this.history];
  }

  /**
   * Get events for a specific aggregate.
   */
  getEventsForAggregate(aggregateId: string): DomainEvent[] {
    return this.history.filter((e) => e.aggregateId === aggregateId);
  }

  /**
   * Clear event history (for testing).
   */
  clearHistory(): void {
    this.history = [];
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let globalInstance: EventBus | null = null;

export function getGlobalEventBus(): EventBus {
  if (!globalInstance) {
    globalInstance = new EventBus();
  }
  return globalInstance;
}

export function resetGlobalEventBus(): void {
  globalInstance = null;
}
