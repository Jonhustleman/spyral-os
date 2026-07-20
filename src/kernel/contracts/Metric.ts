import type { Entity } from "./identity/Entity";

export interface Metric extends Entity {
  workspaceId: string;
  name: string;
  value: number;
  unit?: string;
  timestamp: Date;
  tags: string[];
}
