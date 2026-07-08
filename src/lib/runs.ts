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
    const id = randomUUID();
    await db.insert(run).values({ id, userId, name: "Current Run", active: true });
    const inserted = await db.select().from(run).where(eq(run.id, id)).limit(1);
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

async function assertOwnership(userId: string, runId: string) {
  const rows = await db
    .select({ id: run.id })
    .from(run)
    .where(and(eq(run.id, runId), eq(run.userId, userId)))
    .limit(1);
  if (rows.length === 0) throw new Error("Run not found");
}

export async function addItemToRun(userId: string, runId: string, itemId: string) {
  await assertOwnership(userId, runId);
  await db.insert(runItem).values({ runId, itemId }).onConflictDoNothing();
  await touchRun(runId);
}

export async function removeItemFromRun(userId: string, runId: string, itemId: string) {
  await assertOwnership(userId, runId);
  await db.delete(runItem).where(and(eq(runItem.runId, runId), eq(runItem.itemId, itemId)));
  await touchRun(runId);
}

/** Reset the active run by clearing all of its items. */
export async function resetRun(userId: string, runId: string) {
  await assertOwnership(userId, runId);
  await db.delete(runItem).where(eq(runItem.runId, runId));
  await touchRun(runId);
}

async function touchRun(runId: string) {
  await db.update(run).set({ updatedAt: new Date() }).where(eq(run.id, runId));
}
