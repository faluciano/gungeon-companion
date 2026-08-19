import {
  pgTable,
  text,
  boolean,
  integer,
  bigint,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/*                              Better Auth tables                            */
/* -------------------------------------------------------------------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const passkey = pgTable("passkey", {
  id: text("id").primaryKey(),
  name: text("name"),
  publicKey: text("public_key").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  credentialID: text("credential_id").notNull(),
  counter: integer("counter").notNull(),
  deviceType: text("device_type").notNull(),
  backedUp: boolean("backed_up").notNull(),
  transports: text("transports"),
  aaguid: text("aaguid"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shared by better-auth's `storage: "database"` rate limiter (model name
// "rateLimit") and the per-user limiter in src/lib/rate-limit.ts. The `key`
// primary key makes concurrent first-inserts conflict instead of duplicating.
export const rateLimit = pgTable("rate_limit", {
  // better-auth's adapter requires an `id` field on every model.
  id: text("id").primaryKey(),
  // Unique so concurrent first-inserts for a bucket conflict instead of
  // duplicating.
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

/* -------------------------------------------------------------------------- */
/*                              Per-user run state                            */
/* -------------------------------------------------------------------------- */

export const run = pgTable(
  "run",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    character: text("character"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("run_user_idx").on(t.userId)],
);

export const runItem = pgTable(
  "run_item",
  {
    runId: text("run_id")
      .notNull()
      .references(() => run.id, { onDelete: "cascade" }),
    // Slug into the bundled dataset (src/lib/data/dataset.json) — game
    // reference data lives in the app bundle, not in Postgres.
    itemId: text("item_id").notNull(),
    // Only meaningful for stackable items (Junk family — see STACKABLE_IDS);
    // everything else stays at 1.
    quantity: integer("quantity").notNull().default(1),
    acquiredAt: timestamp("acquired_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.runId, t.itemId] })],
);

/* -------------------------------------------------------------------------- */
/*                                 Relations                                  */
/* -------------------------------------------------------------------------- */

export const runRelations = relations(run, ({ many, one }) => ({
  items: many(runItem),
  user: one(user, { fields: [run.userId], references: [user.id] }),
}));

export const runItemRelations = relations(runItem, ({ one }) => ({
  run: one(run, { fields: [runItem.runId], references: [run.id] }),
}));

export type Run = typeof run.$inferSelect;
