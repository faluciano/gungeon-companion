export type ShortcutUnlock = {
  /** Item id in the dataset, so the card can link to its page. */
  itemId: string;
  name: string;
  imageUrl: string;
};

export type Shortcut = {
  id: string;
  /** Floor number as shown on the elevator, e.g. 2 for Gungeon Proper. */
  floor: number;
  /** What the elevator badge shows — Boss Rush isn't a numbered floor. */
  badge: string;
  name: string;
  /** Short line on what starting here means for a run. */
  blurb: string;
  /**
   * Alternative payments — Tailor accepts any ONE of these, so the list is a
   * menu, not a checklist.
   */
  costs: string[];
  /** What the Resourceful Rat hands you on arrival, compensating skipped loot. */
  ratOffer: string;
  unlocks: ShortcutUnlock[];
  notes: string[];
  tags: string[];
};

const CDN = "https://static.wikia.nocookie.net/enterthegungeon_gamepedia/images";

/**
 * Elevator shortcuts, in floor order. Materials can be handed to Tailor across
 * multiple runs (Hegemony Credits excepted), and each requirement must be paid
 * in full in one go.
 */
export const SHORTCUTS: Shortcut[] = [
  {
    id: "gungeon-proper",
    floor: 2,
    badge: "2",
    name: "Gungeon Proper",
    blurb: "Skips the Keep of the Lead Lord and starts you on floor 2.",
    costs: [
      "3 Blanks",
      "3 Keys and 120 Casings",
      "10 Hegemony Credits",
      "Master Round I",
    ],
    ratOffer: "Choose 1 of 3 free D-quality guns",
    unlocks: [
      {
        itemId: "gunboots",
        name: "Gunboots",
        imageUrl: `${CDN}/9/9f/Gunboots.png/revision/latest`,
      },
    ],
    notes: [],
    tags: ["Blanks", "Keys", "Credits"],
  },
  {
    id: "black-powder-mine",
    floor: 3,
    badge: "3",
    name: "Black Powder Mine",
    blurb: "Skips two floors and starts you in the Mines on floor 3.",
    costs: [
      "3 Armor (6 as The Robot)",
      "4 Keys and 180 Casings",
      "15 Hegemony Credits",
      "Master Round II",
    ],
    ratOffer: "Choose 1 of 3 free C-quality guns",
    unlocks: [
      {
        itemId: "r2g2",
        name: "R2G2",
        imageUrl: `${CDN}/b/bd/R2G2.png/revision/latest`,
      },
    ],
    notes: [
      "As The Robot, offering exactly 6 armor leaves you with 1 piece — Tailor only takes 5.",
    ],
    tags: ["Armor", "Keys", "Credits"],
  },
  {
    id: "hollow",
    floor: 4,
    badge: "4",
    name: "Hollow",
    blurb: "Skips three floors and starts you in the Hollow on floor 4.",
    costs: [
      "4 Junk",
      "5 Keys and 240 Casings",
      "20 Hegemony Credits",
      "Master Round III",
    ],
    ratOffer: "Choose 2 of 3 free B-quality guns",
    unlocks: [
      {
        itemId: "gungine",
        name: "Gungine",
        imageUrl: `${CDN}/d/da/Gungine.png/revision/latest`,
      },
    ],
    notes: ["Lies and Ser Junkan do not count toward the 4 Junk."],
    tags: ["Junk", "Keys", "Credits"],
  },
  {
    id: "forge",
    floor: 5,
    badge: "5",
    name: "Forge",
    blurb: "Skips four floors and drops you straight into the Forge.",
    costs: [
      "6 filled heart containers to show him",
      "6 Keys and 300 Casings",
      "25 Hegemony Credits",
      "Master Round IV",
    ],
    ratOffer: "Take all 3 free B-quality guns",
    unlocks: [
      {
        itemId: "akey-47",
        name: "AKEY-47",
        imageUrl: `${CDN}/8/80/AKEY-47.png/revision/latest`,
      },
    ],
    notes: [
      "In co-op, The Cultist cannot fulfil the heart requirement — Tailor refuses to talk to them.",
    ],
    tags: ["Hearts", "Keys", "Credits"],
  },
  {
    id: "boss-rush",
    floor: 6,
    badge: "BR",
    name: "Boss Rush",
    blurb: "A challenge elevator rather than a floor skip — bosses, back to back.",
    costs: ["Complete all four elevator quests"],
    ratOffer: "No Rat merchant",
    unlocks: [],
    notes: [],
    tags: ["Challenge"],
  },
];

export const SHORTCUT_FLOORS = SHORTCUTS.filter((s) => s.id !== "boss-rush");
