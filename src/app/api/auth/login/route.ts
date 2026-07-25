/**
 * POST /api/auth/login — Authenticate and create session.
 *
 * Token-assisted recovery:
 *   On Vercel serverless, /tmp/ storage can be cleared between requests.
 *   To handle this, the client may include a lastToken from a previous
 *   session. If the user record is not found in the store but the
 *   lastToken is valid and matches the email, the user is re-authenticated
 *   without needing password verification.
 *
 *   This ensures users can always log back in as long as their
 *   session token hasn't expired (30 days).
 */
import { NextResponse } from "next/server";
import { findByEmail, saveUser, verifyPassword } from "../_store";
import { createToken, verifyToken } from "../_token";

/**
 * Attempt token-assisted recovery.
 * Returns { user, token } on success, null on failure.
 */
function tryTokenRecovery(lastToken: string | undefined, normalizedEmail: string) {
  if (!lastToken) return null;

  const payload = verifyToken(lastToken);
  if (!payload || payload.email !== normalizedEmail) return null;

  const user = {
    id: payload.userId,
    email: payload.email,
    name: payload.name,
    createdAt: new Date(payload.iat).toISOString(),
  };

  const newToken = createToken(user.id, normalizedEmail, user.name);
  return { user, token: newToken };
}

export async function POST(request: Request) {
  try {
    const { email, password, lastToken } = await request.json();

    // Validate
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = await findByEmail(normalizedEmail);

    if (record) {
      // User found in store — normal password verification
      const valid = verifyPassword(password, record.passwordHash, record.salt);
      if (valid) {
        // Password verified — create session token
        let token: string;
        try {
          token = createToken(record.user.id, normalizedEmail, record.user.name);
        } catch (err) {
          console.error("[auth/login] Token creation failed:", err);
          return NextResponse.json(
            { success: false, error: "Server error. Please try again." },
            { status: 500 },
          );
        }

        return NextResponse.json({ success: true, user: record.user, token });
      }

      // Password was wrong — BUT if the stored hash is the placeholder
      // (user was recovered from token), try token-assisted recovery
      // as a fallback instead of returning "incorrect password".
      if (record.passwordHash === "TOKEN_RECOVERED") {
        const recovery = tryTokenRecovery(lastToken, normalizedEmail);
        if (recovery) {
          return NextResponse.json({ success: true, user: recovery.user, token: recovery.token });
        }
      }

      return NextResponse.json(
        { success: false, error: "Incorrect password." },
        { status: 401 },
      );
    }

    // ── Fallback: token-assisted recovery ──────────────────────────────
    // User not found in store (Vercel /tmp/ was cleared).
    // If the client provided a lastToken and it's valid, re-authenticate
    // using the token payload instead of requiring the password hash.
    const recovery = tryTokenRecovery(lastToken, normalizedEmail);
    if (recovery) {
      // Re-save the user record to the store so future logins work
      // even without the lastToken. Use a placeholder hash so password
      // verification falls through to token recovery on subsequent logins.
      try {
        await saveUser(normalizedEmail, {
          passwordHash: "TOKEN_RECOVERED",
          salt: "TOKEN_RECOVERED",
          user: recovery.user,
        });
      } catch (err) {
        console.warn("[auth/login] Failed to re-save user after token recovery:", err);
      }

      return NextResponse.json({ success: true, user: recovery.user, token: recovery.token });
    }

    // Could not authenticate — user doesn't exist and no valid recovery token
    return NextResponse.json(
      { success: false, error: "Account not found. Check your email or sign up." },
      { status: 401 },
    );
  } catch (err) {
    console.error("[auth/login] Error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
