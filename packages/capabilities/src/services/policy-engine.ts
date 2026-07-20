/**
 * @spyral/capabilities — Policy Engine (Phase D.2.3)
 *
 * Separates permissions from policies.
 * Each resource type has its own policy that answers:
 *   Can create? Can edit? Can delete? Can share? Can approve? Can archive?
 *
 * Policies are checked AFTER authentication (verifying identity)
 * but BEFORE any repository operation.
 */

import type { TenantContext, Role, PermissionAction, ResourceType } from "@spyral/kernel";

// ─── Policy Action Types ─────────────────────────────────────────────────────

export type PolicyAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage"
  | "approve"
  | "archive"
  | "share";

// ─── Policy Check Result ─────────────────────────────────────────────────────

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: Role;
}

// ─── Base Policy ─────────────────────────────────────────────────────────────

export abstract class BasePolicy {
  protected abstract resourceType: ResourceType;

  /**
   * Check if a user's role allows a specific action on this resource.
   * Uses the ROLE_PERMISSIONS mapping from kernel.
   */
  checkPermission(ctx: TenantContext, action: PolicyAction): PolicyResult {
    const permission = ctx.permissions.find(
      (p) => p.resource === this.resourceType,
    );
    if (!permission) {
      return {
        allowed: false,
        reason: `No permissions defined for resource: ${this.resourceType}`,
      };
    }
    if (!permission.actions.includes(action as PermissionAction)) {
      return {
        allowed: false,
        reason: `Role '${ctx.role}' does not have '${action}' permission on '${this.resourceType}'`,
        requiredRole: this.getRequiredRole(action),
      };
    }
    return { allowed: true };
  }

  /**
   * Determine if the context's organization matches the resource's organization.
   * Override in subclasses for custom cross-org checks.
   */
  protected checkOrgScope(ctx: TenantContext, resourceOrgId: string): PolicyResult {
    if (ctx.organizationId !== resourceOrgId) {
      return {
        allowed: false,
        reason: `Organization mismatch: context has '${ctx.organizationId}', resource has '${resourceOrgId}'`,
      };
    }
    return { allowed: true };
  }

  /**
   * Determine if the context's user owns the resource.
   */
  protected checkOwnership(ctx: TenantContext, resourceOwnerId: string): PolicyResult {
    if (ctx.userId !== resourceOwnerId && ctx.role !== "owner" && ctx.role !== "admin") {
      return {
        allowed: false,
        reason: `User '${ctx.userId}' does not own this resource and is not an owner/admin`,
      };
    }
    return { allowed: true };
  }

  private getRequiredRole(action: PolicyAction): Role {
    // Infer required role from the action
    switch (action) {
      case "manage":
        return "owner";
      case "delete":
      case "approve":
      case "archive":
        return "admin";
      case "create":
      case "update":
      case "share":
        return "member";
      case "read":
        return "viewer";
    }
  }
}

// ─── Decision Policy ─────────────────────────────────────────────────────────

export class DecisionPolicy extends BasePolicy {
  protected resourceType: ResourceType = "decision";

  canCreate(ctx: TenantContext): PolicyResult {
    return this.checkPermission(ctx, "create");
  }

  canRead(ctx: TenantContext, decisionOrgId: string): PolicyResult {
    const permCheck = this.checkPermission(ctx, "read");
    if (!permCheck.allowed) return permCheck;
    return this.checkOrgScope(ctx, decisionOrgId);
  }

  canUpdate(ctx: TenantContext, decisionOrgId: string, decisionOwnerId: string): PolicyResult {
    const permCheck = this.checkPermission(ctx, "update");
    if (!permCheck.allowed) return permCheck;
    const orgCheck = this.checkOrgScope(ctx, decisionOrgId);
    if (!orgCheck.allowed) return orgCheck;
    return this.checkOwnership(ctx, decisionOwnerId);
  }

  canDelete(ctx: TenantContext, decisionOrgId: string): PolicyResult {
    const permCheck = this.checkPermission(ctx, "delete");
    if (!permCheck.allowed) return permCheck;
    return this.checkOrgScope(ctx, decisionOrgId);
  }

  canApprove(ctx: TenantContext, decisionOrgId: string): PolicyResult {
    const permCheck = this.checkPermission(ctx, "approve");
    if (!permCheck.allowed) return permCheck;
    return this.checkOrgScope(ctx, decisionOrgId);
  }
}

// ─── Workspace Policy ────────────────────────────────────────────────────────

export class WorkspacePolicy extends BasePolicy {
  protected resourceType: ResourceType = "workspace";

  canCreate(ctx: TenantContext): PolicyResult {
    return this.checkPermission(ctx, "create");
  }

  canRead(ctx: TenantContext, workspaceOrgId: string): PolicyResult {
    const permCheck = this.checkPermission(ctx, "read");
    if (!permCheck.allowed) return permCheck;
    return this.checkOrgScope(ctx, workspaceOrgId);
  }

  canUpdate(ctx: TenantContext, workspaceOrgId: string, workspaceOwnerId: string): PolicyResult {
    const permCheck = this.checkPermission(ctx, "update");
    if (!permCheck.allowed) return permCheck;
    const orgCheck = this.checkOrgScope(ctx, workspaceOrgId);
    if (!orgCheck.allowed) return orgCheck;
    return this.checkOwnership(ctx, workspaceOwnerId);
  }

  canDelete(ctx: TenantContext, workspaceOrgId: string): PolicyResult {
    const permCheck = this.checkPermission(ctx, "delete");
    if (!permCheck.allowed) return permCheck;
    return this.checkOrgScope(ctx, workspaceOrgId);
  }

  canArchive(ctx: TenantContext, workspaceOrgId: string): PolicyResult {
    const permCheck = this.checkPermission(ctx, "archive");
    if (!permCheck.allowed) return permCheck;
    return this.checkOrgScope(ctx, workspaceOrgId);
  }
}

// ─── Execution Policy ────────────────────────────────────────────────────────

export class ExecutionPolicy extends BasePolicy {
  protected resourceType: ResourceType = "execution";

  canCreate(ctx: TenantContext): PolicyResult {
    return this.checkPermission(ctx, "create");
  }

  canRead(ctx: TenantContext, executionOrgId: string): PolicyResult {
    const permCheck = this.checkPermission(ctx, "read");
    if (!permCheck.allowed) return permCheck;
    return this.checkOrgScope(ctx, executionOrgId);
  }

  canUpdate(ctx: TenantContext, executionOrgId: string, executionOwnerId: string): PolicyResult {
    const permCheck = this.checkPermission(ctx, "update");
    if (!permCheck.allowed) return permCheck;
    const orgCheck = this.checkOrgScope(ctx, executionOrgId);
    if (!orgCheck.allowed) return orgCheck;
    return this.checkOwnership(ctx, executionOwnerId);
  }

  canDelete(ctx: TenantContext, executionOrgId: string): PolicyResult {
    const permCheck = this.checkPermission(ctx, "delete");
    if (!permCheck.allowed) return permCheck;
    return this.checkOrgScope(ctx, executionOrgId);
  }
}

// ─── Learning Policy ─────────────────────────────────────────────────────────

export class LearningPolicy extends BasePolicy {
  protected resourceType: ResourceType = "learning";

  canCreate(ctx: TenantContext): PolicyResult {
    return this.checkPermission(ctx, "create");
  }

  canRead(ctx: TenantContext, learningOrgId?: string): PolicyResult {
    const permCheck = this.checkPermission(ctx, "read");
    if (!permCheck.allowed) return permCheck;
    if (learningOrgId) {
      return this.checkOrgScope(ctx, learningOrgId);
    }
    return { allowed: true };
  }

  canUpdate(ctx: TenantContext, learningOrgId: string): PolicyResult {
    const permCheck = this.checkPermission(ctx, "update");
    if (!permCheck.allowed) return permCheck;
    return this.checkOrgScope(ctx, learningOrgId);
  }

  canDelete(ctx: TenantContext, learningOrgId: string): PolicyResult {
    const permCheck = this.checkPermission(ctx, "delete");
    if (!permCheck.allowed) return permCheck;
    return this.checkOrgScope(ctx, learningOrgId);
  }
}

// ─── Policy Factory ──────────────────────────────────────────────────────────

export class PolicyFactory {
  private decisionPolicy = new DecisionPolicy();
  private workspacePolicy = new WorkspacePolicy();
  private executionPolicy = new ExecutionPolicy();
  private learningPolicy = new LearningPolicy();

  forDecision(): DecisionPolicy {
    return this.decisionPolicy;
  }

  forWorkspace(): WorkspacePolicy {
    return this.workspacePolicy;
  }

  forExecution(): ExecutionPolicy {
    return this.executionPolicy;
  }

  forLearning(): LearningPolicy {
    return this.learningPolicy;
  }
}
