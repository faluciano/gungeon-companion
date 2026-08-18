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
    .select({ itemId: runItem.itemId })
    .from(runItem)
    .where(eq(runItem.runId, current.id));

  return {
    id: current.id,
    name: current.name,
    character: current.character,
    active: current.active,
    createdAt: current.createdAt,
    itemIds: items.map((i) => i.itemId),
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

export async function removeItemFromRun(userId: string, runId: string, itemId: string) {
  await touchOwnedRun(userId, runId);
  await db.delete(runItem).where(and(eq(runItem.runId, runId), eq(runItem.itemId, itemId)));
}

/** Reset the active run by clearing all of its items. */
export async function resetRun(userId: string, runId: string) {
  await touchOwnedRun(userId, runId);
  await db.delete(runItem).where(eq(runItem.runId, runId));
}
