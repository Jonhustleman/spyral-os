/**
 * AuthSync — Bridges AuthStore ↔ SpyralSession.
 *
 * AuthStore (backed by server API) is the single source of truth
 * for authentication (who the user is).
 *
 * SpyralSession holds extended user profile + session data for the app
 * (what the user is doing, their preferences, etc.).
 *
 * This utility ensures:
 *   - On login, signup, and page refresh: AuthStore identity is propagated
 *     to SpyralSession without overwriting extended profile fields.
 *   - SpyralSession never has a different identity than AuthStore.
 *
 * Architecture:
 *   AuthService → AuthStore (auth truth) → syncAuthToSession() → SpyralSession (profile + session)
 *                                                                     ↓
 *                                                               MemoryEngine (identity)
 *
 * Designed so Supabase/Auth0/Firebase can replace AuthService later
 * without changing application code — just swap the adapter.
 */

import { AuthStore } from "./auth.store";
import { SpyralSession } from "@/features/session";

/**
 * Initialize SpyralSession from AuthStore data.
 *
 * Call this when:
 *   - App mounts and user is already authenticated (page refresh)
 *   - After successful login or signup
 *
 * This ensures:
 *   1. SpyralSession has the latest name/email from AuthStore
 *   2. Extended profile fields (role, company, preferences) are preserved
 *   3. Memory Engine identity is initialized
 */
export function syncAuthToSession(): void {
  const authUser = AuthStore.getUser();
  if (!authUser) return;

  // Initialize SpyralSession (loads from localStorage)
  SpyralSession.init();

  // Get existing SpyralSession profile (preserves extended fields)
  const existingProfile = SpyralSession.getUser();

  // Always sync name and email from AuthStore (the auth source of truth)
  // Preserve extended profile fields that AuthStore doesn't track
  SpyralSession.setUser({
    name: authUser.name,
    email: authUser.email,
    role: existingProfile?.role || "",
    company: existingProfile?.company || "",
    industry: existingProfile?.industry || "",
    mainGoals: existingProfile?.mainGoals || "",
    currentProjects: existingProfile?.currentProjects || "",
    thinkingPreference: existingProfile?.thinkingPreference || "",
    writingPreference: existingProfile?.writingPreference || "",
    timezone: existingProfile?.timezone || "",
    teamOrSolo: existingProfile?.teamOrSolo || "",
    experienceLevel: existingProfile?.experienceLevel || "",
    onboarded: existingProfile?.onboarded || false,
    joinedAt: existingProfile?.joinedAt || Date.now(),
  });
}
