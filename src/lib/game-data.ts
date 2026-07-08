import { db } from "@/lib/db";
import { item, synergy, synergyComponent } from "@/lib/db/schema";

export type GameItem = {
  id: string;
  name: string;
  type: "gun" | "passive" | "active";
  quality: "D" | "C" | "B" | "A" | "S" | "N";
  description: string;
  quote: string | null;
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

// Game data is static (seeded reference tables), so load it once per runtime.
const globalForData = globalThis as unknown as { gameData?: Promise<GameData> };

async function load(): Promise<GameData> {
  const [items, synergies, components] = await Promise.all([
    db.select().from(item),
    db.select().from(synergy),
    db.select().from(synergyComponent),
  ]);

  const itemsById = new Map(items.map((i) => [i.id, i as GameItem]));

  const groupsBySynergy = new Map<string, Map<number, GameItem[]>>();
  for (const c of components) {
    const it = itemsById.get(c.itemId);
    if (!it) continue;
    let groups = groupsBySynergy.get(c.synergyId);
    if (!groups) {
      groups = new Map();
      groupsBySynergy.set(c.synergyId, groups);
    }
    const arr = groups.get(c.groupIndex) ?? [];
    arr.push(it);
    groups.set(c.groupIndex, arr);
  }

  const resolved: ResolvedSynergy[] = synergies.map((s) => {
    const groupMap = groupsBySynergy.get(s.id) ?? new Map<number, GameItem[]>();
    const groups: SynergyGroup[] = [...groupMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([index, items]) => ({ index, items }));
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

  return {
    items: items as GameItem[],
    itemsById,
    synergies: resolved,
    synergiesByItem,
  };
}

export function getGameData(): Promise<GameData> {
  if (!globalForData.gameData) {
    globalForData.gameData = load();
  }
  return globalForData.gameData;
}
