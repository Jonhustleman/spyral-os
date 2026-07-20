/**
 * SPYRAL OS — MCP Auth Tools
 *
 * Phase D.1 — Authentication tools for the MCP server.
 * Provides register, login, profile, and session management.
 */

import { z } from "zod";

// ─── Input Schemas ──────────────────────────────────────────────────────────

export const RegisterInputSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32),
  displayName: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
  orgName: z.string().optional(),
});

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const GetProfileInputSchema = z.object({
  userId: z.string().optional(),
});

export const LogoutInputSchema = z.object({
  sessionId: z.string(),
});

// ─── Tool Definitions ───────────────────────────────────────────────────────

export const registerToolDefinition = {
  name: "spyral_register",
  description: "Register a new user account with an organization",
  inputSchema: {
    type: "object",
    properties: {
      email: { type: "string", description: "Email address" },
      username: { type: "string", description: "Unique username (3-32 chars)" },
      displayName: { type: "string", description: "Display name" },
      password: { type: "string", description: "Password (min 8 chars)" },
      orgName: { type: "string", description: "Optional organization name" },
    },
    required: ["email", "username", "displayName", "password"],
  },
};

export const loginToolDefinition = {
  name: "spyral_login",
  description: "Log in with email and password to get a session token",
  inputSchema: {
    type: "object",
    properties: {
      email: { type: "string", description: "Email address" },
      password: { type: "string", description: "Password" },
    },
    required: ["email", "password"],
  },
};

export const getProfileToolDefinition = {
  name: "spyral_get_profile",
  description: "Get the current user's profile and organizations",
  inputSchema: {
    type: "object",
    properties: {
      userId: { type: "string", description: "User ID (defaults to current session)" },
    },
  },
};

export const logoutToolDefinition = {
  name: "spyral_logout",
  description: "Revoke a session token",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: { type: "string", description: "Session ID to revoke" },
    },
    required: ["sessionId"],
  },
};

// ─── Tool Handlers ──────────────────────────────────────────────────────────

import type { AuthService } from "@spyral/capabilities";

export function createAuthHandlers(authService: AuthService) {
  return {
    handleRegister: async (input: z.infer<typeof RegisterInputSchema>) => {
      try {
        const result = await authService.register(
          input.email,
          input.username,
          input.displayName,
          input.password,
          input.orgName,
        );
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                userId: result.user.id,
                orgId: result.organization.id,
                token: result.session.token,
                sessionId: result.session.id,
              }),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Registration failed";
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: message }) }],
          isError: true,
        };
      }
    },

    handleLogin: async (input: z.infer<typeof LoginInputSchema>) => {
      try {
        const result = await authService.login(input.email, input.password);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                userId: result.user.id,
                token: result.session.token,
                sessionId: result.session.id,
                organizations: result.organizations,
              }),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: message }) }],
          isError: true,
        };
      }
    },

    handleGetProfile: async (input: z.infer<typeof GetProfileInputSchema>) => {
      try {
        const result = await authService.getProfile(input.userId || "");
        if (!result.user) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: "User not found" }) }],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                user: {
                  id: result.user.id,
                  email: result.user.email,
                  username: result.user.username,
                  displayName: result.user.displayName,
                  status: result.user.status,
                },
                organizations: result.organizations,
              }),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get profile";
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: message }) }],
          isError: true,
        };
      }
    },

    handleLogout: async (input: z.infer<typeof LogoutInputSchema>) => {
      try {
        const result = await authService.revokeSession(input.sessionId);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ success: result }),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Logout failed";
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: message }) }],
          isError: true,
        };
      }
    },
  };
}
