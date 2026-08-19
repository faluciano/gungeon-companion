import { getGameData, type GameItem } from "@/lib/game-data";
import {
  activeSynergies,
  nearlyActiveSynergies,
  reportItemSynergies,
  type SynergyEvaluation,
} from "@/lib/synergy/engine";
import { searchItems } from "@/lib/search";
import { junkanStatus } from "@/lib/junkan";
import type {
  ItemDetail,
  RunView,
  SearchResult,
  SynergyEvaluationView,
} from "@/lib/types";

// Pure derivations over the bundled game dataset. Everything here runs the
// same on the server (initial render) and in the browser (live updates), so
// search and synergy evaluation never need a network round-trip.

function toView(e: SynergyEvaluation): SynergyEvaluationView {
  return {
    id: e.synergy.id,
    name: e.synergy.name,
    effect: e.synergy.effect,
    status: e.status,
    satisfiedGroups: e.satisfiedGroups,
    requiredGroups: e.synergy.requiredGroups,
    contributors: e.ownedContributors.map((i) => ({
      id: i.id,
      name: i.name,
      quality: i.quality,
      imageUrl: i.imageUrl,
    })),
    needed: e.missingGroups.map((g) => ({
      groupIndex: g.index,
      options: g.items.map((i) => ({
        id: i.id,
        name: i.name,
        quality: i.quality,
        imageUrl: i.imageUrl,
      })),
    })),
  };
}

export function computeRunView(
  runId: string,
  name: string,
  itemIds: Iterable<string>,
  quantities: ReadonlyMap<string, number> = new Map(),
): RunView {
  const data = getGameData();
  const owned = new Set(itemIds);

  const items = [...owned]
    .map((id) => data.itemsById.get(id))
    .filter((i): i is GameItem => Boolean(i))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((i) => ({ ...i, quantity: Math.max(1, quantities.get(i.id) ?? 1) }));

  // Only consider synergies that touch at least one owned item.
  const relevant = new Set<string>();
  for (const id of owned) {
    for (const s of data.synergiesByItem.get(id) ?? []) relevant.add(s.id);
  }
  const relevantSynergies = data.synergies.filter((s) => relevant.has(s.id));

  const active = activeSynergies(relevantSynergies, owned)
    .sort((a, b) => a.synergy.name.localeCompare(b.synergy.name))
    .map(toView);

  const nearly = nearlyActiveSynergies(relevantSynergies, owned)
    .sort((a, b) => a.synergy.name.localeCompare(b.synergy.name))
    .map(toView);

  return {
    runId,
    name,
    items,
    active,
    nearly,
    junkan: junkanStatus(owned, quantities),
    counts: {
      items: items.length,
      guns: items.filter((i) => i.type === "gun").length,
      passives: items.filter((i) => i.type === "passive").length,
      actives: items.filter((i) => i.type === "active").length,
    },
  };
}

export function computeSearchResults(
  query: string,
  type: "gun" | "passive" | "active" | "",
  ownedIds: Set<string>,
  limit = 30,
): SearchResult[] {
  const data = getGameData();
  const hits = searchItems(data.items, query, {
    type,
    limit,
    synergyNamesById: data.synergyNamesById,
  });

  return hits.map(({ item: it }) => {
    const reports = reportItemSynergies(
      it,
      data.synergiesByItem.get(it.id) ?? [],
      ownedIds,
    );
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
      activatesCount: reports.filter((r) => r.activatesOnAdd).length,
      // How many synergies involving this item are already active.
      activeCount: reports.filter((r) => r.evaluation.status === "active").length,
    };
  });
}

export function computeItemDetail(
  itemId: string,
  ownedIds: Set<string>,
): ItemDetail | null {
  const data = getGameData();
  const item = data.itemsById.get(itemId);
  if (!item) return null;

  const reports = reportItemSynergies(
    item,
    data.synergiesByItem.get(item.id) ?? [],
    ownedIds,
  );

  return {
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
    synergies: reports.map((r) => ({
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
    })),
  };
}
