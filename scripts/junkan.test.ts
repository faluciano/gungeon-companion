import test from "node:test";
import assert from "node:assert/strict";
import {
  junkanStatus,
  JUNKAN_RANKS,
  GOLD_JUNK_ID,
  JUNK_ID,
  LIES_ID,
  SER_JUNKAN_ID,
} from "../src/lib/junkan";

const owned = (...ids: string[]) => new Set(ids);
const qty = (entries: [string, number][] = []) => new Map(entries);

test("no status without Ser Junkan", () => {
  assert.equal(junkanStatus(owned(JUNK_ID), qty([[JUNK_ID, 5]])), null);
});

test("Peasant with no junk", () => {
  const s = junkanStatus(owned(SER_JUNKAN_ID), qty());
  assert.equal(s?.current.rank, "Peasant");
  assert.equal(s?.junkCount, 0);
  assert.equal(s?.next?.junk, 1);
});

test("owned junk with no explicit quantity counts once", () => {
  const s = junkanStatus(owned(SER_JUNKAN_ID, JUNK_ID), qty());
  assert.equal(s?.current.rank, "Squire");
  assert.equal(s?.junkCount, 1);
});

test("ranks track junk quantity", () => {
  for (const r of JUNKAN_RANKS) {
    const s = junkanStatus(
      owned(SER_JUNKAN_ID, JUNK_ID),
      qty([[JUNK_ID, Math.max(1, r.junk)]]),
    );
    if (r.junk === 0) continue; // owning any junk implies count >= 1
    assert.equal(s?.current.rank, r.rank, `at ${r.junk} junk`);
  }
});

test("Lies count toward the rank", () => {
  const s = junkanStatus(
    owned(SER_JUNKAN_ID, JUNK_ID, LIES_ID),
    qty([
      [JUNK_ID, 2],
      [LIES_ID, 1],
    ]),
  );
  assert.equal(s?.junkCount, 3);
  assert.equal(s?.current.rank, "Knight");
});

test("caps at Angelic Knight past 7 junk", () => {
  const s = junkanStatus(owned(SER_JUNKAN_ID, JUNK_ID), qty([[JUNK_ID, 12]]));
  assert.equal(s?.current.rank, "Angelic Knight");
  assert.equal(s?.next, null);
});

test("Gold Junk overrides everything with Mecha Junkan", () => {
  const s = junkanStatus(
    owned(SER_JUNKAN_ID, JUNK_ID, GOLD_JUNK_ID),
    qty([[JUNK_ID, 3]]),
  );
  assert.equal(s?.current.rank, "Mecha Junkan");
  assert.equal(s?.mecha, true);
  assert.equal(s?.next, null);
});
