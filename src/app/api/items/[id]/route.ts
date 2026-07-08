import { NextResponse } from "next/server";
import { getGameData } from "@/lib/game-data";
import { getSession } from "@/lib/session";
import { getOrCreateActiveRun } from "@/lib/runs";
import { reportItemSynergies } from "@/lib/synergy/engine";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await getGameData();
  const item = data.itemsById.get(id);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const session = await getSession();
  let ownedIds = new Set<string>();
  if (session?.user?.id) {
    const run = await getOrCreateActiveRun(session.user.id);
    ownedIds = new Set(run.itemIds);
  }

  const reports = reportItemSynergies(
    item,
    data.synergiesByItem.get(item.id) ?? [],
    ownedIds,
  );

  const synergies = reports.map((r) => ({
    id: r.evaluation.synergy.id,
    name: r.evaluation.synergy.name,
    effect: r.evaluation.synergy.effect,
    status: r.evaluation.status,
    activatesOnAdd: r.activatesOnAdd,
    requiredGroups: r.evaluation.synergy.requiredGroups,
    satisfiedGroups: r.evaluation.satisfiedGroups,
    groups: r.evaluation.synergy.groups.map((g) => ({
      index: g.index,
      satisfied: g.items.some((i) => ownedIds.has(i.id)),
      items: g.items.map((i) => ({
        id: i.id,
        name: i.name,
        type: i.type,
        quality: i.quality,
        owned: ownedIds.has(i.id),
      })),
    })),
  }));

  return NextResponse.json({
    item: {
      id: item.id,
      name: item.name,
      type: item.type,
      quality: item.quality,
      description: item.description,
      quote: item.quote,
      imageUrl: item.imageUrl,
      owned: ownedIds.has(item.id),
    },
    synergies,
  });
}
