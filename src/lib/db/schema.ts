import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
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

/* -------------------------------------------------------------------------- */
/*                            Gungeon reference data                          */
/* -------------------------------------------------------------------------- */

export const itemType = pgEnum("item_type", ["gun", "passive", "active"]);
export const itemQuality = pgEnum("item_quality", ["D", "C", "B", "A", "S", "N"]);

// Static game data: guns and items. `id` is a stable human-readable slug.
export const item = pgTable(
  "item",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: itemType("type").notNull(),
    quality: itemQuality("quality").notNull(),
    description: text("description").notNull(),
    // In-game flavour text ("blurb"), shown as a stylised quote.
    quote: text("quote"),
    // Ammonomicon icon URL (hotlinked from the community wiki CDN).
    imageUrl: text("image_url"),
  },
  (t) => [index("item_name_idx").on(t.name)],
);

// A named synergy with a gameplay effect description.
// A synergy is ACTIVE when the number of distinct satisfied component groups
// (see synergyComponent.groupIndex) is >= requiredGroups. Items within the same
// group are interchangeable alternatives (OR).
export const synergy = pgTable("synergy", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  effect: text("effect").notNull(),
  requiredGroups: integer("required_groups").notNull().default(2),
});

// Components of a synergy. Items sharing the same `groupIndex` are alternatives
// (OR); every distinct group must be satisfied for the synergy to be active (AND).
export const synergyComponent = pgTable(
  "synergy_component",
  {
    synergyId: text("synergy_id")
      .notNull()
      .references(() => synergy.id, { onDelete: "cascade" }),
    itemId: text("item_id")
      .notNull()
      .references(() => item.id, { onDelete: "cascade" }),
    groupIndex: integer("group_index").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.synergyId, t.itemId] }),
    index("synergy_component_item_idx").on(t.itemId),
  ],
);

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
    itemId: text("item_id")
      .notNull()
      .references(() => item.id, { onDelete: "cascade" }),
    acquiredAt: timestamp("acquired_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.runId, t.itemId] })],
);

/* -------------------------------------------------------------------------- */
/*                                 Relations                                  */
/* -------------------------------------------------------------------------- */

export const synergyRelations = relations(synergy, ({ many }) => ({
  components: many(synergyComponent),
}));

export const synergyComponentRelations = relations(synergyComponent, ({ one }) => ({
  synergy: one(synergy, {
    fields: [synergyComponent.synergyId],
    references: [synergy.id],
  }),
  item: one(item, {
    fields: [synergyComponent.itemId],
    references: [item.id],
  }),
}));

export const itemRelations = relations(item, ({ many }) => ({
  synergyComponents: many(synergyComponent),
  runItems: many(runItem),
}));

export const runRelations = relations(run, ({ many, one }) => ({
  items: many(runItem),
  user: one(user, { fields: [run.userId], references: [user.id] }),
}));

export const runItemRelations = relations(runItem, ({ one }) => ({
  run: one(run, { fields: [runItem.runId], references: [run.id] }),
  item: one(item, { fields: [runItem.itemId], references: [item.id] }),
}));

export type Item = typeof item.$inferSelect;
export type Synergy = typeof synergy.$inferSelect;
export type Run = typeof run.$inferSelect;
