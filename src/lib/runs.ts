import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { run, runItem } from "@/lib/db/schema";

export type RunSummary = {
  id: string;
  name: string;
  character: string | null;
  active: boolean;
  createdAt: Date;
  itemIds: string[];
  /** itemId -> owned count; only stackable items ever exceed 1. */
  quantities: Record<string, number>;
};

/** Get the user's active run, creating a default one if none exists. */
export async function getOrCreateActiveRun(userId: string): Promise<RunSummary> {
  const existing = await db
    .select()
    .from(run)
    .where(and(eq(run.userId, userId), eq(run.active, true)))
    .orderBy(desc(run.createdAt))
    .limit(1);

  let current = existing[0];
  if (!current) {
    const inserted = await db
      .insert(run)
      .values({ id: randomUUID(), userId, name: "Current Run", active: true })
      .returning();
    current = inserted[0];
  }

  const items = await db
    .select({ itemId: runItem.itemId, quantity: runItem.quantity })
    .from(runItem)
    .where(eq(runItem.runId, current.id));

  return {
    id: current.id,
    name: current.name,
    character: current.character,
    active: current.active,
    createdAt: current.createdAt,
    itemIds: items.map((i) => i.itemId),
    quantities: Object.fromEntries(items.map((i) => [i.itemId, i.quantity])),
  };
}

/**
 * Verify the run belongs to the user and bump its updatedAt in one statement.
 * Throws if the run doesn't exist or isn't owned by the user.
 */
async function touchOwnedRun(userId: string, runId: string) {
  const rows = await db
    .update(run)
    .set({ updatedAt: new Date() })
    .where(and(eq(run.id, runId), eq(run.userId, userId)))
    .returning({ id: run.id });
  if (rows.length === 0) throw new Error("Run not found");
}

export async function addItemToRun(userId: string, runId: string, itemId: string) {
  await touchOwnedRun(userId, runId);
  await db.insert(runItem).values({ runId, itemId }).onConflictDoNothing();
}

/** Set a stackable item's owned count (clamped to [1, 99]; item must be in the run). */
export async function setItemQuantity(
  userId: string,
  runId: string,
  itemId: string,
  quantity: number,
) {
  await touchOwnedRun(userId, runId);
  const clamped = Math.max(1, Math.min(99, Math.floor(quantity)));
  await db
    .update(runItem)
    .set({ quantity: clamped })
    .where(and(eq(runItem.runId, runId), eq(runItem.itemId, itemId)));
}

export async function removeItemFromRun(userId: string, runId: string, itemId: string) {
  await touchOwnedRun(userId, runId);
  await db.delete(runItem).where(and(eq(runItem.runId, runId), eq(runItem.itemId, itemId)));
}

/**
 * Replace the run's entire item list in one transaction — used when importing
 * a shared run into an account. Callers validate ids and quantities.
 */
export async function replaceRunItems(
  userId: string,
  runId: string,
  items: { itemId: string; quantity: number }[],
) {
  await touchOwnedRun(userId, runId);
  await db.transaction(async (tx) => {
    await tx.delete(runItem).where(eq(runItem.runId, runId));
    if (items.length > 0) {
      await tx
        .insert(runItem)
        .values(items.map((i) => ({ runId, itemId: i.itemId, quantity: i.quantity })));
    }
  });
}

/** Reset the active run by clearing all of its items. */
export async function resetRun(userId: string, runId: string) {
  await touchOwnedRun(userId, runId);
  await db.delete(runItem).where(eq(runItem.runId, runId));
}
