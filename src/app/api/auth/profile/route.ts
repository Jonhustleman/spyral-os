/**
 * GET /api/auth/profile — Get current user profile.
 * PUT /api/auth/profile — Update user profile (name, avatar).
 *
 * Requires Authorization: Bearer <token> header.
 */
import { NextResponse } from "next/server";
import { verifyToken, extractToken } from "../_token";
import { findByEmail, updateUser } from "../_store";

/**
 * GET — Fetch the authenticated user's profile.
 */
export async function GET(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }

    const record = findByEmail(payload.email);
    if (!record) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ user: record.user });
  } catch (err) {
    console.error("[auth/profile] GET Error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

/**
 * PUT — Update the authenticated user's profile.
 */
export async function PUT(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }

    const { name, avatar } = await request.json();
    const updated = updateUser(payload.email, { name, avatar });

    if (!updated) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("[auth/profile] PUT Error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
