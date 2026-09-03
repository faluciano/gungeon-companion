import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateSynergy,
  activeSynergies,
  nearlyActiveSynergies,
  reportItemSynergies,
} from "../src/lib/synergy/engine";
import type { GameItem, ResolvedSynergy } from "../src/lib/game-data";

function it(id: string, name = id): GameItem {
  return { id, name, type: "gun", quality: "C", description: "", quote: null, imageUrl: null };
}

const scope = it("scope", "Scope");
const awp = it("awp", "A.W.P.");
const sniper = it("sniper", "Sniper Rifle");
const bomb = it("bomb", "Bomb");
const rocket = it("rocket", "Rocket");

// "360 Yes Scope": Scope AND (A.W.P. OR Sniper Rifle) — 2 groups, both required.
const yesScope: ResolvedSynergy = {
  id: "360-yes-scope",
  name: "360 Yes Scope",
  effect: "Spin buff.",
  requiredGroups: 2,
  groups: [
    { index: 0, items: [scope], minItems: 1 },
    { index: 1, items: [awp, sniper], minItems: 1 },
  ],
};

// "two_of" style: any 2 of 3 groups.
const twoOf: ResolvedSynergy = {
  id: "combo",
  name: "Combo",
  effect: "Boom.",
  requiredGroups: 2,
  groups: [
    { index: 0, items: [bomb], minItems: 1 },
    { index: 1, items: [rocket], minItems: 1 },
    { index: 2, items: [scope], minItems: 1 },
  ],
};

test("potential when nothing owned", () => {
  const e = evaluateSynergy(yesScope, new Set());
  assert.equal(e.status, "potential");
  assert.equal(e.satisfiedGroups, 0);
});

test("one_away when one of two required groups satisfied", () => {
  const e = evaluateSynergy(yesScope, new Set(["scope"]));
  assert.equal(e.status, "one_away");
  assert.equal(e.satisfiedGroups, 1);
  assert.equal(e.ownedContributors[0].id, "scope");
});

test("active when both groups satisfied (via alternative member)", () => {
  const e = evaluateSynergy(yesScope, new Set(["scope", "sniper"]));
  assert.equal(e.status, "active");
  assert.equal(e.satisfiedGroups, 2);
});

test("OR group: either alternative satisfies the group", () => {
  const withAwp = evaluateSynergy(yesScope, new Set(["scope", "awp"]));
  assert.equal(withAwp.status, "active");
});

test("two_of: any two of three groups activates", () => {
  assert.equal(evaluateSynergy(twoOf, new Set(["bomb"])).status, "one_away");
  assert.equal(evaluateSynergy(twoOf, new Set(["bomb", "scope"])).status, "active");
  assert.equal(evaluateSynergy(twoOf, new Set(["rocket", "scope"])).status, "active");
});

test("activeSynergies / nearlyActiveSynergies filter correctly", () => {
  const owned = new Set(["scope"]);
  assert.equal(activeSynergies([yesScope, twoOf], owned).length, 0);
  const near = nearlyActiveSynergies([yesScope, twoOf], owned);
  assert.deepEqual(near.map((e) => e.synergy.id).sort(), ["360-yes-scope", "combo"]);
});

test("reportItemSynergies flags activatesOnAdd", () => {
  const owned = new Set(["scope"]);
  const reports = reportItemSynergies(sniper, [yesScope], owned);
  assert.equal(reports[0].activatesOnAdd, true);
  assert.equal(reports[0].alreadyOwned, false);
});

test("reportItemSynergies: already-active does not re-activate", () => {
  const owned = new Set(["scope", "sniper"]);
  const reports = reportItemSynergies(sniper, [yesScope], owned);
  assert.equal(reports[0].alreadyOwned, true);
  assert.equal(reports[0].activatesOnAdd, false);
  assert.equal(reports[0].evaluation.status, "active");
});

// "Chief Master": Alien Sidearm AND any TWO Master Rounds — the second group
// needs two distinct members owned at once, not just one.
const sidearm = it("alien-sidearm", "Alien Sidearm");
const mr1 = it("master-round-i", "Master Round I");
const mr2 = it("master-round-ii", "Master Round II");
const mr3 = it("master-round-iii", "Master Round III");
const chiefMaster: ResolvedSynergy = {
  id: "chief-master",
  name: "Chief Master",
  effect: "Auto Alien Sidearm.",
  requiredGroups: 2,
  groups: [
    { index: 0, items: [sidearm], minItems: 1 },
    { index: 1, items: [mr1, mr2, mr3], minItems: 2 },
  ],
};

test("minItems group: one Master Round is not enough", () => {
  const e = evaluateSynergy(chiefMaster, new Set(["alien-sidearm", "master-round-i"]));
  assert.equal(e.status, "one_away");
  assert.equal(e.satisfiedGroups, 1);
  assert.deepEqual(e.missingGroups.map((g) => g.index), [1]);
  // The held Master Round still counts as progress.
  assert.deepEqual(e.ownedContributors.map((i) => i.id).sort(), [
    "alien-sidearm",
    "master-round-i",
  ]);
});

test("minItems group: two Master Rounds activate", () => {
  const e = evaluateSynergy(
    chiefMaster,
    new Set(["alien-sidearm", "master-round-i", "master-round-iii"]),
  );
  assert.equal(e.status, "active");
  assert.equal(e.satisfiedGroups, 2);
});

test("minItems group: Master Rounds alone never activate", () => {
  const e = evaluateSynergy(
    chiefMaster,
    new Set(["master-round-i", "master-round-ii", "master-round-iii"]),
  );
  assert.equal(e.status, "one_away");
  assert.equal(e.satisfiedGroups, 1);
});

test("minItems group: activatesOnAdd for the second Master Round only", () => {
  const withOne = new Set(["alien-sidearm", "master-round-i"]);
  assert.equal(reportItemSynergies(mr2, [chiefMaster], withOne)[0].activatesOnAdd, true);
  const withNone = new Set(["alien-sidearm"]);
  assert.equal(reportItemSynergies(mr2, [chiefMaster], withNone)[0].activatesOnAdd, false);
});
