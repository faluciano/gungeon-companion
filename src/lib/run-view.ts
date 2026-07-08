import { getGameData, type GameItem } from "@/lib/game-data";
import { getOrCreateActiveRun } from "@/lib/runs";
import {
  activeSynergies,
  nearlyActiveSynergies,
  type SynergyEvaluation,
} from "@/lib/synergy/engine";

export type RunView = {
  runId: string;
  name: string;
  items: GameItem[];
  active: SynergyEvaluationView[];
  nearly: SynergyEvaluationView[];
  counts: { items: number; guns: number; passives: number; actives: number };
};

export type SynergyEvaluationView = {
  id: string;
  name: string;
  effect: string;
  status: SynergyEvaluation["status"];
  satisfiedGroups: number;
  requiredGroups: number;
  contributors: { id: string; name: string; quality: GameItem["quality"]; imageUrl: string | null }[];
  // Items that would complete the synergy (only for `nearly`).
  needed: {
    groupIndex: number;
    options: { id: string; name: string; quality: GameItem["quality"]; imageUrl: string | null }[];
  }[];
};

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

export async function getRunView(userId: string): Promise<RunView> {
  const data = await getGameData();
  const run = await getOrCreateActiveRun(userId);
  const owned = new Set(run.itemIds);

  const items = run.itemIds
    .map((id) => data.itemsById.get(id))
    .filter((i): i is GameItem => Boolean(i))
    .sort((a, b) => a.name.localeCompare(b.name));

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
    runId: run.id,
    name: run.name,
    items,
    active,
    nearly,
    counts: {
      items: items.length,
      guns: items.filter((i) => i.type === "gun").length,
      passives: items.filter((i) => i.type === "passive").length,
      actives: items.filter((i) => i.type === "active").length,
    },
  };
}
