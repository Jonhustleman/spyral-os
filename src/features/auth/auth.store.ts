/**
 * SPYRAL OS — Auth Store
 *
 * Client-side authentication with localStorage persistence.
 * Supports: email/password signup, login, logout, persistent sessions.
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SpyralUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

interface AuthState {
  user: SpyralUser | null;
  isAuthenticated: boolean;
}

// ─── Storage ───────────────────────────────────────────────────────────────

const AUTH_KEY = "spyral_auth";
const USERS_KEY = "spyral_users";

function loadSession(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return { user: null, isAuthenticated: false };
    const parsed = JSON.parse(raw) as AuthState;
    if (parsed.user && parsed.isAuthenticated) return parsed;
    return { user: null, isAuthenticated: false };
  } catch {
    return { user: null, isAuthenticated: false };
  }
}

function saveSession(state: AuthState): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to persist auth state:", e);
  }
}

function loadUsers(): Record<string, { password: string; user: SpyralUser }> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, { password: string; user: SpyralUser }>): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Failed to persist users:", e);
  }
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Store ─────────────────────────────────────────────────────────────────

type AuthListener = (state: AuthState) => void;

class AuthStoreImpl {
  private state: AuthState;
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    this.state = loadSession();
  }

  // ── Subscriptions ──────────────────────────────────────────────────────

  subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }

  // ── Getters ────────────────────────────────────────────────────────────

  getState(): AuthState {
    return { ...this.state };
  }

  getUser(): SpyralUser | null {
    return this.state.user;
  }

  isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  // ── Commands ───────────────────────────────────────────────────────────

  /**
   * Sign up with email/password.
   * Returns { success, error? }.
   */
  signup(email: string, password: string, name: string): { success: boolean; error?: string } {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password || !name.trim()) {
      return { success: false, error: "All fields are required." };
    }

    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    const users = loadUsers();

    if (users[normalizedEmail]) {
      return { success: false, error: "An account with this email already exists." };
    }

    const user: SpyralUser = {
      id: generateId(),
      email: normalizedEmail,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    users[normalizedEmail] = { password, user };
    saveUsers(users);

    this.state = { user, isAuthenticated: true };
    saveSession(this.state);
    this.notify();

    return { success: true };
  }

  /**
   * Login with email/password.
   * Returns { success, error? }.
   */
  login(email: string, password: string): { success: boolean; error?: string } {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return { success: false, error: "Email and password are required." };
    }

    const users = loadUsers();
    const record = users[normalizedEmail];

    if (!record || record.password !== password) {
      return { success: false, error: "Invalid email or password." };
    }

    this.state = { user: record.user, isAuthenticated: true };
    saveSession(this.state);
    this.notify();

    return { success: true };
  }

  /**
   * Logout and clear session.
   */
  logout(): void {
    this.state = { user: null, isAuthenticated: false };
    saveSession(this.state);
    this.notify();
  }

  /**
   * Update user profile.
   */
  updateProfile(changes: Partial<Pick<SpyralUser, "name" | "avatar">>): void {
    if (!this.state.user) return;

    this.state.user = { ...this.state.user, ...changes };
    saveSession(this.state);

    // Also update in users registry
    const users = loadUsers();
    const record = users[this.state.user.email];
    if (record) {
      record.user = this.state.user;
      saveUsers(users);
    }

    this.notify();
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────────

export const AuthStore = new AuthStoreImpl();
