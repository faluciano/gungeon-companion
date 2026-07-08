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
  return { id, name, type: "gun", quality: "C", description: "", quote: null };
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
    { index: 0, items: [scope] },
    { index: 1, items: [awp, sniper] },
  ],
};

// "two_of" style: any 2 of 3 groups.
const twoOf: ResolvedSynergy = {
  id: "combo",
  name: "Combo",
  effect: "Boom.",
  requiredGroups: 2,
  groups: [
    { index: 0, items: [bomb] },
    { index: 1, items: [rocket] },
    { index: 2, items: [scope] },
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
