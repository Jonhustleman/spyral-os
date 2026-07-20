/**
 * @spyral/kernel — Auth Domain Types
 *
 * Phase D.1 — Multi-user authentication and workspace ownership.
 * Defines the user, organization, role, and session types that
 * underpin SPYRAL's identity and access control model.
 *
 * Architecture:
 *   User → Organization (via Membership with Role)
 *   AuthContext injected into every service call
 *   RBAC enforced at the MCP tool boundary
 */

import type { DomainEntity } from "./common.js";

// ─── Roles & Permissions ────────────────────────────────────────────────────

export type Role = "owner" | "admin" | "member" | "viewer";

export type ResourceType = "workspace" | "decision" | "execution" | "learning" | "organization" | "user";

export type PermissionAction = "create" | "read" | "update" | "delete" | "manage";

export interface Permission {
  resource: ResourceType;
  actions: PermissionAction[];
}

/** Map of role → permitted resource actions */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    { resource: "organization", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "workspace", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "decision", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "execution", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "learning", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "user", actions: ["create", "read", "update", "delete", "manage"] },
  ],
  admin: [
    { resource: "organization", actions: ["read", "update"] },
    { resource: "workspace", actions: ["create", "read", "update", "delete"] },
    { resource: "decision", actions: ["create", "read", "update", "delete"] },
    { resource: "execution", actions: ["create", "read", "update", "delete"] },
    { resource: "learning", actions: ["create", "read", "update", "delete"] },
    { resource: "user", actions: ["read"] },
  ],
  member: [
    { resource: "workspace", actions: ["read"] },
    { resource: "decision", actions: ["create", "read", "update"] },
    { resource: "execution", actions: ["create", "read", "update"] },
    { resource: "learning", actions: ["create", "read"] },
  ],
  viewer: [
    { resource: "workspace", actions: ["read"] },
    { resource: "decision", actions: ["read"] },
    { resource: "execution", actions: ["read"] },
    { resource: "learning", actions: ["read"] },
  ],
};

// ─── User ────────────────────────────────────────────────────────────────────

export type UserStatus = "active" | "inactive" | "suspended";

export interface User extends DomainEntity {
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  status: UserStatus;
  currentOrgId?: string;
}

// ─── Organization ────────────────────────────────────────────────────────────

export interface OrganizationSettings {
  allowExternalMembers?: boolean;
  maxWorkspaces?: number;
  features?: string[];
}

export interface Organization extends DomainEntity {
  name: string;
  slug: string;
  ownerId: string;
  settings: OrganizationSettings;
}

// ─── Membership ──────────────────────────────────────────────────────────────

export interface Membership {
  userId: string;
  orgId: string;
  role: Role;
  joinedAt: string;
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface Session extends DomainEntity {
  userId: string;
  orgId?: string;
  token: string;
  expiresAt: string;
  revoked: boolean;
}

// ─── Auth Context (injected per request) ─────────────────────────────────────

export interface AuthContext {
  userId: string;
  orgId?: string;
  role: Role;
  permissions: Permission[];
  sessionId: string;
}

// ─── Auth DTOs ───────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  username: string;
  displayName: string;
  password: string;
  orgName?: string;
}

export interface RegisterResponse {
  user: User;
  organization: Organization;
  session: Session;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  session: Session;
  organizations: { id: string; name: string; role: Role }[];
}

export interface VerifySessionRequest {
  token: string;
}

export interface VerifySessionResponse {
  valid: boolean;
  authContext?: AuthContext;
}

// ─── Repository Ports ────────────────────────────────────────────────────────

export interface UserRepository {
  findById(id: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  findByUsername(username: string): Promise<User | undefined>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<boolean>;
}

export interface OrganizationRepository {
  findById(id: string): Promise<Organization | undefined>;
  findBySlug(slug: string): Promise<Organization | undefined>;
  findByOwnerId(ownerId: string): Promise<Organization[]>;
  findAll(): Promise<Organization[]>;
  save(org: Organization): Promise<Organization>;
  delete(id: string): Promise<boolean>;
}

export interface MembershipRepository {
  findByUserId(userId: string): Promise<Membership[]>;
  findByOrgId(orgId: string): Promise<Membership[]>;
  findOne(userId: string, orgId: string): Promise<Membership | undefined>;
  save(membership: Membership): Promise<Membership>;
  delete(userId: string, orgId: string): Promise<boolean>;
}

export interface SessionRepository {
  findById(id: string): Promise<Session | undefined>;
  findByToken(token: string): Promise<Session | undefined>;
  findByUserId(userId: string): Promise<Session[]>;
  save(session: Session): Promise<Session>;
  delete(id: string): Promise<boolean>;
  revoke(id: string): Promise<Session>;
}

// ─── Tenant Context (Phase D.2) ──────────────────────────────────────────────

/**
 * Immutable tenant context that travels with every request.
 * Provides identity, authorization, and tracing information
 * to all layers of the application.
 */
export interface TenantContext {
  /** The authenticated user's ID */
  userId: string;
  /** The organization scope for this request */
  organizationId: string;
  /** The user's role within the organization */
  role: Role;
  /** Resolved permissions for the user in this context */
  permissions: Permission[];
  /** Optional workspace scope */
  workspaceId?: string;
  /** Unique request ID for tracing and audit correlation */
  requestId: string;
  /** The session token ID */
  sessionId: string;
  /** ISO timestamp when the request was initiated */
  issuedAt: string;
}
