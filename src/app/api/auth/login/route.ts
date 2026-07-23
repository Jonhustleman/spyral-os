/**
 * POST /api/auth/login — Authenticate and create session.
 */
import { NextResponse } from "next/server";
import { findByEmail, verifyPassword } from "../_store";
import { createToken } from "../_token";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = findByEmail(normalizedEmail);

    if (!record) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 },
      );
    }

    // Verify password (constant-time)
    const valid = verifyPassword(password, record.passwordHash, record.salt);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 },
      );
    }

    // Create session token
    const token = createToken(record.user.id, normalizedEmail, record.user.name);

    return NextResponse.json({ success: true, user: record.user, token });
  } catch (err) {
    console.error("[auth/login] Error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
