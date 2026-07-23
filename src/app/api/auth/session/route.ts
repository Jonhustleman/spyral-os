/**
 * GET /api/auth/session — Validate token and return user.
 *
 * This is the critical endpoint for session restoration.
 * Called on every page load to verify the cached token is still valid.
 *
 * Token can be provided via:
 *   - Authorization: Bearer <token> header
 *   - ?token=<token> query parameter
 */
import { NextResponse } from "next/server";
import { verifyToken, extractToken } from "../_token";
import { findByEmail } from "../_store";

export const dynamic = "force-dynamic";

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

    // Fetch latest user data from store
    const record = findByEmail(payload.email);

    if (!record) {
      return NextResponse.json({ valid: false, error: "User not found." });
    }

    return NextResponse.json({
      valid: true,
      user: record.user,
    });
  } catch (err) {
    console.error("[auth/session] Error:", err);
    return NextResponse.json({ valid: false, error: "Server error." });
  }
}
