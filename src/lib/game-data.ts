import dataset from "@/lib/data/dataset.json";

/**
 * Combat stats for a gun, from the wiki's Guns table. Values are display
 * strings because many guns list per-form or per-charge variants
 * ("Uncharged: 10 · Charged: 20") or ranges ("34.6-69.2"); `null` means the
 * wiki doesn't list that stat. See src/lib/gun-stats.ts for parsing/ranking.
 */
export type GunStats = {
  /** Wiki "Type": Automatic, Semiautomatic, Charged, Beam, Burst, or Varies. */
  fireMode: string;
  /** Internal gun class tag (PISTOL, SHOTGUN, BEAM, SILLY, ...). */
  gunClass: string;
  dps: string | null;
  magazineSize: string | null;
  /** null when the gun has unlimited ammo (see `infiniteAmmo`). */
  ammoCapacity: string | null;
  damage: string | null;
  /** Seconds between shots (lower fires faster). */
  fireRate: string | null;
  /** Seconds to reload. */
  reloadTime: string | null;
  shotSpeed: string | null;
  range: string | null;
  force: string | null;
  /** Degrees of bullet deviation (lower is more accurate). */
  spread: string | null;
  infiniteAmmo: boolean;
};

export type GameItem = {
  id: string;
  name: string;
  type: "gun" | "passive" | "active";
  quality: "D" | "C" | "B" | "A" | "S" | "N";
  description: string;
  quote: string | null;
  imageUrl: string | null;
  /** Present for every gun; absent for passives and actives. */
  stats?: GunStats;
};

export type SynergyGroup = {
  index: number;
  // Interchangeable alternatives; the group is satisfied once `minItems` of
  // them are owned (1 for almost every group; Chief Master needs any two
  // Master Rounds).
  items: GameItem[];
  minItems: number;
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
  // itemId -> names of synergies that reference it (search input).
  synergyNamesById: Map<string, string[]>;
};

// Static reference dataset shipped with the app (no DB round-trip needed).
type DatasetSynergyComponent = { itemId: string; groupIndex: number };
type DatasetSynergy = {
  id: string;
  name: string;
  effect: string;
  requiredGroups: number;
  components: DatasetSynergyComponent[];
  // Only present for groups that need more than one member owned.
  groupMinimums?: { groupIndex: number; minItems: number }[];
};
type Dataset = { items: GameItem[]; synergies: DatasetSynergy[] };

// Game data is static reference data, so build it once per runtime.
const globalForData = globalThis as unknown as { gameData?: GameData };

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
    const minimums = new Map(
      (s.groupMinimums ?? []).map((m) => [m.groupIndex, m.minItems]),
    );
    const groups: SynergyGroup[] = [...groupMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([index, groupItems]) => ({
        index,
        items: groupItems,
        minItems: Math.max(1, minimums.get(index) ?? 1),
      }));
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

  const synergyNamesById = new Map<string, string[]>();
  for (const [id, syns] of synergiesByItem) {
    synergyNamesById.set(
      id,
      syns.map((s) => s.name),
    );
  }

  return { items, itemsById, synergies: resolved, synergiesByItem, synergyNamesById };
}

export function getGameData(): GameData {
  return (globalForData.gameData ??= build());
}
