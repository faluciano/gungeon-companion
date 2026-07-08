import type { GameItem } from "@/lib/game-data";

// Robust, typo-tolerant search over the item catalogue.
//
// Design goals (see the "search should work extremely well" requirement):
//  - Punctuation/diacritic insensitive: "awp" finds "A.W.P.", "m1" finds "M1 Multi-Tool".
//  - Acronym aware: "sr" finds "Sniper Rifle".
//  - Searches names, descriptions, flavour quotes, and related synergy names.
//  - Multi-word queries match when every word is present (AND semantics).
//  - Tolerates small typos via subsequence + Levenshtein fallbacks.
//  - Deterministic, relevance-ranked results.

export type SearchHit = { item: GameItem; score: number };

type IndexEntry = {
  item: GameItem;
  nameNorm: string;
  nameCompact: string;
  nameTokens: string[];
  acronym: string;
  descNorm: string;
  quoteNorm: string;
  synergyNorm: string;
  haystack: string; // name + desc + quote + synergies, normalized
};

// Fold accents, lowercase, and replace every non-alphanumeric run with a single
// space. "A.W.P." -> "a w p", "Röntgen" -> "rontgen".
export function normalize(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function compact(input: string): string {
  return normalize(input).replace(/ /g, "");
}

function acronymOf(nameNorm: string): string {
  return nameNorm
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("");
}

function isSubsequence(needle: string, haystack: string): boolean {
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (haystack[j] === needle[i]) i++;
  }
  return i === needle.length;
}

function levenshtein(a: string, b: string, max: number): number {
  // Early-exit banded Levenshtein; returns a value > max if it clearly exceeds.
  const al = a.length;
  const bl = b.length;
  if (Math.abs(al - bl) > max) return max + 1;
  let prev = new Array<number>(bl + 1);
  let curr = new Array<number>(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;
  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    const ac = a.charCodeAt(i - 1);
    for (let j = 1; j <= bl; j++) {
      const cost = ac === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[bl];
}

function fuzzThreshold(len: number): number {
  if (len >= 8) return 2;
  if (len >= 4) return 1;
  return 0;
}

const indexCache = new WeakMap<GameItem[], IndexEntry[]>();

function buildIndex(
  items: GameItem[],
  synergyNamesById?: Map<string, string[]>,
): IndexEntry[] {
  const cached = indexCache.get(items);
  if (cached) return cached;

  const entries = items.map((item) => {
    const nameNorm = normalize(item.name);
    const descNorm = normalize(item.description ?? "");
    const quoteNorm = normalize(item.quote ?? "");
    const synergyNorm = normalize(
      (synergyNamesById?.get(item.id) ?? []).join(" "),
    );
    return {
      item,
      nameNorm,
      nameCompact: compact(item.name),
      nameTokens: nameNorm.split(" ").filter(Boolean),
      acronym: acronymOf(nameNorm),
      descNorm,
      quoteNorm,
      synergyNorm,
      haystack: [nameNorm, descNorm, quoteNorm, synergyNorm]
        .filter(Boolean)
        .join(" "),
    };
  });

  indexCache.set(items, entries);
  return entries;
}

function scoreEntry(e: IndexEntry, qNorm: string, qCompact: string, qTokens: string[]): number {
  let score = 0;
  const single = qTokens.length === 1;

  // --- name-based matches (highest signal) ---
  if (e.nameNorm === qNorm) score = Math.max(score, 1000);
  if (e.nameCompact === qCompact) score = Math.max(score, 970);
  if (qCompact.length >= 2 && e.acronym === qCompact) score = Math.max(score, 900);
  if (e.nameNorm.startsWith(qNorm)) score = Math.max(score, 850);
  if (e.nameCompact.startsWith(qCompact)) score = Math.max(score, 780);
  if (single && e.nameTokens.some((w) => w.startsWith(qNorm))) score = Math.max(score, 760);
  if (e.nameNorm.includes(qNorm)) score = Math.max(score, 620);
  if (e.nameCompact.includes(qCompact)) score = Math.max(score, 560);
  if (qCompact.length >= 2 && e.acronym.startsWith(qCompact)) score = Math.max(score, 520);

  // --- multi-word AND coverage (ignore single-char tokens like the a/w/p
  //     produced by punctuation-heavy names such as "A.W.P.") ---
  const sigTokens = qTokens.filter((t) => t.length >= 2);
  if (sigTokens.length > 1) {
    const inName = sigTokens.every((t) => e.nameNorm.includes(t));
    if (inName) score = Math.max(score, 700);
    const inAll = sigTokens.every((t) => e.haystack.includes(t));
    if (inAll) score = Math.max(score, 380);
    if (!inName && !inAll) {
      const hits = sigTokens.filter((t) => e.haystack.includes(t)).length;
      if (hits > 0) score = Math.max(score, 120 + hits * 40);
    }
  }

  // --- secondary fields ---
  if (e.descNorm.includes(qNorm)) score = Math.max(score, 300);
  if (e.synergyNorm.includes(qNorm)) score = Math.max(score, 260);
  if (e.quoteNorm.includes(qNorm)) score = Math.max(score, 220);

  // --- typo tolerance (only when nothing better matched) ---
  if (score === 0 && single && qCompact.length >= 3 && isSubsequence(qCompact, e.nameCompact)) {
    score = Math.max(score, 190);
  }
  if (score === 0 && single && qCompact.length >= 4) {
    const max = fuzzThreshold(qCompact.length);
    let best = max + 1;
    for (const w of e.nameTokens) {
      const d = levenshtein(qCompact, w, max);
      if (d < best) best = d;
    }
    const dc = levenshtein(qCompact, e.nameCompact, max);
    if (dc < best) best = dc;
    if (best <= max) score = Math.max(score, 210 - best * 30);
  }

  return score;
}

export type SearchOptions = {
  type?: "gun" | "passive" | "active" | "";
  limit?: number;
  synergyNamesById?: Map<string, string[]>;
};

export function searchItems(
  items: GameItem[],
  query: string,
  opts: SearchOptions = {},
): SearchHit[] {
  const index = buildIndex(items, opts.synergyNamesById);
  const type = opts.type ?? "";
  const limit = opts.limit ?? 30;

  const qNorm = normalize(query);
  const qCompact = qNorm.replace(/ /g, "");
  const qTokens = qNorm.split(" ").filter(Boolean);
  const pool = type ? index.filter((e) => e.item.type === type) : index;

  // Empty query: alphabetical catalogue browse.
  if (!qNorm) {
    return [...pool]
      .sort((a, b) => a.item.name.localeCompare(b.item.name))
      .slice(0, limit)
      .map((e) => ({ item: e.item, score: 0 }));
  }

  const hits: SearchHit[] = [];
  for (const e of pool) {
    const score = scoreEntry(e, qNorm, qCompact, qTokens);
    if (score > 0) hits.push({ item: e.item, score });
  }

  hits.sort(
    (a, b) =>
      b.score - a.score ||
      a.item.name.length - b.item.name.length ||
      a.item.name.localeCompare(b.item.name),
  );

  return hits.slice(0, limit);
}
