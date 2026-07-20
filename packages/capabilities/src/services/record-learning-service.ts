/**
 * RecordLearningService — Orchestrates learning recording.
 *
 * Coordinates:
 *   1. Validate workspace exists
 *   2. Record the learning event
 *   3. Return enhanced response with patterns if available
 *
 * Phase C.0 — Application Service Layer
 */

import type {
  TenantContext,
  RecordLearningRequest,
  RecordLearningResponse,
} from "@spyral/kernel";
import { getApplicationContext } from "./application-context.js";

export class RecordLearningService {
  async execute(tenantCtx: TenantContext, request: RecordLearningRequest): Promise<RecordLearningResponse> {
    const ctx = getApplicationContext();

    // 1. Validate workspace exists
    const workspace = await ctx.workspace.getWorkspace(tenantCtx, request.workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${request.workspaceId}`);
    }

    // 2. Record the learning event
    const record = await ctx.learning.recordLearning(tenantCtx, {
      workspaceId: request.workspaceId,
      decisionId: request.decisionId,
      outcomeIds: request.outcomeIds,
      type: request.type,
      content: request.content,
      confidence: request.confidence,
      description: request.description,
    });

    return { record };
  }
}
