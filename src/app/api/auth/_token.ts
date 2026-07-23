/**
 * Auth Token — HMAC-based session token (no JWT library needed).
 *
 * Token format: base64(payload) . "." . HMAC-SHA256(payload, secret)
 *
 * payload = JSON.stringify({
 *   userId: string,
 *   email: string,
 *   name: string,
 *   iat: number (ms),
 *   exp: number (ms)
 * })
 *
 * Token expiry: 30 days from issuance.
 * Secret comes from AUTH_SECRET env var, falling back to a dev-only default.
 */

import crypto from "crypto";

const TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret(): string {
  // In production, set AUTH_SECRET as an environment variable on Vercel.
  // In development, a deterministic secret is derived from the machine's
  // hostname so tokens survive dev server restarts on the same machine.
  const secret = process.env.AUTH_SECRET || process.env.SPYRAL_AUTH_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET environment variable is required in production. " +
      "Set it in your Vercel project dashboard: Settings → Environment Variables."
    );
  }

  // Dev-only: deterministic secret from machine hostname + package name
  // This ensures tokens survive dev server restarts on the same machine.
  const hostname = (() => {
    try { return require("os").hostname(); } catch { return "localhost"; }
  })();
  const devSecret = `spyral-dev-${crypto.createHash("sha256").update(`spyral-os-${hostname}`).digest("hex").slice(0, 32)}`;
  console.log(
    `[auth] Using dev secret derived from hostname "${hostname}". ` +
    "Set AUTH_SECRET in .env.local for a custom persistent secret."
  );
  return devSecret;
}

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

/**
 * Create a signed session token.
 */
export function createToken(userId: string, email: string, name: string): string {
  const now = Date.now();
  const payload: TokenPayload = {
    userId,
    email,
    name,
    iat: now,
    exp: now + TOKEN_EXPIRY_MS,
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const secret = getSecret();
  const signature = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");

  return `${encoded}.${signature}`;
}

/**
 * Verify and decode a session token.
 * Returns null if the token is invalid or expired.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [encoded, signature] = parts;
    const secret = getSecret();
    const expectedSig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSig.length) return null;
    const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
    if (!valid) return null;

    const decoded = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as TokenPayload;

    // Check expiry
    if (decoded.exp < Date.now()) return null;

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header or query string.
 */
export function extractToken(request: Request): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Fallback to query string (for GET /session)
  const url = new URL(request.url);
  return url.searchParams.get("token");
}
