// Resolve an Ammonomicon icon URL for every item by querying the Enter the
// Gungeon Wiki (Fandom) MediaWiki API. Writes `imageUrl` back into dataset.json.
// Images are hotlinked from Fandom's CDN (not redistributed into this repo).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATASET = path.join(__dirname, "..", "src", "lib", "data", "dataset.json");
const API = "https://enterthegungeon.fandom.com/api.php";
const UA = "gungeon-companion/1.0 (fan project)";

/** Manual overrides for items whose icon filename differs from the item name. */
const OVERRIDES = {
  "C4": "C4 (Item)",
  "Ser Junkan": "Ser Junkan 1",
  "Lies": "Junk",
};

/** Candidate wiki filenames for an item name, most-specific first. */
function candidates(name) {
  const set = new Set();
  const add = (s) => s && set.add(`File:${s}.png`);
  if (OVERRIDES[name]) add(OVERRIDES[name]);
  add(name);
  // Roman-numeral variants ("Master Round I" -> "Master Round").
  const roman = name.match(/^(.*) [IVX]+$/);
  if (roman) add(roman[1]);
  // Ampersand / plus spelled forms occasionally differ.
  if (name.includes("&")) add(name.replace(/&/g, "and"));
  return [...set];
}

async function resolveBatch(titles) {
  const url = `${API}?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(
    titles.join("|"),
  )}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  const out = new Map(); // normalized "File:Name.png" -> clean url
  // Map any normalized titles back so we can match our exact inputs.
  const norm = new Map();
  for (const n of json.query?.normalized ?? []) norm.set(n.to, n.from);
  for (const k in json.query?.pages ?? {}) {
    const pg = json.query.pages[k];
    if (pg.imageinfo?.[0]?.url) {
      const clean = pg.imageinfo[0].url.split("?")[0];
      const key = norm.get(pg.title) ?? pg.title;
      out.set(key, clean);
      out.set(pg.title, clean);
    }
  }
  return out;
}

function chunk(arr, n) {
  const r = [];
  for (let i = 0; i < arr.length; i += n) r.push(arr.slice(i, i + n));
  return r;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATASET, "utf8"));
  const items = data.items;

  // Build the full candidate list (dedup titles across items).
  const perItem = items.map((it) => ({ it, cands: candidates(it.name) }));
  const allTitles = [...new Set(perItem.flatMap((p) => p.cands))];

  console.log(`Resolving ${items.length} items via ${allTitles.length} candidate titles...`);
  const resolved = new Map();
  for (const group of chunk(allTitles, 50)) {
    const m = await resolveBatch(group);
    for (const [k, v] of m) resolved.set(k, v);
    process.stdout.write(".");
  }
  process.stdout.write("\n");

  let hit = 0;
  const misses = [];
  for (const { it, cands } of perItem) {
    const found = cands.map((c) => resolved.get(c)).find(Boolean);
    if (found) {
      it.imageUrl = found;
      hit++;
    } else {
      it.imageUrl = null;
      misses.push(it.name);
    }
  }

  fs.writeFileSync(DATASET, JSON.stringify(data, null, 2) + "\n");
  console.log(`Resolved ${hit}/${items.length} icons.`);
  if (misses.length) {
    console.log(`Misses (${misses.length}):`, misses.slice(0, 60).join(", "));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
