/**
 * POST /api/auth/signup — Create a new account.
 */
import { NextResponse } from "next/server";
import { findByEmail, saveUser, hashPassword, generateId } from "../_store";
import { createToken } from "../_token";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // Validate
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

    // Check for existing user
    const existing = findByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    // Create user
    const userId = generateId();
    const { hash, salt } = hashPassword(password);

    const user = {
      id: userId,
      email: normalizedEmail,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    saveUser(normalizedEmail, { passwordHash: hash, salt, user });

    // Create session token
    const token = createToken(userId, normalizedEmail, user.name);

    return NextResponse.json({ success: true, user, token });
  } catch (err) {
    console.error("[auth/signup] Error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
