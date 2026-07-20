import type { Entity } from "./identity/Entity";

export interface Reality extends Entity {
  name: string;
  description: string;
  workspaceId: string;
}
