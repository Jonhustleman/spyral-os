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
 *
 * Secret resolution order:
 *   1. AUTH_SECRET env var (explicitly set by developer)
 *   2. SPYRAL_AUTH_SECRET env var (legacy)
 *   3. Vercel-injected vars (production fallback — stable across redeploys)
 *   4. Machine hostname (dev fallback — survives restart)
 */

import crypto from "crypto";

const TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret(): string {
  // 1. Explicitly configured secret (highest priority)
  const configuredSecret = process.env.AUTH_SECRET || process.env.SPYRAL_AUTH_SECRET;
  if (configuredSecret) return configuredSecret;

  // 2. Production fallback: derive from Vercel-injected environment variables.
  //    VERCEL_GIT_REPO_SLUG + VERCEL_GIT_REPO_OWNER are stable across
  //    redeploys (unlike VERCEL_URL which changes per deployment).
  //    This ensures tokens survive redeployment without explicitly setting AUTH_SECRET.
  const repoSlug = process.env.VERCEL_GIT_REPO_SLUG;
  const repoOwner = process.env.VERCEL_GIT_REPO_OWNER;
  if (repoSlug && repoOwner) {
    const stableSeed = `spyral-${repoOwner}-${repoSlug}`;
    console.log(
      `[auth] Using production fallback secret derived from "${repoOwner}/${repoSlug}". ` +
      "For security, set AUTH_SECRET in your Vercel project dashboard."
    );
    return `spyral-fallback-${crypto.createHash("sha256").update(stableSeed).digest("hex").slice(0, 32)}`;
  }

  // 3. Development fallback: deterministic secret from machine hostname
  const hostname = (() => {
    try { return require("os").hostname(); } catch { return "localhost"; }
  })();
  const devSecret = `spyral-dev-${crypto.createHash("sha256").update(`spyral-os-${hostname}`).digest("hex").slice(0, 32)}`;
  console.log(
    `[auth] Using dev secret derived from hostname "${hostname}". ` +
    "Tokens survive dev server restarts on the same machine. " +
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
