import test from "node:test";
import assert from "node:assert/strict";
import { buildShareUrl, decodeRun, encodeRun } from "../src/lib/share";
import { JUNK_ID } from "../src/lib/junkan";
import { getGameData } from "../src/lib/game-data";
import shareIndex from "../src/lib/data/share-index.json";

test("round-trips a run with stack quantities", () => {
  const ids = ["casey", "heart-of-ice", JUNK_ID];
  const encoded = encodeRun(ids, new Map([[JUNK_ID, 3]]));
  const decoded = decodeRun(encoded);
  assert.deepEqual(decoded?.itemIds.sort(), [...ids].sort());
  assert.deepEqual(decoded?.quantities, { [JUNK_ID]: 3 });
});

test("compact links carry no item names", () => {
  const encoded = encodeRun(["casey", "heart-of-ice", JUNK_ID]);
  assert.match(encoded, /^[0-9a-z]{1,4}(\.[0-9a-z]{1,4})*$/);
});

test("decodes a full hash with the r= prefix", () => {
  const decoded = decodeRun(`#r=${encodeRun(["casey"])}`);
  assert.deepEqual(decoded?.itemIds, ["casey"]);
});

test("legacy slug links still decode", () => {
  const decoded = decodeRun("#run=casey,heart-of-ice~5,junk~3,not-a-real-item");
  assert.deepEqual(decoded?.itemIds.sort(), ["casey", "heart-of-ice", "junk"]);
  // heart-of-ice isn't stackable — its quantity is dropped.
  assert.deepEqual(decoded?.quantities, { junk: 3 });
});

test("bare legacy payloads decode via fallback", () => {
  const decoded = decodeRun("heart-of-ice,ice-cube");
  assert.deepEqual(decoded?.itemIds.sort(), ["heart-of-ice", "ice-cube"]);
});

test("drops out-of-range tokens and duplicates", () => {
  const casey = encodeRun(["casey"]);
  const decoded = decodeRun(`${casey}.${casey}.zzzz`);
  assert.deepEqual(decoded?.itemIds, ["casey"]);
});

test("clamps stack counts to 99", () => {
  const decoded = decodeRun(encodeRun([JUNK_ID], new Map([[JUNK_ID, 500]])));
  assert.equal(decoded?.quantities[JUNK_ID], 99);
});

test("returns null for empty or garbage links", () => {
  assert.equal(decodeRun(""), null);
  assert.equal(decodeRun("#r="), null);
  assert.equal(decodeRun("%%%,,,~~~"), null);
});

test("encode is deterministic regardless of insertion order", () => {
  assert.equal(encodeRun(["casey", "bullet"]), encodeRun(["bullet", "casey"]));
});

test("share URLs point at the /share viewer", () => {
  const url = buildShareUrl("https://gungeoncompanion.com", ["casey"]);
  assert.match(url, /^https:\/\/gungeoncompanion\.com\/share#r=[0-9a-z]{1,4}$/);
});

// share-index.json positions are baked into links people have already shared.
// If this fails after a dataset update, APPEND the new slugs to the END of
// share-index.json — never re-sort or remove entries.
test("share index covers every dataset item and stays append-only", () => {
  const data = getGameData();
  const indexed = new Set(shareIndex as string[]);
  assert.equal(indexed.size, (shareIndex as string[]).length, "index has duplicates");
  for (const [id] of data.itemsById) {
    assert.ok(indexed.has(id), `"${id}" missing from share-index.json — append it to the end`);
  }
});
