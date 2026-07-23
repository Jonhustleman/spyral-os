/**
 * SPYRAL OS — Auth Store
 *
 * Client-side authentication cache.
 *
 * Architecture:
 *   AuthService (interface) ← ApiAuthService → Next.js API routes → File store
 *                                         ↕
 *   AuthStore (client cache, localStorage)
 *
 * AuthStore is a SYNCHRONOUS cache for React components to read.
 * The actual source of truth is the SERVER (API routes).
 * localStorage is ONLY a cache — if the server says a token is invalid,
 * the cache is cleared.
 *
 * Flow:
 *   1. App mounts → AuthStore.init() validates cached token against server
 *   2. User logs in → API validates credentials → returns token → cache it
 *   3. User refreshes → AuthStore.init() validates cached token → restore or clear
 *   4. User logs out → clear cache → tell server (best-effort)
 */

import type { AuthService, LoginResult } from "./AuthService";
import { ApiAuthService } from "./AuthServiceImpl";

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

// ─── Storage (cache only — not source of truth) ────────────────────────────

const AUTH_KEY = "spyral_auth";

function loadCachedSession(): AuthState {
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

function saveCachedSession(state: AuthState): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable
  }
}

function clearCachedSession(): void {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    // noop
  }
}

// ─── Store ─────────────────────────────────────────────────────────────────

type AuthListener = (state: AuthState) => void;

class AuthStoreImpl {
  private state: AuthState;
  private listeners: Set<AuthListener> = new Set();
  private _initialized = false;
  private _initPromise: Promise<void> | null = null;

  constructor() {
    // Load from localStorage cache on construction (synchronous for first render)
    this.state = loadCachedSession();
  }

  // ── Initialization ────────────────────────────────────────────────────

  /**
   * Initialize auth — validate cached token against the server.
   *
   * Call this once when the app mounts (in AppShell or layout).
   * - If the server validates the token, the session is confirmed.
   * - If the server rejects the token, the cache is cleared.
   *
   * Returns a promise that resolves when validation is complete.
   */
  async init(): Promise<void> {
    if (this._initPromise) return this._initPromise;

    this._initPromise = this._doInit().finally(() => {
      this._initialized = true;
    });

    return this._initPromise;
  }

  private async _doInit(): Promise<void> {
    const cachedToken = ApiAuthService.getCachedToken();

    if (!cachedToken) {
      // No cached token — user is not authenticated
      if (this.state.isAuthenticated) {
        // Cache says authenticated but no token — inconsistency. Clear.
        this.state = { user: null, isAuthenticated: false };
        clearCachedSession();
        this.notify();
      }
      return;
    }

    // Validate the cached token against the server
    const session = await ApiAuthService.validateSession(cachedToken);

    if (session && session.user) {
      // Token is valid — restore the session
      const user: SpyralUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        avatar: session.user.avatar,
        createdAt: session.user.createdAt,
      };
      this.state = { user, isAuthenticated: true };
      saveCachedSession(this.state);
    } else {
      // Token is invalid/expired — clear everything
      this.state = { user: null, isAuthenticated: false };
      clearCachedSession();
    }

    this.notify();
  }

  /**
   * Whether init() has completed.
   */
  get initialized(): boolean {
    return this._initialized;
  }

  /**
   * Wait for initialization to complete.
   */
  async ready(): Promise<void> {
    if (this._initialized) return;
    return this.init();
  }

  // ── Subscriptions ─────────────────────────────────────────────────────

  subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }

  // ── Getters (synchronous — read from cache) ───────────────────────────

  getState(): AuthState {
    return { ...this.state };
  }

  getUser(): SpyralUser | null {
    return this.state.user;
  }

  isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  // ── Commands (async — call API first, then cache) ─────────────────────

  /**
   * Sign up with email/password.
   * Calls the API — the server is the source of truth.
   */
  async signup(email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
    const result = await ApiAuthService.signup(email, password, name);

    if (result.success && result.user) {
      const user: SpyralUser = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        avatar: result.user.avatar,
        createdAt: result.user.createdAt,
      };
      this.state = { user, isAuthenticated: true };
      saveCachedSession(this.state);
      this.notify();
    }

    return result;
  }

  /**
   * Login with email/password.
   * Calls the API — the server validates credentials.
   */
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const result = await ApiAuthService.login(email, password);

    if (result.success && result.user) {
      const user: SpyralUser = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        avatar: result.user.avatar,
        createdAt: result.user.createdAt,
      };
      this.state = { user, isAuthenticated: true };
      saveCachedSession(this.state);
      this.notify();
    }

    return result;
  }

  /**
   * Logout and clear session.
   */
  async logout(): Promise<void> {
    await ApiAuthService.logout();
    this.state = { user: null, isAuthenticated: false };
    clearCachedSession();
    this.notify();
  }

  /**
   * Update user profile.
   */
  async updateProfile(changes: Partial<Pick<SpyralUser, "name" | "avatar">>): Promise<void> {
    if (!this.state.user) return;

    const token = ApiAuthService.getCachedToken();
    if (!token) return;

    const result = await ApiAuthService.updateProfile(token, changes);

    if (result.user) {
      this.state.user = {
        ...this.state.user,
        name: result.user.name ?? this.state.user.name,
        avatar: result.user.avatar ?? this.state.user.avatar,
      };
      saveCachedSession(this.state);
      this.notify();
    }
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────────

export const AuthStore = new AuthStoreImpl();
