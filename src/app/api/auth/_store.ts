/**
 * Auth Store — Server-side user persistence.
 *
 * Uses a JSON file for development (persists across server restarts).
 * Falls back to in-memory storage if filesystem is unavailable (Vercel).
 *
 * Designed to be swapped for Vercel KV / Supabase / Firebase in production
 * without changing the API route handlers.
 *
 * The store interface is minimal so an adapter can be written for any backend:
 *   - findByEmail(email) → UserRecord | null
 *   - save(record) → void
 *   - update(email, changes) → void
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface UserRecord {
  passwordHash: string;
  salt: string;
  user: StoredUser;
}

// ─── Storage Backend ───────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// In-memory fallback for environments where filesystem is read-only (Vercel)
let memoryStore: Record<string, UserRecord> | null = null;
let useMemoryFallback = false;

function ensureDataDir(): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    return true;
  } catch {
    // Filesystem not writable (e.g., Vercel production) — use in-memory
    useMemoryFallback = true;
    if (!memoryStore) memoryStore = {};
    return false;
  }
}

function readUsers(): Record<string, UserRecord> {
  if (useMemoryFallback) return memoryStore || {};

  try {
    ensureDataDir();
    if (!fs.existsSync(USERS_FILE)) return {};
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, UserRecord>): void {
  if (useMemoryFallback) {
    memoryStore = users;
    return;
  }

  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch {
    // Fall back to in-memory
    useMemoryFallback = true;
    memoryStore = users;
  }
}

// ─── API ───────────────────────────────────────────────────────────────────

/**
 * Find a user by their normalized email.
 */
export function findByEmail(email: string): UserRecord | null {
  const users = readUsers();
  const normalized = email.trim().toLowerCase();
  return users[normalized] || null;
}

/**
 * Save a new user record.
 */
export function saveUser(email: string, record: UserRecord): void {
  const users = readUsers();
  const normalized = email.trim().toLowerCase();
  users[normalized] = record;
  writeUsers(users);
}

/**
 * Update an existing user's profile fields.
 */
export function updateUser(
  email: string,
  changes: Partial<Pick<StoredUser, "name" | "avatar">>,
): StoredUser | null {
  const users = readUsers();
  const normalized = email.trim().toLowerCase();
  const record = users[normalized];
  if (!record) return null;

  record.user = { ...record.user, ...changes };
  users[normalized] = record;
  writeUsers(users);

  return record.user;
}

// ─── Password Hashing ──────────────────────────────────────────────────────

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 }; // OWASP-recommended minimum

/**
 * Hash a password with a random salt using scrypt.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH, SCRYPT_PARAMS).toString("hex");
  return { hash, salt };
}

/**
 * Verify a password against a stored hash and salt.
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computed = crypto.scryptSync(password, salt, KEY_LENGTH, SCRYPT_PARAMS).toString("hex");
  // Constant-time comparison
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

/**
 * Generate a unique user ID.
 */
export function generateId(): string {
  return crypto.randomUUID();
}
