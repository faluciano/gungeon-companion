import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Reuse the pool across hot reloads / serverless invocations.
const globalForDb = globalThis as unknown as { pool?: Pool };

// Local dev Postgres (podman) has no TLS; managed Postgres (Vercel/Neon) requires it.
function isLocalHost(conn: string): boolean {
  try {
    const host = new URL(conn).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return /localhost|127\.0\.0\.1/.test(conn);
  }
}

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString,
    ssl: isLocalHost(connectionString) ? false : { rejectUnauthorized: false },
    max: 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
export { schema };
