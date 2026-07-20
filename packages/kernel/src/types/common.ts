/**
 * @spyral/kernel — Common Domain Types
 *
 * Shared base types for all domain entities.
 * Every entity in SPYRAL has identity, creation time, and update time.
 */

export type EntityId = string;
export type Timestamp = string; // ISO 8601

export interface DomainEntity {
  id: EntityId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type HealthStatus = "operational" | "degraded" | "offline";

export interface CapabilityStatus {
  name: string;
  status: HealthStatus;
  description: string;
  metrics?: Record<string, number>;
}

export interface SystemStatus {
  system: string;
  version: string;
  phase: string;
  health: HealthStatus;
  uptime: number;
  capabilities: CapabilityStatus[];
  timestamp: Timestamp;
}
