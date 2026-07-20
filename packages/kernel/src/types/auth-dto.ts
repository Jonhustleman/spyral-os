/**
 * @spyral/kernel — Auth DTOs (Phase D.1)
 *
 * Request/response types for authentication and user management.
 * These DTOs decouple MCP transport from auth business logic.
 */

import type { User, Organization, Session, AuthContext, Role } from "./auth.js";

export interface RegisterUserRequest {
  email: string;
  username: string;
  displayName: string;
  password: string;
  orgName?: string;
}

export interface RegisterUserResponse {
  user: User;
  organization: Organization;
  session: Session;
}

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  user: User;
  session: Session;
  organizations: { id: string; name: string; role: Role }[];
}

export interface GetProfileRequest {
  userId: string;
}

export interface GetProfileResponse {
  user: User | null;
  organizations: { id: string; name: string; role: Role }[];
}

export interface ListOrganizationMembersRequest {
  orgId: string;
}

export interface ListOrganizationMembersResponse {
  members: { user: User; role: Role }[];
}

export interface UpdateMembershipRequest {
  orgId: string;
  userId: string;
  role: Role;
}

export interface UpdateMembershipResponse {
  success: boolean;
}
