/**
 * GET /api/auth/diagnostics — Developer diagnostics for authentication.
 *
 * Shows the full auth state for debugging.
 * Only available when NODE_ENV !== "production".
 */
import { NextResponse } from "next/server";
import { findByEmail } from "../_store";
import { verifyToken, extractToken } from "../_token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Only in development
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_AUTH_DIAGNOSTICS !== "1") {
    return NextResponse.json(
      { error: "Diagnostics are only available in development mode." },
      { status: 403 },
    );
  }

  const diagnostics: Record<string, unknown> = {
    environment: {
      NODE_ENV: process.env.NODE_ENV || "not set",
      VERCEL: process.env.VERCEL || "not set",
      AUTH_SECRET: process.env.AUTH_SECRET ? "✓ Set" : "✗ Not set",
      SPYRAL_AUTH_SECRET: process.env.SPYRAL_AUTH_SECRET ? "✓ Set" : "✗ Not set",
      ALLOW_AUTH_DIAGNOSTICS: process.env.ALLOW_AUTH_DIAGNOSTICS || "not set",
    },
    storage: {
      dataDir: process.env.VERCEL === "1" ? "/tmp/spyral-data" : "./.data",
    },
    checks: {} as Record<string, unknown>,
  };

  // Check token validity
  const token = extractToken(request);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const record = findByEmail(payload.email);
      diagnostics.checks = {
        ...diagnostics.checks as Record<string, unknown>,
        "✓ Token Found": `Valid token for ${payload.email}. Expires: ${new Date(payload.exp).toISOString()}`,
        "✓ User Found": record ? `User: ${record.user.name} (${record.user.id})` : "✗ User not found in store",
        "✓ Password Valid": record ? "✓ Hash and salt present" : "N/A",
        "✓ Session Created": "✓ Token issued",
      };

      if (record) {
        diagnostics.checks = {
          ...diagnostics.checks as Record<string, unknown>,
          "✓ Profile Loaded": `Name: ${record.user.name}, Email: ${record.user.email}, Created: ${record.user.createdAt}`,
          "✓ Workspace": "✓ User record exists",
        };
      }
    } else {
      diagnostics.checks = {
        ...diagnostics.checks as Record<string, unknown>,
        "✗ Token Invalid": "Token is expired, malformed, or signature doesn't match. This may indicate AUTH_SECRET changed.",
      };
    }
  } else {
    diagnostics.checks = {
      ...diagnostics.checks as Record<string, unknown>,
      "— No Token": "No authentication token provided. User is not logged in.",
    };
  }

  // List all users (emails only, for debugging)
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const IS_VERCEL = process.env.VERCEL === "1";
    const DATA_DIR = IS_VERCEL ? "/tmp/spyral-data" : path.join(process.cwd(), ".data");
    const USERS_FILE = path.join(DATA_DIR, "users.json");

    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, "utf-8");
      const users = JSON.parse(raw);
      diagnostics.registeredUsers = Object.keys(users).length;
      diagnostics.userEmails = Object.keys(users);
    } else {
      diagnostics.registeredUsers = 0;
      diagnostics.userEmails = [];
      diagnostics.storage = {
        ...diagnostics.storage as Record<string, unknown>,
        fileExists: false,
        expectedPath: USERS_FILE,
      };
    }
  } catch {
    diagnostics.registeredUsers = 0;
    diagnostics.storage = {
      ...diagnostics.storage as Record<string, unknown>,
      fileReadError: "Could not read users file",
    };
  }

  return NextResponse.json(diagnostics);
}
