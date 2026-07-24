import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Reuse the pool across hot reloads / serverless invocations.
const globalForDb = globalThis as unknown as {
  pool?: Pool;
  db?: NodePgDatabase<typeof schema>;
};

// Local dev Postgres (podman) has no TLS; managed Postgres (Vercel/Neon) requires it.
function isLocalHost(conn: string): boolean {
  try {
    const host = new URL(conn).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return /localhost|127\.0\.0\.1/.test(conn);
  }
}

/**
 * Build the Drizzle client lazily. The connection is not established (and
 * DATABASE_URL is not required) until the first query runs, so importing this
 * module during `next build` page-data collection is side-effect-free.
 */
function createDb(): NodePgDatabase<typeof schema> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool =
    globalForDb.pool ??
    new Pool({
      connectionString,
      ssl: isLocalHost(connectionString) ? false : { rejectUnauthorized: false },
      max: 10,
    });

  if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

  return drizzle(pool, { schema });
}

// Defer initialization until a property is actually accessed at request time.
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const instance = (globalForDb.db ??= createDb());
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { schema };
