import { NextResponse } from "next/server";
import { getGameData } from "@/lib/game-data";
import { getSession } from "@/lib/session";
import { getOrCreateActiveRun } from "@/lib/runs";
import { reportItemSynergies } from "@/lib/synergy/engine";
import { searchItems } from "@/lib/search";

export const dynamic = "force-dynamic";

const TYPE_FILTERS = new Set(["gun", "passive", "active"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const typeParam = searchParams.get("type") ?? "";
  const type = TYPE_FILTERS.has(typeParam)
    ? (typeParam as "gun" | "passive" | "active")
    : "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 30) || 30, 60);

  const data = await getGameData();

  // Factor in the signed-in user's active run, if any.
  const session = await getSession();
  let ownedIds = new Set<string>();
  if (session?.user?.id) {
    const run = await getOrCreateActiveRun(session.user.id);
    ownedIds = new Set(run.itemIds);
  }

  // Map each item to the names of synergies that reference it, so a query like
  // "yes scope" surfaces the components of the "360 Yes Scope" synergy.
  const synergyNamesById = new Map<string, string[]>();
  for (const [id, syns] of data.synergiesByItem) {
    synergyNamesById.set(
      id,
      syns.map((s) => s.name),
    );
  }

  const hits = searchItems(data.items, q, { type, limit, synergyNamesById });

  const results = hits.map(({ item: it }) => {
    const reports = reportItemSynergies(
      it,
      data.synergiesByItem.get(it.id) ?? [],
      ownedIds,
    );
    const activatesCount = reports.filter((r) => r.activatesOnAdd).length;
    const activeCount = reports.filter((r) => r.evaluation.status === "active").length;
    return {
      id: it.id,
      name: it.name,
      type: it.type,
      quality: it.quality,
      description: it.description,
      quote: it.quote,
      imageUrl: it.imageUrl,
      owned: ownedIds.has(it.id),
      synergyCount: reports.length,
      // How many synergies would activate if this item were added to the run.
      activatesCount,
      // How many synergies involving this item are already active.
      activeCount,
    };
  });

  return NextResponse.json({ results, total: hits.length, hasRun: !!session?.user?.id });
}
