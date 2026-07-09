import dataset from "@/lib/data/dataset.json";

export type GameItem = {
  id: string;
  name: string;
  type: "gun" | "passive" | "active";
  quality: "D" | "C" | "B" | "A" | "S" | "N";
  description: string;
  quote: string | null;
  imageUrl: string | null;
};

export type SynergyGroup = {
  index: number;
  // Interchangeable alternatives; the group is satisfied if any is owned.
  items: GameItem[];
};

export type ResolvedSynergy = {
  id: string;
  name: string;
  effect: string;
  requiredGroups: number;
  groups: SynergyGroup[];
};

export type GameData = {
  items: GameItem[];
  itemsById: Map<string, GameItem>;
  synergies: ResolvedSynergy[];
  // itemId -> synergies that reference it.
  synergiesByItem: Map<string, ResolvedSynergy[]>;
};

// Static reference dataset shipped with the app (no DB round-trip needed).
type DatasetSynergyComponent = { itemId: string; groupIndex: number };
type DatasetSynergy = {
  id: string;
  name: string;
  effect: string;
  requiredGroups: number;
  components: DatasetSynergyComponent[];
};
type Dataset = { items: GameItem[]; synergies: DatasetSynergy[] };

// Game data is static reference data, so build it once per runtime.
const globalForData = globalThis as unknown as { gameData?: Promise<GameData> };

function build(): GameData {
  const { items, synergies } = dataset as unknown as Dataset;

  const itemsById = new Map(items.map((i) => [i.id, i]));

  const resolved: ResolvedSynergy[] = synergies.map((s) => {
    const groupMap = new Map<number, GameItem[]>();
    for (const c of s.components) {
      const it = itemsById.get(c.itemId);
      if (!it) continue;
      const arr = groupMap.get(c.groupIndex) ?? [];
      arr.push(it);
      groupMap.set(c.groupIndex, arr);
    }
    const groups: SynergyGroup[] = [...groupMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([index, groupItems]) => ({ index, items: groupItems }));
    return {
      id: s.id,
      name: s.name,
      effect: s.effect,
      requiredGroups: s.requiredGroups,
      groups,
    };
  });

  const synergiesByItem = new Map<string, ResolvedSynergy[]>();
  for (const s of resolved) {
    for (const g of s.groups) {
      for (const it of g.items) {
        const arr = synergiesByItem.get(it.id) ?? [];
        if (!arr.includes(s)) arr.push(s);
        synergiesByItem.set(it.id, arr);
      }
    }
  }

  return { items, itemsById, synergies: resolved, synergiesByItem };
}

export function getGameData(): Promise<GameData> {
  if (!globalForData.gameData) {
    globalForData.gameData = Promise.resolve(build());
  }
  return globalForData.gameData;
}
