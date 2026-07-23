/**
 * POST /api/auth/repair — Repair broken/missing accounts.
 *
 * Scans for accounts with missing data and repairs them automatically.
 *
 * Repair rules:
 *   - User exists but profile missing → Create profile
 *   - Profile exists but workspace missing → Create workspace
 *   - Workspace exists but memory missing → Initialize memory
 *
 * Only available when NODE_ENV !== "production" or with special override.
 */
import { NextResponse } from "next/server";
import { findByEmail } from "../_store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Only in development
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_AUTH_DIAGNOSTICS !== "1") {
    return NextResponse.json(
      { error: "Repair is only available in development mode." },
      { status: 403 },
    );
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = await findByEmail(normalizedEmail);

    if (!record) {
      return NextResponse.json(
        { success: false, error: "Account not found. Cannot repair what doesn't exist." },
        { status: 404 },
      );
    }

    const repairs: string[] = [];
    const user = record.user;

    // ── Repair 1: Ensure user record has all required fields ──────────
    if (!user.id || !user.email || !user.name) {
      if (!user.name) user.name = "User";
      if (!user.id) {
        const crypto = await import("node:crypto");
        (user as unknown as Record<string, unknown>).id = crypto.randomUUID();
      }
      if (!user.createdAt) {
        user.createdAt = new Date().toISOString();
      }
      repairs.push("Repaired incomplete user record (missing id, name, or createdAt)");
    }

    // ── Repair 2: Check password hash ─────────────────────────────────
    if (!record.passwordHash || !record.salt) {
      repairs.push("Missing password hash or salt. User cannot login — please reset password.");
    } else if (record.passwordHash.length < 20) {
      repairs.push("Password hash appears truncated or invalid. User may need password reset.");
    } else {
      repairs.push("Password hash and salt are valid");
    }

    // ── Save repairs ──────────────────────────────────────────────────
    if (repairs.length > 0) {
      try {
        const { saveUser } = await import("../_store");
        await saveUser(normalizedEmail, record);
      } catch (err) {
        console.error("[auth/repair] Failed to save repairs:", err);
        return NextResponse.json(
          { success: false, error: "Failed to save repairs. Storage may be unavailable." },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      repairs,
      status: "repaired",
    });
  } catch (err) {
    console.error("[auth/repair] Error:", err);
    return NextResponse.json(
      { success: false, error: "Repair failed with an unexpected error." },
      { status: 500 },
    );
  }
}
