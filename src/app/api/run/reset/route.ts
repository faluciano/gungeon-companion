import { NextResponse } from "next/server";
import { requireUserId, UnauthorizedError } from "@/lib/session";
import { getOrCreateActiveRun, resetRun } from "@/lib/runs";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const userId = await requireUserId();
    const run = await getOrCreateActiveRun(userId);
    await resetRun(userId, run.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
