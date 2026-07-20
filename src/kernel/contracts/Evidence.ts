import type { Entity } from "./identity/Entity";

export interface Evidence extends Entity {
  workspaceId: string;
  type: "research" | "data" | "insight" | "reference" | "observation";
  title: string;
  content: string;
  source?: string;
  tags: string[];
}
