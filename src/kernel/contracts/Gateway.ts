import type { Entity } from "./identity/Entity";

export interface Gateway extends Entity {
  workspaceId: string;
  name: string;
  type: "api" | "webhook" | "file" | "agent" | "custom";
  config: Record<string, unknown>;
  enabled: boolean;
}
