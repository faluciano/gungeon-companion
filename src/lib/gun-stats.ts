import type { GameItem, GunStats } from "@/lib/game-data";

/**
 * Turns a gun's wiki stat strings into something rankable: which stats to
 * show, in what order, and how each gun compares with every other gun in the
 * Ammonomicon. Pure functions so the item page can render on the server and
 * tests can run without React.
 */

export type StatKey = Exclude<keyof GunStats, "fireMode" | "gunClass" | "infiniteAmmo">;

export type StatDef = {
  key: StatKey;
  label: string;
  /** What the number means, shown as a hint. */
  hint: string;
  /** Unit suffix appended to plain numeric values. */
  unit?: string;
  /** True when a smaller number is the better one (fire rate, reload, spread). */
  lowerIsBetter?: boolean;
};

export const STAT_DEFS: StatDef[] = [
  { key: "dps", label: "DPS", hint: "Sustained damage per second, including reloads" },
  { key: "damage", label: "Damage", hint: "Damage per shot (per pellet × pellets for shotguns)" },
  {
    key: "fireRate",
    label: "Fire rate",
    hint: "Seconds between shots — lower fires faster",
    unit: "s",
    lowerIsBetter: true,
  },
  {
    key: "reloadTime",
    label: "Reload",
    hint: "Seconds to reload an empty magazine — lower is better",
    unit: "s",
    lowerIsBetter: true,
  },
  { key: "magazineSize", label: "Magazine", hint: "Shots before a reload" },
  { key: "ammoCapacity", label: "Ammo", hint: "Total shots carried at full ammo" },
  { key: "shotSpeed", label: "Shot speed", hint: "How fast projectiles travel" },
  { key: "range", label: "Range", hint: "How far projectiles travel before vanishing" },
  { key: "force", label: "Force", hint: "Knockback applied to enemies hit" },
  {
    key: "spread",
    label: "Spread",
    hint: "Bullet deviation in degrees — lower is more accurate",
    unit: "°",
    lowerIsBetter: true,
  },
];

const FIRE_MODE_HINTS: Record<string, string> = {
  Automatic: "Fires continuously while the trigger is held.",
  Semiautomatic: "One shot per trigger pull — tapping fires faster than holding.",
  Charged: "Hold to charge; release to fire a stronger shot.",
  Beam: "Fires a continuous beam while the trigger is held.",
  Burst: "Each trigger pull fires a short burst of shots.",
  Varies: "Switches fire mode depending on its current form.",
};

export function fireModeHint(fireMode: string): string | null {
  return FIRE_MODE_HINTS[fireMode] ?? null;
}

const GUN_CLASS_LABELS: Record<string, string> = {
  PISTOL: "Pistol",
  FULLAUTO: "Full auto",
  SHOTGUN: "Shotgun",
  RIFLE: "Rifle",
  EXPLOSIVE: "Explosive",
  BEAM: "Beam",
  CHARGE: "Charge",
  FIRE: "Fire",
  ICE: "Ice",
  POISON: "Poison",
  CHARM: "Charm",
  SILLY: "Silly",
  SHITTY: "Shoddy",
  NONE: "Unclassed",
};

/** Human label for the game's internal gun class tag (PISTOL → "Pistol"). */
export function gunClassLabel(gunClass: string): string {
  return GUN_CLASS_LABELS[gunClass] ?? gunClass.charAt(0) + gunClass.slice(1).toLowerCase();
}

/**
 * Leading number of a stat string, or null when the stat isn't a plain
 * figure. Ranges and variants ("34.6-69.2", "Uncharged: 10 · Charged: 20")
 * yield their first number — the base or uncharged case — so a gun is never
 * ranked on its best-case output. "Varies", "Equal to Shells held" and
 * similar prose yield null and are shown as text only.
 */
export function statNumber(value: string | null): number | null {
  if (value == null) return null;
  const m = /^[~≥]?\s*(\d+(?:\.\d+)?)/.exec(value.trim());
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export type StatRow = {
  def: StatDef;
  /** Text to display, or "∞" for unlimited ammo. */
  display: string;
  /** Parsed figure used for ranking, when there is one. */
  value: number | null;
  /** 0–1: how this gun compares with every other gun that lists the stat (1 = best). */
  score: number | null;
  /** 1-based rank among `of` guns, from best to worst. */
  rank: number | null;
  of: number;
};

/** Compact display value: plain numbers get their unit, prose is shown verbatim. */
export function statDisplay(def: StatDef, stats: GunStats): string | null {
  if (def.key === "ammoCapacity" && stats.infiniteAmmo) return "∞";
  const raw = stats[def.key];
  if (raw == null) return null;
  return def.unit && /^\d+(\.\d+)?$/.test(raw) ? `${raw}${def.unit}` : raw;
}

/**
 * Every stat the gun lists, with its rank among all guns in the Ammonomicon.
 * Stats the wiki doesn't list for this gun are omitted.
 */
export function gunStatRows(item: GameItem, allItems: GameItem[]): StatRow[] {
  const stats = item.stats;
  if (!stats) return [];
  const guns = allItems.filter((g) => g.type === "gun" && g.stats);

  return STAT_DEFS.flatMap((def) => {
    const display = statDisplay(def, stats);
    if (display == null) return [];

    const value = statNumber(stats[def.key]);
    const pool = guns
      .map((g) => statNumber(g.stats![def.key]))
      .filter((n): n is number => n != null);

    let score: number | null = null;
    let rank: number | null = null;
    if (value != null && pool.length > 1) {
      const better = pool.filter((n) => (def.lowerIsBetter ? n < value : n > value)).length;
      rank = better + 1;
      score = 1 - better / (pool.length - 1);
    }
    return [{ def, display, value, score, rank, of: pool.length }];
  });
}

/** Where an item of this quality is normally found. */
export function qualitySource(quality: GameItem["quality"]): string {
  switch (quality) {
    case "D":
      return "Brown chests";
    case "C":
      return "Blue chests";
    case "B":
      return "Green chests";
    case "A":
      return "Red chests";
    case "S":
      return "Black chests";
    default:
      return "Not found in chests";
  }
}
