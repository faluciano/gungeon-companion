import { NextResponse } from "next/server";
import { requireUserId, UnauthorizedError } from "@/lib/session";
import { getGameData } from "@/lib/game-data";
import {
  addItemToRun,
  getOrCreateActiveRun,
  removeItemFromRun,
} from "@/lib/runs";

export const dynamic = "force-dynamic";

async function resolve() {
  const userId = await requireUserId();
  const run = await getOrCreateActiveRun(userId);
  return { userId, runId: run.id };
}

export async function POST(request: Request) {
  try {
    const { itemId } = (await request.json()) as { itemId?: string };
    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }
    const data = await getGameData();
    if (!data.itemsById.has(itemId)) {
      return NextResponse.json({ error: "Unknown item" }, { status: 404 });
    }
    const { userId, runId } = await resolve();
    await addItemToRun(userId, runId, itemId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }
    const { userId, runId } = await resolve();
    await removeItemFromRun(userId, runId, itemId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
