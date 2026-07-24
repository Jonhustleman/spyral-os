/**
 * POST /api/auth/signup — Create a new account.
 *
 * Transactional: either everything succeeds or everything rolls back.
 * Never leaves half-created accounts.
 *
 * Token-assisted duplicate detection:
 *   The client may include a lastToken from a previous session. If the
 *   store is unavailable (Vercel /tmp/ cleared) but the lastToken is
 *   valid and matches the email, we treat it as a duplicate account
 *   and reject the signup. This prevents creating multiple accounts
 *   with the same email when the store is empty.
 */
import { NextResponse } from "next/server";
import { findByEmail, saveUser, deleteUser, hashPassword, generateId } from "../_store";
import { createToken, verifyToken } from "../_token";

export async function POST(request: Request) {
  try {
    const { email, password, name, lastToken } = await request.json();

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

    // Check for existing user in store
    const existing = await findByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    // Token-assisted duplicate detection: if the store is empty but the
    // client has a valid token for this email, treat it as duplicate.
    if (lastToken) {
      const payload = verifyToken(lastToken);
      if (payload && payload.email === normalizedEmail) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists." },
          { status: 409 },
        );
      }
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
        { success: false, error: "Server error. Please try again." },
        { status: 500 },
      );
    }

    // Now save the user (this is the commit point)
    try {
      await saveUser(normalizedEmail, { passwordHash: hash, salt, user });
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
