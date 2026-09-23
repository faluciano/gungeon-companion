/**
 * Hand-written walkthroughs for quest items — things you carry somewhere to
 * unlock something, which the one-line Ammonomicon effect doesn't explain.
 * Sourced from each item's page on the Enter the Gungeon wiki.
 */
export type ItemGuide = {
  /** One line: what carrying this item is for. */
  goal: string;
  /** Ordered steps to get it where it needs to go. */
  steps: string[];
  /** Ways to lose it and things that make the trip easier. */
  tips: string[];
  /** Item ids worth linking from the guide (helpful items, sibling parts). */
  related?: string[];
};

const BULLET_PARTS = [
  "prime-primer",
  "planar-lead",
  "obsidian-shell-casing",
  "arcane-gunpowder",
];

const BULLET_PART_TIPS = [
  "You need all four parts — Prime Primer, Planar Lead, Obsidian Shell Casing, and Arcane Gunpowder — in one run before the Blacksmith will forge the Bullet That Can Kill The Past.",
  "Hand everything to the Blacksmith in the Forge (floor 5); the finished Bullet then lets you fight your character's Past in the Breach.",
  "Bullet parts can't be dropped, so The Cultist in co-op can never deliver them — have the main player collect them.",
];

export const ITEM_GUIDES: Record<string, ItemGuide> = {
  "busted-television": {
    goal: "Carry it to the Blacksmith in the Forge (floor 5) to unlock The Robot.",
    steps: [
      "Unlock the Gungeon Proper shortcut first — the TV only spawns in that floor's elevator maintenance shaft room.",
      "On floor 2, find the elevator shaft room and pick up the TV. Wait until you've found the elevator down to the Black Powder Mine so you spend less time babysitting it.",
      "Dodge rolling drops it. In fights, toss it (use the item) somewhere safe, clear the room, then pick it back up.",
      "Carry it through the Mine and Hollow to the Forge and give it to the Blacksmith. Let the cutscene finish — The Robot only unlocks once it ends.",
    ],
    tips: [
      "Once you've entered the shaft room, the Resourceful Rat can steal the TV if you leave it lying anywhere. Don't enter that room until you're ready to take it.",
      "Scaring the Rat off doesn't stop him — he keeps coming back while the TV is on the ground.",
      "The TV has hidden health: enemy bullets can destroy it while it's on the floor, with no warning.",
      "Throwing it into a pit, behind the Wallmonger's wall, into the shaft's neon barricades, or against a wall it clips through loses it for the run.",
      "Flight (Wax Wings, Jetpack) lets you dodge without rolling, and an Escape Rope skips straight through the Forge to the Blacksmith.",
      "The Lord of the Jammed can kill you during the handoff cutscene — lose him first.",
      "It can't be sold to the Sell Creep. If you lose it and a Clone respawns you, it's back in the floor-2 shaft.",
    ],
    related: ["wax-wings", "jetpack", "escape-rope"],
  },
  "old-crest": {
    goal: "Place it on the altar in the Gungeon Proper to open the stairs to the Abbey of the True Gun.",
    steps: [
      "Find it in a special room in the Oubliette (the secret floor under the Keep).",
      "Get through the rest of the Oubliette and into the Gungeon Proper (floor 2) without taking a single hit — the Crest is a piece of armor that breaks on any damage.",
      "Find the altar on floor 2 and place the Crest to reveal the stairs down to the Abbey. You get a regular piece of armor back.",
    ],
    tips: [
      "The Crest always sits at the end of your health bar, so picking up normal armor doesn't shield it — it just gets hit first next time.",
      "Full Metal Jacket does protect it.",
      "Self-damage from Cigarettes breaks it; losing heart containers to shrines, Master Rounds or Spice does not.",
      "It can't be dropped, and the Rat can't steal it.",
    ],
    related: ["full-metal-jacket"],
  },
  "prime-primer": {
    goal: "One of the four parts of the Bullet That Can Kill The Past.",
    steps: [
      "Buy it from the shop in the Gungeon Proper (floor 2) for 110 money. Shop discounts don't apply.",
      "Keep it until the Forge and give it to the Blacksmith along with the other three parts.",
    ],
    tips: [
      "Stealing it isn't worth it — surviving Bello's attack closes the shop and the Primer vanishes.",
      "It sits in a glass case, so the Grappling Hook can't snag it.",
      ...BULLET_PART_TIPS,
    ],
    related: BULLET_PARTS,
  },
  "arcane-gunpowder": {
    goal: "One of the four parts of the Bullet That Can Kill The Past.",
    steps: [
      "In the Black Powder Mine (floor 3), find the big, seemingly empty room full of floating minecarts over a chasm.",
      "Ride the carts across on their invisible rails, dodge rolling from cart to cart. Rolling into a cart seats you in it; slow one down to line up the next jump.",
      "Grab the Gunpowder on the far side and carry it to the Blacksmith in the Forge.",
    ],
    tips: [
      "It's the only active-item part, so it takes up an active slot — The Pilot's extra slot helps.",
      "Any flight item lets you skip the minecarts entirely.",
      "Falling into the pit resets the room and deletes anything you dropped there.",
      "In co-op, it vanishes if whoever holds it dies. The Rat can't steal it.",
      ...BULLET_PART_TIPS,
    ],
    related: [...BULLET_PARTS.filter((id) => id !== "arcane-gunpowder"), "wax-wings"],
  },
  "planar-lead": {
    goal: "One of the four parts of the Bullet That Can Kill The Past.",
    steps: [
      "In the Hollow (floor 4), find the large, seemingly empty room with a chasm on the right. The Lead sits on the far side.",
      "Find the invisible path across: fire and reload so shell casings land on the floor, or use a gun that leaves liquid or debris (Mega Douser) to reveal it.",
      "Walk the revealed path, grab the Lead, and carry it to the Blacksmith in the Forge.",
    ],
    tips: [
      "Falling off rerolls the path and clears your casings — start over.",
      "Amulet of the Pit Lord removes the fall penalty, so trial and error works.",
      "Flight, the Grappling Hook, or a charged Bloodied Scarf blink from the ledge skip the path.",
      ...BULLET_PART_TIPS,
    ],
    related: [
      ...BULLET_PARTS.filter((id) => id !== "planar-lead"),
      "mega-douser",
      "amulet-of-the-pit-lord",
      "grappling-hook",
    ],
  },
  "obsidian-shell-casing": {
    goal: "One of the four parts of the Bullet That Can Kill The Past.",
    steps: [
      "Beat the High Dragun at the end of the Forge.",
      "Shoot its skull to break it and pick up the Casing.",
      "Give it to the Blacksmith with the other three parts.",
    ],
    tips: [
      "The Rat never steals it, and it can't be dropped once picked up.",
      "It's the only part you can get again after handing it over.",
      ...BULLET_PART_TIPS,
    ],
    related: BULLET_PARTS.filter((id) => id !== "obsidian-shell-casing"),
  },
  "infuriating-note": {
    goal: "Collect all six to learn the route through the maze in the Resourceful Rat's Lair.",
    steps: [
      "Notes drop from chests once their condition is met; each one reveals one turn of the maze and stays in your Ammonomicon.",
      "1st: beat the Gungeon Proper. 2nd: have an item stolen by the Rat. 3rd: enter the Oubliette.",
      "4th: get a Master Round. 5th: kill Fuselier. 6th: kill the High Dragun — this one only comes from a Mimic.",
    ],
    tips: ["Once all six have been found, no more notes appear."],
  },
};

export function getItemGuide(id: string): ItemGuide | undefined {
  return ITEM_GUIDES[id];
}
