import test from "node:test";
import assert from "node:assert/strict";
import { getGameData } from "../src/lib/game-data";
import { computeRunView, computeItemDetail } from "../src/lib/run-core";

// Guards on the generated dataset (scripts/build-dataset.py) and how the app
// derives views from it. These catch regressions in the build script that the
// engine unit tests (which use hand-built fixtures) cannot.

const data = getGameData();
const byName = new Map(data.synergies.map((s) => [s.name, s]));

test("Chief Master needs Alien Sidearm plus any two Master Rounds", () => {
  const s = byName.get("Chief Master");
  assert.ok(s, "Chief Master missing from dataset");
  assert.equal(s.requiredGroups, 2);
  assert.equal(s.groups.length, 2);
  assert.deepEqual(s.groups[0].items.map((i) => i.id), ["alien-sidearm"]);
  assert.equal(s.groups[0].minItems, 1);
  assert.equal(s.groups[1].minItems, 2);
  assert.deepEqual(
    s.groups[1].items.map((i) => i.id).sort(),
    ["master-round-i", "master-round-ii", "master-round-iii", "master-round-iv", "master-round-v"],
  );
});

test("Alien Sidearm alone does not activate Chief Master", () => {
  const view = computeRunView("r", "Run", ["alien-sidearm"]);
  assert.equal(view.active.some((s) => s.id === "chief-master"), false);
  const nearly = view.nearly.find((s) => s.id === "chief-master");
  assert.ok(nearly);
  assert.equal(nearly.needed.length, 1);
  assert.equal(nearly.needed[0].stillNeeded, 2);
  assert.equal(nearly.needed[0].options.length, 5);
});

test("Chief Master: one Master Round held leaves one to go, listing only the rest", () => {
  const view = computeRunView("r", "Run", ["alien-sidearm", "master-round-ii"]);
  const nearly = view.nearly.find((s) => s.id === "chief-master");
  assert.ok(nearly);
  assert.equal(nearly.needed[0].stillNeeded, 1);
  assert.equal(nearly.needed[0].options.some((o) => o.id === "master-round-ii"), false);
  assert.equal(nearly.needed[0].options.length, 4);
});

test("Chief Master activates with two Master Rounds", () => {
  const view = computeRunView("r", "Run", ["alien-sidearm", "master-round-i", "master-round-v"]);
  assert.ok(view.active.some((s) => s.id === "chief-master"));

  const detail = computeItemDetail("alien-sidearm", new Set(["alien-sidearm", "master-round-i"]));
  const cm = detail?.synergies.find((s) => s.id === "chief-master");
  assert.ok(cm);
  assert.equal(cm.status, "one_away");
  assert.equal(cm.groups[1].minItems, 2);
  assert.equal(cm.groups[1].satisfied, false);
});

test("nested all_of sides resolve to mandatory groups", () => {
  for (const name of ["Super Serum", "Unbelievably Charming"]) {
    const s = byName.get(name);
    assert.ok(s, `${name} missing from dataset`);
    assert.equal(s.requiredGroups, 4);
    assert.equal(s.groups.length, 4);
    assert.ok(s.groups.every((g) => g.minItems === 1 && g.items.length === 1));
  }
});

test("no HTML entities leak into display text", () => {
  const entity = /&(#\d+|[a-z]+);/i;
  for (const i of data.items) {
    assert.doesNotMatch(i.description, entity, i.id);
    if (i.quote) assert.doesNotMatch(i.quote, entity, i.id);
  }
  for (const s of data.synergies) assert.doesNotMatch(s.effect, entity, s.id);
  const silver = data.itemsById.get("silver-bullets");
  assert.equal(
    silver?.description,
    "Increases damage to jammed enemies by 225% and Increases damage to bosses by 25%.",
  );
});
