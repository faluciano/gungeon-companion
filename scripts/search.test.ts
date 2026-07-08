import test from "node:test";
import assert from "node:assert/strict";
import { searchItems, normalize } from "../src/lib/search";
import type { GameItem } from "../src/lib/game-data";

function item(partial: Partial<GameItem> & { id: string; name: string }): GameItem {
  return {
    type: "gun",
    quality: "C",
    description: "",
    quote: null,
    ...partial,
  };
}

const items: GameItem[] = [
  item({ id: "a-w-p", name: "A.W.P.", type: "gun", description: "A powerful sniper that can instantly kill most enemies." }),
  item({ id: "sniper-rifle", name: "Sniper Rifle", type: "gun", description: "Fires bullets that can pierce through one enemy." }),
  item({ id: "scope", name: "Scope", type: "passive", description: "Decreases bullet spread by 60%.", quote: "Steady Aim" }),
  item({ id: "m1-multi-tool", name: "M1 Multi-Tool", type: "passive", description: "Increases curse." }),
  item({ id: "m1", name: "M1", type: "gun", description: "A reliable rifle." }),
  item({ id: "budget-revolver", name: "Budget Revolver", type: "gun", description: "The starting pistol." }),
  item({ id: "roll-bomb", name: "Roll Bomb", type: "active", description: "Dropping a bomb while dodge rolling." }),
  item({ id: "railgun", name: "Railgun", type: "gun", description: "A charged precision rail weapon." }),
  item({ id: "megahand", name: "Megahand", type: "gun", description: "Charge to fire a powerful shot." }),
  item({ id: "power-wash", name: "Power Wash", type: "gun", description: "Sprays water." }),
];

const synergyNamesById = new Map<string, string[]>([
  ["scope", ["360 Yes Scope"]],
  ["a-w-p", ["360 Yes Scope"]],
  ["sniper-rifle", ["360 Yes Scope"]],
]);

function ids(q: string, opts = {}) {
  return searchItems(items, q, { synergyNamesById, ...opts }).map((h) => h.item.id);
}

test("normalize strips punctuation and accents", () => {
  assert.equal(normalize("A.W.P."), "a w p");
  assert.equal(normalize("Röntgen  Gun!"), "rontgen gun");
});

test("punctuation-insensitive: 'awp' finds A.W.P.", () => {
  assert.equal(ids("awp")[0], "a-w-p");
});

test("dotted query 'a.w.p' finds A.W.P.", () => {
  assert.equal(ids("a.w.p")[0], "a-w-p");
});

test("single-char tokens don't create noise: 'a.w.p' excludes 'Power Wash'", () => {
  const r = ids("a.w.p");
  assert.equal(r[0], "a-w-p");
  assert.ok(!r.includes("power-wash"));
});

test("acronym: 'sr' finds Sniper Rifle", () => {
  assert.ok(ids("sr").includes("sniper-rifle"));
});

test("exact name ranks first: 'm1' returns M1 before M1 Multi-Tool", () => {
  const r = ids("m1");
  assert.equal(r[0], "m1");
  assert.ok(r.includes("m1-multi-tool"));
});

test("prefix match: 'snip' finds Sniper Rifle", () => {
  assert.equal(ids("snip")[0], "sniper-rifle");
});

test("description search: 'pierce' finds Sniper Rifle", () => {
  assert.ok(ids("pierce").includes("sniper-rifle"));
});

test("quote search: 'steady aim' finds Scope", () => {
  assert.ok(ids("steady aim").includes("scope"));
});

test("synergy-name search: 'yes scope' surfaces synergy components", () => {
  const r = ids("yes scope");
  assert.ok(r.includes("scope"));
  assert.ok(r.includes("a-w-p"));
  assert.ok(r.includes("sniper-rifle"));
});

test("typo tolerance: 'snipr' finds Sniper Rifle", () => {
  assert.ok(ids("snipr").includes("sniper-rifle"));
});

test("typo tolerance: 'ralgun' finds Railgun", () => {
  assert.ok(ids("ralgun").includes("railgun"));
});

test("multi-word AND: 'multi tool' finds M1 Multi-Tool", () => {
  assert.ok(ids("multi tool").includes("m1-multi-tool"));
});

test("type filter restricts results", () => {
  const guns = searchItems(items, "", { type: "gun" });
  assert.ok(guns.every((h) => h.item.type === "gun"));
  const passives = searchItems(items, "scope", { type: "passive", synergyNamesById });
  assert.ok(passives.every((h) => h.item.type === "passive"));
});

test("empty query returns alphabetical catalogue", () => {
  const all = searchItems(items, "");
  const names = all.map((h) => h.item.name);
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(names, sorted);
});

test("nonsense query returns nothing", () => {
  assert.equal(ids("zzzzxqqq").length, 0);
});

test("compact acronym: 'mmt' finds M1 Multi-Tool", () => {
  assert.ok(ids("mmt").includes("m1-multi-tool"));
});
