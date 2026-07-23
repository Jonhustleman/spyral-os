/**
 * AuthSync — Bridges AuthStore ↔ SpyralSession.
 *
 * AuthStore is the single source of truth for authentication.
 * SpyralSession holds user profile + session data for the app.
 * This utility ensures they stay in sync on login, signup, and page refresh.
 *
 * Designed so Supabase/Auth0/Firebase can replace AuthStore later
 * without changing application code — just swap the adapter.
 */

import { AuthStore } from "./auth.store";
import { SpyralSession } from "@/features/session";

/**
 * Initialize SpyralSession from AuthStore data.
 * Call this when:
 *   - App mounts and user is already authenticated (page refresh)
 *   - After successful login or signup
 *
 * This ensures SpyralSession has the latest user profile
 * and the Memory Engine is initialized.
 */
export function syncAuthToSession(): void {
  // Initialize SpyralSession (loads from localStorage)
  SpyralSession.init();

  // If AuthStore has a logged-in user, ensure SpyralSession knows about them
  const authUser = AuthStore.getUser();
  if (authUser) {
    const existingProfile = SpyralSession.getUser();

    // Only update if SpyralSession doesn't have this user yet
    // or if names/emails differ (profile was updated)
    if (
      !existingProfile ||
      existingProfile.email !== authUser.email ||
      existingProfile.name !== authUser.name
    ) {
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
  }
}
