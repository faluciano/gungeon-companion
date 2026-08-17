import { NextResponse } from "next/server";
import { requireUserId, UnauthorizedError } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getOrCreateActiveRun, resetRun } from "@/lib/runs";

export const dynamic = "force-dynamic";

// Resets happen at most once per Gungeon run; 10/min is generous.
const RESET_LIMIT = { window: 60, max: 10 };

export async function POST() {
  try {
    const userId = await requireUserId();
    const limited = await enforceRateLimit(`run:reset:${userId}`, RESET_LIMIT);
    if (limited) return limited;
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
