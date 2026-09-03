// Ser Junkan's rank ladder. He levels up once per Junk picked up; Lies also
// counts, and a single Gold Junk sends him straight to his golden mech form.
// Source: https://enterthegungeon.fandom.com/wiki/Ser_Junkan

export const SER_JUNKAN_ID = "ser-junkan";
export const JUNK_ID = "junk";
export const GOLD_JUNK_ID = "gold-junk";
export const LIES_ID = "lies";
export const GLASS_GUON_STONE_ID = "glass-guon-stone";

/**
 * Items that stack in a run (each pickup counts, unlike the Set-like rest):
 * the Junk family that levels Ser Junkan, and Glass Guon Stone, which the
 * Gungeon hands out several at a time (shrines, chests) and orbits as a stack.
 */
export const STACKABLE_IDS = new Set([JUNK_ID, GOLD_JUNK_ID, LIES_ID, GLASS_GUON_STONE_ID]);

export type JunkanRank = {
  /** Junk count at which this rank is reached. */
  junk: number;
  rank: string;
  effect: string;
  /** This form's sprite on the wiki CDN (same host as dataset imageUrls). */
  imageUrl: string;
};

const CDN = "https://static.wikia.nocookie.net/enterthegungeon_gamepedia/images";

export const JUNKAN_RANKS: JunkanRank[] = [
  {
    junk: 0,
    rank: "Peasant",
    effect: "Junkan harmlessly pushes enemies around.",
    imageUrl: `${CDN}/8/80/Ser_Junkan_1.png/revision/latest`,
  },
  {
    junk: 1,
    rank: "Squire",
    effect:
      "Gains a helmet and starts slowly attacking enemies by headbutting them, dealing 3 damage per hit.",
    imageUrl: `${CDN}/3/36/Ser_Junkan_2.png/revision/latest`,
  },
  {
    junk: 2,
    rank: "Hedge Knight",
    effect:
      "Gains a shield and attacks more frequently by shield-bashing enemies, dealing 5 damage per hit.",
    imageUrl: `${CDN}/5/55/Ser_Junkan_3.png/revision/latest`,
  },
  {
    junk: 3,
    rank: "Knight",
    effect:
      "Gains a sword and attacks more frequently by slicing enemies, dealing 7 damage per hit.",
    imageUrl: `${CDN}/2/2f/Ser_Junkan_4.png/revision/latest`,
  },
  {
    junk: 4,
    rank: "Knight Lieutenant",
    effect: "Gains an adornment on his helmet and starts dealing 9 damage per hit.",
    imageUrl: `${CDN}/0/02/Ser_Junkan_5.png/revision/latest`,
  },
  {
    junk: 5,
    rank: "Knight Commander",
    effect:
      "Gains a cape and a spin attack that deals 10 damage per hit, hits twice, and can hit multiple enemies at once.",
    imageUrl: `${CDN}/f/fc/Ser_Junkan_6.png/revision/latest`,
  },
  {
    junk: 6,
    rank: "Holy Knight",
    effect:
      "Gains a white colour scheme, a new sword and shield, and deals 13.33 damage per hit. Occasionally blanks. If the player dies, Ser Junkan sacrifices himself to revive them at full health.",
    imageUrl: `${CDN}/2/23/Ser_Junkan_7.png/revision/latest`,
  },
  {
    junk: 7,
    rank: "Angelic Knight",
    effect:
      "Gains a flaming pink sword, angelic armor, and wings; flies and rapidly fires pink projectiles that deal 10 damage. Loses the ability to blank and to save the player.",
    imageUrl: `${CDN}/1/1f/Ser_Junkan_Final.png/revision/latest`,
  },
];

export const MECHA_RANK: JunkanRank = {
  junk: 0,
  rank: "Mecha Junkan",
  effect:
    "One Gold Junk grants a high-tech golden mechsuit: a machine gun dealing 2.2 damage per shot (un-Jams enemies it hits), a 20-damage laser blade, and homing rockets dealing 8 damage each that bypass the boss DPS cap.",
  imageUrl: `${CDN}/c/c8/Ser_Junkan_Golden.png/revision/latest`,
};

export type JunkanStatus = {
  /** Junk-equivalent pickups counted toward his level (Junk + Lies). */
  junkCount: number;
  current: JunkanRank;
  /** Next rank up the ladder, or null at max / in mech form. */
  next: JunkanRank | null;
  /** True when a Gold Junk has put him in his golden mech form. */
  mecha: boolean;
};

/**
 * Ser Junkan's status for a loadout, or null when he isn't in it.
 * `quantities` maps item id -> owned count (absent ids in the map but present
 * in `ownedIds` count as 1).
 */
export function junkanStatus(
  ownedIds: ReadonlySet<string>,
  quantities: ReadonlyMap<string, number>,
): JunkanStatus | null {
  if (!ownedIds.has(SER_JUNKAN_ID)) return null;

  const count = (id: string) =>
    ownedIds.has(id) ? Math.max(1, quantities.get(id) ?? 1) : 0;

  if (count(GOLD_JUNK_ID) > 0) {
    return { junkCount: count(JUNK_ID) + count(LIES_ID), current: MECHA_RANK, next: null, mecha: true };
  }

  const junkCount = count(JUNK_ID) + count(LIES_ID);
  const current =
    [...JUNKAN_RANKS].reverse().find((r) => junkCount >= r.junk) ?? JUNKAN_RANKS[0];
  const next = JUNKAN_RANKS.find((r) => r.junk > junkCount) ?? null;
  return { junkCount, current, next, mecha: false };
}
