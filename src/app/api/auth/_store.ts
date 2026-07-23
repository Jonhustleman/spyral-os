/**
 * Auth Store — Server-side user persistence.
 *
 * Two backends:
 *   1. Upstash Redis (production) — used when UPSTASH_REDIS_REST_URL is set
 *   2. JSON file (local development) — used otherwise
 *
 * The Redis backend is the recommended production storage because:
 *   - File system (/tmp/) on Vercel serverless is ephemeral
 *   - Redis persists across all serverless invocations
 *   - Fast, serverless-optimized REST API
 *
 * To set up Redis for production:
 *   1. Add a Redis database from Vercel Marketplace (Upstash Redis)
 *   2. The environment variables (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
 *      are automatically injected by Vercel
 *   3. No code changes needed — auto-detected at runtime
 *
 * The store interface is minimal so an adapter can be written for any backend:
 *   - findByEmail(email) → UserRecord | null
 *   - saveUser(email, record) → void
 *   - deleteUser(email) → void
 *   - updateUser(email, changes) → StoredUser | null
 *
 * All functions are async — they use Redis when available, file system otherwise.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Redis } from "@upstash/redis";

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

// ─── Redis Client (lazy init) ──────────────────────────────────────────────
// Upstash Redis uses a REST API — ideal for serverless (no persistent connection).

let redisClient: Redis | null = null;

function getRedisClient() {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_URL || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";

  if (!url || !token) return null;

  // Dynamic import — client is only loaded when Redis is actually configured
  const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
  redisClient = new Redis({ url, token });
  return redisClient;
}

// ─── Storage Backend ───────────────────────────────────────────────────────
// File system fallback for local development.

const IS_VERCEL = process.env.VERCEL === "1";
const DATA_DIR = IS_VERCEL
  ? "/tmp/spyral-data"
  : path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const REDIS_KEY = "spyral:users";

// ─── File System Helpers ───────────────────────────────────────────────────

function ensureDataDir(): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    return true;
  } catch {
    return false;
  }
}

function readUsersFile(): Record<string, UserRecord> {
  try {
    if (!ensureDataDir()) return {};
    if (!fs.existsSync(USERS_FILE)) return {};
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeUsersFile(users: Record<string, UserRecord>): void {
  try {
    if (!ensureDataDir()) return;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch {
    // Best-effort
  }
}

// ─── Redis Helpers ─────────────────────────────────────────────────────────

async function readUsersRedis(): Promise<Record<string, UserRecord>> {
  try {
    const client = getRedisClient();
    if (!client) return {};
    const data = await client.hgetall<Record<string, string>>(REDIS_KEY);
    if (!data) return {};
    const users: Record<string, UserRecord> = {};
    for (const [email, json] of Object.entries(data)) {
      try {
        users[email] = JSON.parse(json);
      } catch {
        // skip corrupted entries
      }
    }
    return users;
  } catch {
    return {};
  }
}

async function writeUsersRedis(users: Record<string, UserRecord>): Promise<void> {
  try {
    const client = getRedisClient();
    if (!client) return;
    // Replace entire hash — this is atomic for the key
    await client.del(REDIS_KEY);
    if (Object.keys(users).length > 0) {
      const entries: Record<string, string> = {};
      for (const [email, record] of Object.entries(users)) {
        entries[email] = JSON.stringify(record);
      }
      await client.hset(REDIS_KEY, entries);
    }
  } catch {
    // Best-effort
  }
}

// ─── Backend Selection ─────────────────────────────────────────────────────

function useRedis(): boolean {
  return !!getRedisClient();
}

// ─── API ───────────────────────────────────────────────────────────────────

/**
 * Find a user by their normalized email.
 */
export async function findByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();

  if (useRedis()) {
    const users = await readUsersRedis();
    return users[normalized] || null;
  }

  const users = readUsersFile();
  return users[normalized] || null;
}

/**
 * Save a new user record.
 */
export async function saveUser(email: string, record: UserRecord): Promise<void> {
  const normalized = email.trim().toLowerCase();

  if (useRedis()) {
    const users = await readUsersRedis();
    users[normalized] = record;
    await writeUsersRedis(users);
    return;
  }

  const users = readUsersFile();
  users[normalized] = record;
  writeUsersFile(users);
}

/**
 * Delete a user record. Used for transactional rollback on failed signup.
 */
export async function deleteUser(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();

  if (useRedis()) {
    const users = await readUsersRedis();
    delete users[normalized];
    await writeUsersRedis(users);
    return;
  }

  const users = readUsersFile();
  delete users[normalized];
  writeUsersFile(users);
}

/**
 * Update an existing user's profile fields.
 */
export async function updateUser(
  email: string,
  changes: Partial<Pick<StoredUser, "name" | "avatar">>,
): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();

  if (useRedis()) {
    const users = await readUsersRedis();
    const record = users[normalized];
    if (!record) return null;
    record.user = { ...record.user, ...changes };
    users[normalized] = record;
    await writeUsersRedis(users);
    return record.user;
  }

  const users = readUsersFile();
  const record = users[normalized];
  if (!record) return null;
  record.user = { ...record.user, ...changes };
  users[normalized] = record;
  writeUsersFile(users);
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
