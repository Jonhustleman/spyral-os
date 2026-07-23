/**
 * ApiAuthService — AuthService implementation using Next.js API routes.
 *
 * Calls the local API at /api/auth/* endpoints.
 * Can be swapped for SupabaseAuthService or FirebaseAuthService later.
 *
 * Token caching:
 *   - On login/signup, the token is stored in localStorage (key: spyral_token).
 *   - On app startup, validateSession() checks the token against the server.
 *   - If the server returns valid=true, the session is restored.
 *   - If the server returns valid=false, the token is cleared.
 *
 * This ensures localStorage is ONLY a cache — the server is the source of truth.
 */

import type { AuthService, LoginResult, SignupResult, AuthResult } from "./AuthService";

const TOKEN_KEY = "spyral_token";

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  return data as T;
}

class ApiAuthServiceImpl implements AuthService {
  // ─── Token Management ─────────────────────────────────────────────────

  /**
   * Get the cached token from localStorage.
   */
  getCachedToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Cache the token in localStorage.
   */
  private cacheToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // localStorage may be unavailable (private browsing, etc.)
    }
  }

  /**
   * Clear the cached token.
   */
  private clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // noop
    }
  }

  // ─── Auth Operations ──────────────────────────────────────────────────

  async signup(email: string, password: string, name: string): Promise<SignupResult> {
    const result = await api<SignupResult>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });

    if (result.success && result.token) {
      this.cacheToken(result.token);
    }

    return result;
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const result = await api<LoginResult>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (result.success && result.token) {
      this.cacheToken(result.token);
    }

    return result;
  }

  async logout(): Promise<AuthResult> {
    const token = this.getCachedToken();
    this.clearToken();

    if (token) {
      // Fire-and-forget: tell server to invalidate (best-effort)
      api("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ token }),
      }).catch(() => {});
    }

    return { success: true };
  }

  async validateSession(token: string): Promise<{ user: LoginResult["user"] } | null> {
    const result = await api<{ valid: boolean; user?: LoginResult["user"]; error?: string }>(
      `/api/auth/session?token=${encodeURIComponent(token)}`,
    );

    if (result.valid && result.user) {
      return { user: result.user };
    }

    // Token invalid/expired — clear cache
    this.clearToken();
    return null;
  }

  async getProfile(token: string): Promise<LoginResult["user"] | null> {
    const result = await api<{ user?: LoginResult["user"]; error?: string }>(
      "/api/auth/profile",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    return result.user || null;
  }

  async updateProfile(
    token: string,
    changes: { name?: string; avatar?: string },
  ): Promise<AuthResult & { user?: LoginResult["user"] }> {
    const result = await api<{ user?: LoginResult["user"]; error?: string }>(
      "/api/auth/profile",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(changes),
      },
    );

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true, user: result.user };
  }

  async requestPasswordReset(email: string): Promise<AuthResult> {
    // Future: implement with email service
    // For now, return success to avoid leaking user existence
    return { success: true };
  }

  async resetPassword(_token: string, _newPassword: string): Promise<AuthResult> {
    // Future: implement with email service
    return { success: false, error: "Password reset is not yet available." };
  }
}

export const ApiAuthService = new ApiAuthServiceImpl();
