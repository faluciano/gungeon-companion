import type { GameItem, ResolvedSynergy, SynergyGroup } from "@/lib/game-data";

export type SynergyStatus = "active" | "one_away" | "potential";

export type SynergyEvaluation = {
  synergy: ResolvedSynergy;
  status: SynergyStatus;
  satisfiedGroups: number;
  // Groups still needed for the synergy to become active.
  missingGroups: SynergyGroup[];
  // Owned items that currently contribute to this synergy.
  ownedContributors: GameItem[];
};

/** Evaluate a single synergy against a set of owned item ids. */
export function evaluateSynergy(
  synergy: ResolvedSynergy,
  owned: Set<string>,
): SynergyEvaluation {
  const satisfied: SynergyGroup[] = [];
  const missing: SynergyGroup[] = [];
  const contributors: GameItem[] = [];

  for (const group of synergy.groups) {
    const hit = group.items.filter((i) => owned.has(i.id));
    if (hit.length > 0) {
      satisfied.push(group);
      contributors.push(...hit);
    } else {
      missing.push(group);
    }
  }

  const satisfiedGroups = satisfied.length;
  const active = satisfiedGroups >= synergy.requiredGroups;
  const status: SynergyStatus = active
    ? "active"
    : satisfiedGroups >= synergy.requiredGroups - 1
      ? "one_away"
      : "potential";

  return {
    synergy,
    status,
    satisfiedGroups,
    missingGroups: missing,
    ownedContributors: contributors,
  };
}

/** All synergies that are currently active for a run. */
export function activeSynergies(
  synergies: ResolvedSynergy[],
  owned: Set<string>,
): SynergyEvaluation[] {
  return synergies
    .map((s) => evaluateSynergy(s, owned))
    .filter((e) => e.status === "active");
}

/** Synergies that are exactly one group away from activating. */
export function nearlyActiveSynergies(
  synergies: ResolvedSynergy[],
  owned: Set<string>,
): SynergyEvaluation[] {
  return synergies
    .map((s) => evaluateSynergy(s, owned))
    .filter((e) => e.status === "one_away");
}

export type ItemSynergyReport = {
  evaluation: SynergyEvaluation;
  // True if adding `itemId` to the run would newly activate this synergy.
  activatesOnAdd: boolean;
  // True if the item is already in the run.
  alreadyOwned: boolean;
};

/**
 * Report how a given item relates to the current run: for every synergy the
 * item participates in, whether it is already active, and whether adding this
 * item (if not owned) would activate it.
 */
export function reportItemSynergies(
  item: GameItem,
  itemSynergies: ResolvedSynergy[],
  owned: Set<string>,
): ItemSynergyReport[] {
  const alreadyOwned = owned.has(item.id);
  const withItem = new Set(owned);
  withItem.add(item.id);

  return itemSynergies
    .map((synergy) => {
      const evaluation = evaluateSynergy(synergy, owned);
      const withEval = evaluateSynergy(synergy, withItem);
      const activatesOnAdd =
        !alreadyOwned && withEval.status === "active" && evaluation.status !== "active";
      return { evaluation, activatesOnAdd, alreadyOwned };
    })
    .sort((a, b) => {
      // Prioritise: activates-on-add > already active > one-away > potential.
      const rank = (r: ItemSynergyReport) =>
        r.activatesOnAdd
          ? 0
          : r.evaluation.status === "active"
            ? 1
            : r.evaluation.status === "one_away"
              ? 2
              : 3;
      return rank(a) - rank(b);
    });
}
