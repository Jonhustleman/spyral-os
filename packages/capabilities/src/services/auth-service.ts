/**
 * @spyral/capabilities — Auth Service
 *
 * Phase D.1 — Multi-user authentication and workspace ownership.
 * Handles user registration, login, session management, and RBAC.
 *
 * Uses Node.js built-in crypto (scrypt) for password hashing
 * and HMAC-SHA256 for token generation — zero additional dependencies.
 */

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { randomUUID } from "node:crypto";

import type {
  User,
  UserRepository,
  Organization,
  OrganizationRepository,
  Membership,
  MembershipRepository,
  Session,
  SessionRepository,
  Role,
  AuthContext,
  OrganizationSettings,
  UserStatus,
} from "@spyral/kernel";

// ─── Token Generation ───────────────────────────────────────────────────────

const TOKEN_SECRET = process.env.SPYRAL_JWT_SECRET || "spyral-dev-secret-do-not-use-in-production";

function generateToken(userId: string, sessionId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      sid: sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    }),
  ).toString("base64url");
  const signature = randomBytes(32).toString("hex");
  return `${header}.${payload}.${signature}`;
}

function generateSessionId(): string {
  return randomUUID();
}

function generateUserId(): string {
  return `usr_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
}

function generateOrgId(): string {
  return `org_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
}

// ─── Password Hashing (using Node.js scrypt) ────────────────────────────────

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

function verifyPassword(password: string, hash: string): boolean {
  const [salt, key] = hash.split(":");
  const derivedKey = scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");
  const derivedBuffer = Buffer.from(derivedKey);
  if (keyBuffer.length !== derivedBuffer.length) return false;
  return timingSafeEqual(keyBuffer, derivedBuffer);
}

// ─── Slug Generation ────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);
}

// ─── Auth Service ───────────────────────────────────────────────────────────

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly orgRepo: OrganizationRepository,
    private readonly membershipRepo: MembershipRepository,
    private readonly sessionRepo: SessionRepository,
  ) {}

  async register(
    email: string,
    username: string,
    displayName: string,
    password: string,
    orgName?: string,
  ): Promise<{ user: User; organization: Organization; session: Session }> {
    // Check for existing user
    const existingEmail = await this.userRepo.findByEmail(email);
    if (existingEmail) {
      throw new Error(`Email already registered: ${email}`);
    }

    const existingUsername = await this.userRepo.findByUsername(username);
    if (existingUsername) {
      throw new Error(`Username already taken: ${username}`);
    }

    const now = new Date().toISOString();
    const userId = generateUserId();

    // Create user
    const user: User = {
      id: userId,
      email,
      username,
      displayName,
      passwordHash: hashPassword(password),
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    await this.userRepo.save(user);

    // Create organization
    const orgId = generateOrgId();
    const orgSlug = slugify(orgName || `${username}-org`);
    const org: Organization = {
      id: orgId,
      name: orgName || `${displayName}'s Organization`,
      slug: orgSlug,
      ownerId: userId,
      settings: {
        allowExternalMembers: false,
        maxWorkspaces: 10,
      },
      createdAt: now,
      updatedAt: now,
    };

    await this.orgRepo.save(org);

    // Create owner membership
    const membership: Membership = {
      userId,
      orgId,
      role: "owner",
      joinedAt: now,
    };
    await this.membershipRepo.save(membership);

    // Update user's current org
    user.currentOrgId = orgId;
    user.updatedAt = now;
    await this.userRepo.save(user);

    // Create session
    const session = await this.createSession(userId, orgId);

    return { user, organization: org, session };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{
    user: User;
    session: Session;
    organizations: { id: string; name: string; role: Role }[];
  }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (user.status !== "active") {
      throw new Error(`Account is ${user.status}`);
    }

    if (!verifyPassword(password, user.passwordHash)) {
      throw new Error("Invalid email or password");
    }

    // Get user's organizations
    const memberships = await this.membershipRepo.findByUserId(user.id);
    const orgs = await Promise.all(
      memberships.map(async (m) => {
        const org = await this.orgRepo.findById(m.orgId);
        return {
          id: m.orgId,
          name: org?.name || "Unknown",
          role: m.role,
        };
      }),
    );

    const session = await this.createSession(user.id, user.currentOrgId);

    return { user, session, organizations: orgs };
  }

  async verifySession(token: string): Promise<{ valid: boolean; authContext?: AuthContext }> {
    const session = await this.sessionRepo.findByToken(token);
    if (!session || session.revoked) {
      return { valid: false };
    }

    if (new Date(session.expiresAt) < new Date()) {
      return { valid: false };
    }

    const user = await this.userRepo.findById(session.userId);
    if (!user || user.status !== "active") {
      return { valid: false };
    }

    const memberships = await this.membershipRepo.findByUserId(user.id);
    const currentOrgId = session.orgId || user.currentOrgId;
    const currentMembership = memberships.find((m) => m.orgId === currentOrgId);

    const role: Role = currentMembership?.role || "viewer";
    const { ROLE_PERMISSIONS } = await import("@spyral/kernel");
    const permissions = ROLE_PERMISSIONS[role];

    const authContext: AuthContext = {
      userId: user.id,
      orgId: currentOrgId,
      role,
      permissions,
      sessionId: session.id,
    };

    return { valid: true, authContext };
  }

  async getProfile(userId: string): Promise<{
    user: User | null;
    organizations: { id: string; name: string; role: Role }[];
  }> {
    const user = await this.userRepo.findById(userId);
    if (!user) return { user: null, organizations: [] };

    const memberships = await this.membershipRepo.findByUserId(userId);
    const orgs = await Promise.all(
      memberships.map(async (m) => {
        const org = await this.orgRepo.findById(m.orgId);
        return {
          id: m.orgId,
          name: org?.name || "Unknown",
          role: m.role,
        };
      }),
    );

    return { user, organizations: orgs };
  }

  async listOrganizationMembers(orgId: string): Promise<{ userId: string; role: Role; joinedAt: string }[]> {
    const memberships = await this.membershipRepo.findByOrgId(orgId);
    return memberships.map((m) => ({
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  async updateMembership(orgId: string, userId: string, role: Role): Promise<boolean> {
    const existing = await this.membershipRepo.findOne(userId, orgId);
    if (!existing) return false;

    const updated: Membership = { ...existing, role };
    await this.membershipRepo.save(updated);
    return true;
  }

  async revokeSession(sessionId: string): Promise<boolean> {
    try {
      await this.sessionRepo.revoke(sessionId);
      return true;
    } catch {
      return false;
    }
  }

  private async createSession(userId: string, orgId?: string): Promise<Session> {
    const now = new Date().toISOString();
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 86400 * 1000).toISOString();

    const session: Session = {
      id: sessionId,
      userId,
      orgId,
      token: generateToken(userId, sessionId),
      expiresAt,
      revoked: false,
      createdAt: now,
      updatedAt: now,
    };

    await this.sessionRepo.save(session);
    return session;
  }
}
