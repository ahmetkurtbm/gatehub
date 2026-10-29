import "server-only";

import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import { hashPassword } from "better-auth/crypto";
import { PGliteDialect } from "kysely-pglite-dialect";
import { Pool } from "pg";

/**
 * Plain SQL instead of an ORM. The same queries run on:
 *  - DATABASE_URL set   → PostgreSQL through `pg` (local Docker). Schema comes
 *                          from db/migrations via `npm run db:setup`.
 *  - DATABASE_URL empty → demo mode: PGlite (Postgres in WASM) inside the
 *                          server process, migrated and seeded with a demo
 *                          account on first use. The public Vercel demo.
 *
 * better-auth talks to the same database: a pg Pool in real mode, a Kysely
 * dialect wrapping PGlite in demo mode.
 */

export const DEMO_ACCOUNT = { email: "demo@gatehub.dev", password: "DemoGateHub2026", name: "Demo Yönetici" };

export function isDemoMode() {
  return !process.env.DATABASE_URL;
}

type Result = { rows: Record<string, unknown>[] };
type Queryable = { query(sql: string, params?: unknown[]): Promise<Result> };

const DB_DIR = join(process.cwd(), "db");

async function seedDemo(db: PGlite) {
  const now = new Date();
  const userId = randomUUID();
  await db.query(
    `insert into "user" ("id", "name", "email", "emailVerified", "role", "createdAt", "updatedAt") values ($1, $2, $3, true, 'admin', $4, $4)`,
    [userId, DEMO_ACCOUNT.name, DEMO_ACCOUNT.email, now],
  );
  await db.query(
    `insert into "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt") values ($1, $2, 'credential', $2, $3, $4, $4)`,
    [randomUUID(), userId, await hashPassword(DEMO_ACCOUNT.password), now],
  );
}

const cache = globalThis as { __gatehubDemo?: Promise<PGlite>; __gatehubPool?: Pool };

function demoDatabase() {
  cache.__gatehubDemo ??= (async () => {
    const { PGlite } = await import("@electric-sql/pglite");
    const db = await PGlite.create();
    const migrations = readdirSync(join(DB_DIR, "migrations")).filter((f) => f.endsWith(".sql")).sort();
    for (const name of migrations) await db.exec(readFileSync(join(DB_DIR, "migrations", name), "utf8"));
    await seedDemo(db);
    return db;
  })();
  return cache.__gatehubDemo;
}

function pool() {
  cache.__gatehubPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return cache.__gatehubPool;
}

/** Waits for the demo database (migrations + seed) before every query. */
const demoClient: Queryable & { close(): Promise<void> } = {
  query: async (sql, params) => (await demoDatabase()).query(sql, params) as Promise<Result>,
  close: async () => {},
};

export const authDatabase = isDemoMode()
  ? { dialect: new PGliteDialect(demoClient as unknown as PGlite), type: "postgres" as const }
  : pool();

export async function query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
  const client: Queryable = isDemoMode() ? demoClient : pool();
  return (await client.query(sql, params)).rows as T[];
}

/** better-auth stores string[] fields as JSON text (see db/migrations/001_init.sql). */
export function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
