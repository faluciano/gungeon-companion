import { NextResponse } from "next/server";
import { requireUserId, UnauthorizedError } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getGameData } from "@/lib/game-data";
import {
  addItemToRun,
  getOrCreateActiveRun,
  removeItemFromRun,
  setItemQuantity,
} from "@/lib/runs";
import { STACKABLE_IDS } from "@/lib/junkan";

export const dynamic = "force-dynamic";

// POST and DELETE share one bucket: both are taps on the same run.
const ITEMS_LIMIT = { window: 60, max: 60 };

export async function POST(request: Request) {
  try {
    const { itemId } = (await request.json()) as { itemId?: string };
    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }
    const data = getGameData();
    if (!data.itemsById.has(itemId)) {
      return NextResponse.json({ error: "Unknown item" }, { status: 404 });
    }
    const userId = await requireUserId();
    const limited = await enforceRateLimit(`run:items:${userId}`, ITEMS_LIMIT);
    if (limited) return limited;
    const run = await getOrCreateActiveRun(userId);
    await addItemToRun(userId, run.id, itemId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}

export async function PATCH(request: Request) {
  try {
    const { itemId, quantity } = (await request.json()) as {
      itemId?: string;
      quantity?: number;
    };
    if (!itemId || typeof quantity !== "number" || !Number.isFinite(quantity)) {
      return NextResponse.json(
        { error: "itemId and quantity are required" },
        { status: 400 },
      );
    }
    if (!STACKABLE_IDS.has(itemId)) {
      return NextResponse.json({ error: "Item does not stack" }, { status: 400 });
    }
    const userId = await requireUserId();
    const limited = await enforceRateLimit(`run:items:${userId}`, ITEMS_LIMIT);
    if (limited) return limited;
    const run = await getOrCreateActiveRun(userId);
    await setItemQuantity(userId, run.id, itemId, quantity);
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
    const userId = await requireUserId();
    const limited = await enforceRateLimit(`run:items:${userId}`, ITEMS_LIMIT);
    if (limited) return limited;
    const run = await getOrCreateActiveRun(userId);
    await removeItemFromRun(userId, run.id, itemId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
