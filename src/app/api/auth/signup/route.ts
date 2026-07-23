/**
 * POST /api/auth/signup — Create a new account.
 *
 * Transactional: either everything succeeds or everything rolls back.
 * Never leaves half-created accounts.
 */
import { NextResponse } from "next/server";
import { findByEmail, saveUser, deleteUser, hashPassword, generateId } from "../_store";
import { createToken } from "../_token";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // ── Validate ───────────────────────────────────────────────────────
    if (!email || !password || !name?.trim()) {
      return NextResponse.json(
        { success: false, error: "All fields are required." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 1) {
      return NextResponse.json(
        { success: false, error: "Name is required." },
        { status: 400 },
      );
    }

    // Check for existing user
    const existing = findByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    // ── Create user (pre-generate everything before saving) ────────────
    const userId = generateId();
    const { hash, salt } = hashPassword(password);

    const user = {
      id: userId,
      email: normalizedEmail,
      name: trimmedName,
      createdAt: new Date().toISOString(),
    };

    // Create session token BEFORE saving user.
    // If this fails (e.g., AUTH_SECRET missing in production), we never
    // create the user — no orphan accounts.
    let token: string;
    try {
      token = createToken(userId, normalizedEmail, user.name);
    } catch (err) {
      console.error("[auth/signup] Token creation failed:", err);
      return NextResponse.json(
        { success: false, error: "Authentication configuration error. Please contact support." },
        { status: 500 },
      );
    }

    // Now save the user (this is the commit point)
    try {
      saveUser(normalizedEmail, { passwordHash: hash, salt, user });
    } catch (err) {
      console.error("[auth/signup] Failed to save user:", err);
      return NextResponse.json(
        { success: false, error: "Failed to create account. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, user, token });
  } catch (err) {
    console.error("[auth/signup] Error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
