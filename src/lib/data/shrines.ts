export type Shrine = {
  id: string;
  name: string;
  /** Short in-game lore line shown in italics. */
  flavor: string;
  /** What the shrine actually does. */
  effect: string;
  /** What the player sacrifices or spends to use it. */
  give: string;
  /** What the player receives. */
  gain: string;
  /** Optional curse chip text, e.g. "+3.5 Curse". */
  curse?: string;
  tags: string[];
  imageUrl: string;
};

const CDN = "https://static.wikia.nocookie.net/enterthegungeon_gamepedia/images";

export const SHRINES: Shrine[] = [
  {
    id: "ammo",
    name: "Ammo Shrine",
    flavor: "A shrine to Shell'tan, ammo elemental.",
    effect: "Instantly refills the ammo of every weapon you are carrying.",
    give: "Nothing — but curse rises",
    gain: "Full ammo on all guns",
    curse: "+3.5 Curse",
    tags: ["Ammo", "Curse"],
    imageUrl: `${CDN}/7/7f/Ammo_Shrine.png/revision/latest`,
  },
  {
    id: "angel",
    name: "Angel Shrine",
    flavor: "A shrine to a prideful bullet angel, now fallen.",
    effect:
      "Sacrifice a heart container (or two armor as The Robot) to permanently increase your damage by 25%.",
    give: "1 Heart container",
    gain: "+25% damage (permanent)",
    curse: "+1.5 Curse",
    tags: ["Offense", "Sacrifice", "Curse"],
    imageUrl: `${CDN}/c/cf/Angel_Shrine.png/revision/latest`,
  },
  {
    id: "beholster",
    name: "Beholster Shrine",
    flavor: "A shrine to the Beholster, the sphere of many guns.",
    effect:
      "Offer the six guns the Beholster wields — Com4nd0, M1911, Void Marshal, Machine Pistol, Eye of the Beholster, and Trank Gun — across multiple runs. Once all are given, they return with the Behold! synergy, orbiting you and firing at nearby enemies.",
    give: "6 specific guns (across runs)",
    gain: "Behold! synergy",
    tags: ["Synergy", "Long-term"],
    imageUrl: `${CDN}/2/2b/Beholster_Shrine.png/revision/latest`,
  },
  {
    id: "blank",
    name: "Blank Shrine",
    flavor: '"...offering..." — the rest of the text is blank.',
    effect:
      "Using a Blank next to the shrine has a 90% chance to spawn a chest. Each chest received lowers the odds by 45% (minimum 25%). Chests may be locked, unlocked, or a mimic.",
    give: "Blanks",
    gain: "Chance at chests",
    tags: ["Chests", "Gamble"],
    imageUrl: `${CDN}/5/58/Blank_Shrine.png/revision/latest`,
  },
  {
    id: "blood",
    name: "Blood Shrine",
    flavor: "An ominous fountain, filled with blood. It isn't quite full...",
    effect:
      "Sacrifice a heart container (or two armor as The Robot). Nearby highlighted enemies are worn down by a damaging aura that heals you once you've drained enough. Using it twice unlocks the Life Orb.",
    give: "1 Heart container",
    gain: "Life-draining aura",
    tags: ["Lifesteal", "Sacrifice", "Risk"],
    imageUrl: `${CDN}/f/f7/Blood_Shrine.png/revision/latest`,
  },
  {
    id: "challenge",
    name: "Challenge Shrine",
    flavor: "Dark energy permeates this shrine, filling you with foreboding.",
    effect:
      "Fight through three waves of enemies. Survive them all to earn a reward chest — which may be a mimic. Moving on before challenging it may make the shrine vanish.",
    give: "3 enemy waves",
    gain: "Reward chest",
    tags: ["Combat", "Chests", "Risk"],
    imageUrl: `${CDN}/d/dd/Challenge_Shrine.png/revision/latest`,
  },
  {
    id: "cleanse",
    name: "Cleanse Shrine",
    flavor: "The spectres draw closer the more your curse grows.",
    effect:
      "Resets your Curse to 0 for a price of 5 money per point of curse removed. Generates in its own room with a unique icon on the map.",
    give: "5 money × curse points",
    gain: "Curse reset to 0",
    curse: "Curse → 0",
    tags: ["Curse", "Cleanse"],
    imageUrl: `${CDN}/6/6c/Cleanse_Shrine.png/revision/latest`,
  },
  {
    id: "companion",
    name: "Companion Shrine",
    flavor: "A statue commemorating the few friendly faces met in the Gungeon.",
    effect:
      "Sacrifice a heart container (or two armor as The Robot) for a random familiar-summoning item. Companions stack, so you can gather several.",
    give: "1 Heart container",
    gain: "Random familiar",
    tags: ["Companion", "Sacrifice"],
    imageUrl: `${CDN}/f/f7/Familiar_Shrine.png/revision/latest`,
  },
  {
    id: "dice",
    name: "Dice Shrine",
    flavor: "A shrine to Icosahedrax, the great arbiter.",
    effect:
      "Rolls one positive and one negative effect at once — healing, money, blanks, armor, or chests paired with a harmful opposite. A rare 0.1% roll makes it explode: heart containers drop to 1, but your damage quadruples.",
    give: "A roll of the dice",
    gain: "1 good + 1 bad effect",
    tags: ["Gamble", "Random"],
    imageUrl: `${CDN}/0/00/Dice_Shrine.png/revision/latest`,
  },
  {
    id: "glass",
    name: "Glass Shrine",
    flavor: "A shrine of glass.",
    effect:
      "Grants three Glass Guon Stones that orbit you and block enemy bullets, but shatter the instant you take damage. The first use unlocks the Glass Guon Stone item.",
    give: "Nothing",
    gain: "3 Glass Guon Stones",
    tags: ["Defense", "Fragile"],
    imageUrl: `${CDN}/8/8d/Glass_Shrine.png/revision/latest`,
  },
  {
    id: "hero",
    name: "Hero Shrine",
    flavor: '"Kill your past; you\'ve already damned your future."',
    effect:
      "Found in the Keep of the Lead Lord's starting room, usable only after killing your past. Sets your Curse to 9 for a high-risk, high-reward run. Cannot be used if your curse is already 9 or higher.",
    give: "Raises curse to 9",
    gain: "A cursed run",
    curse: "Sets Curse to 9",
    tags: ["Curse", "Challenge"],
    imageUrl: `${CDN}/0/07/Hero_Shrine.png/revision/latest`,
  },
  {
    id: "junk",
    name: "Junk Shrine",
    flavor: "A shrine to Ser Junkan, who rose from nothing to knighthood.",
    effect: "Trade Junk to the shrine in exchange for a piece of armor.",
    give: "Junk",
    gain: "Armor",
    tags: ["Armor", "Trade"],
    imageUrl: `${CDN}/d/d7/Junk_Shrine.png/revision/latest`,
  },
  {
    id: "peace",
    name: "Peace Shrine",
    flavor: "A shrine to a forgotten bullet who laid down his arms... will you?",
    effect:
      "Heals one heart in exchange for your currently held weapon. On a Blessed run, guns can be traded for hearts again and again.",
    give: "Currently held weapon",
    gain: "+1 Heart",
    tags: ["Healing", "Trade"],
    imageUrl: `${CDN}/5/58/Peace_Shrine.png/revision/latest`,
  },
  {
    id: "yv",
    name: "Y.V. Shrine",
    flavor: "A shrine to the Gun Godz.",
    effect:
      "Costs 10 money the first time, rising by 10 each use. Grants a chance for every shot to fire 2–4 extra bullets at no ammo cost. Each use raises the proc chance by 3.7%.",
    give: "10+ money (rising)",
    gain: "Chance to multi-fire",
    tags: ["Offense", "Money"],
    imageUrl: `${CDN}/7/75/YV_Shrine.png/revision/latest`,
  },
];
