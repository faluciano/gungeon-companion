import { NextResponse } from "next/server";
import { requireUserId, UnauthorizedError } from "@/lib/session";
import { getRunView } from "@/lib/run-view";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireUserId();
    const view = await getRunView(userId);
    return NextResponse.json(view);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
