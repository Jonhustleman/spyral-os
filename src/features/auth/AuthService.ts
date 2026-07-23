/**
 * AuthService — Abstract authentication interface.
 *
 * All authentication operations go through this interface.
 * This allows swapping the backend (Supabase, Firebase, Auth0, Clerk, custom API)
 * without changing any application code.
 *
 * The current implementation (ApiAuthService) calls Next.js API routes.
 * To switch to Supabase: implement SupabaseAuthService using @supabase/supabase-js.
 * To switch to Firebase: implement FirebaseAuthService using firebase/auth.
 */

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface LoginResult extends AuthResult {
  user?: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    createdAt: string;
  };
  /** Session token — cached in localStorage for session restoration */
  token?: string;
}

export interface SignupResult extends LoginResult {}

export interface AuthService {
  /**
   * Create a new account.
   * On success, returns user + token (auto-login after signup).
   */
  signup(email: string, password: string, name: string): Promise<SignupResult>;

  /**
   * Authenticate with email/password.
   * On success, returns user + token.
   */
  login(email: string, password: string): Promise<LoginResult>;

  /**
   * End the current session.
   */
  logout(): Promise<AuthResult>;

  /**
   * Validate a session token and return the user.
   * Called on app startup to verify the cached token is still valid.
   * Returns null if the token is invalid/expired.
   */
  validateSession(token: string): Promise<{ user: LoginResult["user"] } | null>;

  /**
   * Get the current user's profile.
   */
  getProfile(token: string): Promise<LoginResult["user"] | null>;

  /**
   * Update the current user's profile.
   */
  updateProfile(
    token: string,
    changes: { name?: string; avatar?: string },
  ): Promise<AuthResult & { user?: LoginResult["user"] }>;

  /**
   * Request a password reset email.
   */
  requestPasswordReset(email: string): Promise<AuthResult>;

  /**
   * Confirm a password reset with a reset token.
   */
  resetPassword(token: string, newPassword: string): Promise<AuthResult>;
}
