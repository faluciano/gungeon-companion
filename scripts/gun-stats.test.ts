import test from "node:test";
import assert from "node:assert/strict";
import { getGameData } from "../src/lib/game-data";
import {
  gunClassLabel,
  gunStatRows,
  qualitySource,
  statDisplay,
  statNumber,
  STAT_DEFS,
} from "../src/lib/gun-stats";

const data = getGameData();
const gun = (id: string) => {
  const it = data.itemsById.get(id);
  assert.ok(it?.stats, `${id} missing gun stats`);
  return it;
};

test("every gun carries stats and no passive or active does", () => {
  for (const i of data.items) {
    if (i.type === "gun") {
      assert.ok(i.stats, `${i.id} has no stats`);
      assert.ok(i.stats.fireMode, `${i.id} has no fire mode`);
      assert.ok(i.stats.gunClass, `${i.id} has no gun class`);
    } else {
      assert.equal(i.stats, undefined, `${i.id} should not have gun stats`);
    }
  }
});

test("only the four unlimited-ammo guns are flagged infinite", () => {
  const infinite = data.items
    .filter((i) => i.stats?.infiniteAmmo)
    .map((i) => i.id)
    .sort();
  assert.deepEqual(infinite, ["casey", "dueling-laser", "elimentaler", "gunther"]);
  for (const id of infinite) assert.equal(data.itemsById.get(id)!.stats!.ammoCapacity, null);
});

test("multi-part wiki cells are split readably", () => {
  assert.equal(gun("shellegun").stats!.magazineSize, "12 (pistol) · 20 (beam)");
  assert.equal(gun("bullet").stats!.damage, "Gun: 7 · Bullet: 4");
  assert.equal(gun("triple-gun").stats!.dps, "16.7 / 46.2 / 160.0");
  assert.equal(gun("big-shotgun").stats!.damage, "Large: 45 (15x3) · Small: 5.5");
  // Per-second beam damage keeps its "/s".
  assert.match(gun("raiden-coil").stats!.damage ?? "", /\/s$/);
  for (const i of data.items) {
    for (const [k, v] of Object.entries(i.stats ?? {})) {
      if (typeof v === "string") assert.doesNotMatch(v, /\\n|  /, `${i.id}.${k}: ${v}`);
    }
  }
});

test("statNumber reads the leading figure and rejects prose", () => {
  assert.equal(statNumber("50.0"), 50);
  assert.equal(statNumber("34.6-69.2"), 34.6);
  assert.equal(statNumber("Uncharged: 10 · Charged: 20"), null);
  assert.equal(statNumber("12 (pistol) · 20 (beam)"), 12);
  assert.equal(statNumber("≥0.9"), 0.9);
  assert.equal(statNumber("~110/s"), 110);
  assert.equal(statNumber("Varies"), null);
  assert.equal(statNumber("Equal to Shells held"), null);
  assert.equal(statNumber(null), null);
});

test("statDisplay adds units to plain numbers and shows ∞ for unlimited ammo", () => {
  const casey = gun("casey").stats!;
  const def = (key: string) => STAT_DEFS.find((d) => d.key === key)!;
  assert.equal(statDisplay(def("fireRate"), casey), "0.20s");
  assert.equal(statDisplay(def("ammoCapacity"), casey), "∞");
  assert.equal(statDisplay(def("shotSpeed"), casey), null);
  assert.equal(statDisplay(def("damage"), casey), "100");
});

test("gunStatRows ranks against all guns and inverts lower-is-better stats", () => {
  const casey = gun("casey");
  const rows = gunStatRows(casey, data.items);
  const byKey = new Map(rows.map((r) => [r.def.key, r]));

  // Stats the wiki leaves blank are omitted entirely.
  assert.equal(byKey.has("shotSpeed"), false);
  assert.equal(byKey.has("spread"), false);

  const force = byKey.get("force")!;
  assert.equal(force.rank, 1, "Casey's 120 force should top the chart");
  assert.equal(force.score, 1);

  const ammo = byKey.get("ammoCapacity")!;
  assert.equal(ammo.display, "∞");
  assert.equal(ammo.rank, null);

  // Fire rate: lower is better, so a fast gun outranks a slow one.
  const fast = gunStatRows(gun("finished-gun"), data.items).find((r) => r.def.key === "fireRate")!;
  const slow = gunStatRows(gun("casey"), data.items).find((r) => r.def.key === "fireRate")!;
  assert.ok(fast.rank! < slow.rank!, `expected ${fast.rank} < ${slow.rank}`);
  assert.ok(fast.score! > slow.score!);

  for (const r of rows) {
    if (r.score == null) continue;
    assert.ok(r.score >= 0 && r.score <= 1, `${r.def.key} score ${r.score}`);
    assert.ok(r.rank! >= 1 && r.rank! <= r.of, `${r.def.key} rank ${r.rank} of ${r.of}`);
  }
});

test("passives and actives have no stat rows", () => {
  assert.deepEqual(gunStatRows(data.itemsById.get("master-round-i")!, data.items), []);
});

test("labels", () => {
  assert.equal(gunClassLabel("FULLAUTO"), "Full auto");
  assert.equal(gunClassLabel("PISTOL"), "Pistol");
  assert.equal(gunClassLabel("UNKNOWN"), "Unknown");
  assert.equal(qualitySource("S"), "Black chests");
  assert.equal(qualitySource("N"), "Not found in chests");
});
