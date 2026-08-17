import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { passkey } from "@better-auth/passkey";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, schema } from "@/lib/db";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const rpID = new URL(baseURL).hostname;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const auth = betterAuth({
  appName: "Gungeon Companion",
  baseURL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  rateLimit: {
    // Default is production-only; enable everywhere so limits are testable
    // locally and never silently off.
    enabled: true,
    // Per-IP-per-path default for all auth endpoints.
    window: 60,
    max: 60,
    // Memory storage is per-instance (useless on serverless); persist counters
    // in Postgres via the `rateLimit` model instead.
    storage: "database",
    customRules: {
      // Registration creates rows in `user` (resolveUser with
      // requireSession: false), so keep it strict to prevent table-filling.
      "/passkey/generate-register-options": { window: 60, max: 3 },
      "/passkey/verify-registration": { window: 60, max: 3 },
      // Sign-in: slightly looser, still tight enough to blunt abuse.
      "/passkey/generate-authenticate-options": { window: 60, max: 10 },
      "/passkey/verify-authentication": { window: 60, max: 10 },
    },
  },
  advanced: {
    ipAddress: {
      // Vercel sets x-real-ip to the client address as a single value, which
      // is required for the resolver to trust a forwarded header without a
      // trustedProxies list (multi-hop x-forwarded-for chains are rejected).
      ipAddressHeaders: ["x-real-ip", "x-forwarded-for"],
    },
  },
  session: {
    // Serve session reads from a short-lived signed cookie instead of a
    // Postgres lookup on every request.
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [
    passkey({
      rpID,
      rpName: "Gungeon Companion",
      origin: baseURL,
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
      registration: {
        // Passkey-first onboarding: no password/session needed to sign up.
        requireSession: false,
        // `context` carries the email the user typed during sign-up.
        resolveUser: async ({ context }) => {
          const email = String(context ?? "")
            .trim()
            .toLowerCase();

          if (!EMAIL_RE.test(email)) {
            throw new Error("Please enter a valid email address.");
          }

          const existing = await db
            .select({ id: schema.user.id })
            .from(schema.user)
            .where(eq(schema.user.email, email))
            .limit(1);

          if (existing.length > 0) {
            // Never attach a new passkey to an existing account this way —
            // that would allow account takeover. Existing users sign in instead.
            throw new Error(
              "An account with this email already exists. Sign in with your passkey.",
            );
          }

          const id = randomUUID();
          const name = email.split("@")[0];
          await db.insert(schema.user).values({ id, email, name, emailVerified: false });

          return { id, name };
        },
      },
    }),
    // Must be the last plugin so it can persist cookies from server actions.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
