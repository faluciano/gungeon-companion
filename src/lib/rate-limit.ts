import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

interface Rule {
  window: number; // seconds
  max: number;
}

/**
 * Fixed-window rate limiter for the run-mutation routes, keyed per user and
 * backed by the shared `rate_limit` table (same one better-auth uses, with a
 * distinct key prefix so buckets never collide with the auth limiter's
 * `ip|path` keys).
 *
 * The conditional UPDATE only matches when the request is allowed (window
 * expired, or still under `max`), so row-level locking makes concurrent
 * requests serialize correctly — a "no rows updated" result on an existing
 * row is an unambiguous denial, never a lost race.
 */
export async function checkRateLimit(
  key: string,
  rule: Rule,
  attempt = 0,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const now = Date.now();
  const windowMs = rule.window * 1000;

  const updated = await db.execute(sql`
    update "rate_limit" set
      "count" = case
        when ${now} - "last_request" > ${windowMs} then 1
        else "count" + 1
      end,
      "last_request" = ${now}
    where "key" = ${key}
      and (${now} - "last_request" > ${windowMs} or "count" < ${rule.max})
    returning "count"
  `);
  if (updated.rows.length > 0) return { allowed: true, retryAfter: 0 };

  const inserted = await db.execute(sql`
    insert into "rate_limit" ("id", "key", "count", "last_request")
    values (gen_random_uuid()::text, ${key}, 1, ${now})
    on conflict ("key") do nothing
    returning "key"
  `);
  if (inserted.rows.length > 0) return { allowed: true, retryAfter: 0 };

  const existing = await db.execute<{ count: number; last_request: string }>(
    sql`select "count", "last_request" from "rate_limit" where "key" = ${key}`,
  );
  const row = existing.rows[0];
  const lastRequest = Number(row?.last_request ?? 0);
  if (row && Number(row.count) >= rule.max && now - lastRequest <= windowMs) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((lastRequest + windowMs - now) / 1000)),
    };
  }

  // The row changed between our statements (concurrent insert won the race,
  // or the window expired mid-flight). Re-run; the UPDATE will match now.
  if (attempt < 2) return checkRateLimit(key, rule, attempt + 1);
  return { allowed: false, retryAfter: 1 };
}

/**
 * Returns a 429 response if the user is over the limit, or null to proceed.
 */
export async function enforceRateLimit(
  key: string,
  rule: Rule,
): Promise<NextResponse | null> {
  const { allowed, retryAfter } = await checkRateLimit(key, rule);
  if (allowed) return null;
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": retryAfter.toString() } },
  );
}
