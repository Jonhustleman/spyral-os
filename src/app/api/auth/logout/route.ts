/**
 * POST /api/auth/logout — Invalidate session.
 *
 * Note: With stateless tokens, we can't truly invalidate on the server
 * without a blocklist. For the pilot, logout simply means the client
 * discards the token. This endpoint exists for future server-side
 * session management when a database-backed blacklist is added.
 *
 * When migrating to Supabase/Auth0/Firebase, this will call their
 * revoke endpoint instead.
 */
import { NextResponse } from "next/server";

export async function POST() {
  // For now, logout is client-side only (token removal).
  // With Supabase/Auth0: call auth.revokeSession(token) here.
  return NextResponse.json({ success: true });
}
