/**
 * GET /api/auth/session — Validate token and return user.
 *
 * This is the critical endpoint for session restoration.
 * Called on every page load to verify the cached token is still valid.
 *
 * Token can be provided via:
 *   - Authorization: Bearer <token> header
 *   - ?token=<token> query parameter
 *
 * Session resilience:
 *   On Vercel serverless, /tmp/ storage can be cleared between requests.
 *   To handle this, we return user data from the token payload itself when
 *   the file store is unavailable. The token is self-contained — it holds
 *   userId, email, and name. This ensures sessions survive storage resets.
 *
 *   We attempt to fetch the latest user data from the store (for profile
 *   updates), but fall back to the token payload if the store is empty.
 */
import { NextResponse } from "next/server";
import { verifyToken, extractToken, type TokenPayload } from "../_token";
import { findByEmail } from "../_store";

export const dynamic = "force-dynamic";

function payloadToUser(payload: TokenPayload) {
  return {
    id: payload.userId,
    email: payload.email,
    name: payload.name,
    createdAt: new Date(payload.iat).toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const token = extractToken(request);

    if (!token) {
      return NextResponse.json({ valid: false, error: "No token provided." });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ valid: false, error: "Invalid or expired token." });
    }

    // Attempt to fetch latest user data from store
    // If the store is unavailable (e.g., Vercel /tmp/ was cleared), fall back
    // to the token payload — the token itself is authoritative.
    const record = await findByEmail(payload.email);

    if (record) {
      // User found in store — return latest data
      return NextResponse.json({
        valid: true,
        user: record.user,
      });
    }

    // Store unavailable — return user data from token payload
    // This ensures sessions survive Vercel serverless storage resets.
    return NextResponse.json({
      valid: true,
      user: payloadToUser(payload),
    });
  } catch (err) {
    console.error("[auth/session] Error:", err);
    return NextResponse.json({ valid: false, error: "Server error." });
  }
}
