import { getGameData } from "@/lib/game-data";
import { STACKABLE_IDS } from "@/lib/junkan";
import shareIndex from "@/lib/data/share-index.json";

// Share links encode a run compactly in the URL fragment:
//
//   https://gungeoncompanion.com/share#r=2a.68.97.9y~3
//
// Each token is an item's position in share-index.json written in base36,
// with `~N` appended for stackable items owned more than once. The index file
// is APPEND-ONLY — positions are baked into links people have already shared,
// so new dataset items must be added at the END (a test enforces coverage).
// Legacy `#run=slug,slug~3` links from early share URLs still decode.
//
// The fragment never reaches the server or its logs.

export const SHARE_PARAM = "r";
const LEGACY_PARAM = "run";
export const SHARE_PATH = "/share";

/** Hard cap on decoded entries — a run can't hold more items than the dataset. */
const MAX_ENTRIES = 600;

const SLUGS: string[] = shareIndex;
const INDEX_BY_SLUG = new Map(SLUGS.map((slug, i) => [slug, i]));

export type SharedRunState = {
  itemIds: string[];
  /** itemId -> owned count; only stackable items ever exceed 1. */
  quantities: Record<string, number>;
};

function clampQty(qty: number): number {
  return Math.min(99, Math.floor(qty));
}

/** Encode a run as the URL fragment payload (the part after `#r=`). */
export function encodeRun(
  itemIds: Iterable<string>,
  quantities: ReadonlyMap<string, number> = new Map(),
): string {
  const parts: string[] = [];
  for (const id of [...new Set(itemIds)].sort()) {
    const index = INDEX_BY_SLUG.get(id);
    if (index === undefined) continue;
    const qty = quantities.get(id) ?? 1;
    parts.push(
      STACKABLE_IDS.has(id) && qty > 1
        ? `${index.toString(36)}~${clampQty(qty)}`
        : index.toString(36),
    );
  }
  return parts.join(".");
}

/** Build a full share URL for the given origin (e.g. window.location.origin). */
export function buildShareUrl(
  origin: string,
  itemIds: Iterable<string>,
  quantities: ReadonlyMap<string, number> = new Map(),
): string {
  return `${origin}${SHARE_PATH}#${SHARE_PARAM}=${encodeRun(itemIds, quantities)}`;
}

type RawEntry = { slug: string; qty: number | undefined };

function parseCompact(payload: string): RawEntry[] {
  return payload.split(".").map((part) => {
    const [token, rawQty] = part.trim().split("~");
    const index = /^[0-9a-z]{1,4}$/.test(token) ? Number.parseInt(token, 36) : NaN;
    return {
      slug: SLUGS[index] ?? "",
      qty: rawQty === undefined ? undefined : Number.parseInt(rawQty, 10),
    };
  });
}

function parseLegacySlugs(payload: string): RawEntry[] {
  return payload.split(",").map((part) => {
    const [slug, rawQty] = part.trim().split("~");
    return {
      slug,
      qty: rawQty === undefined ? undefined : Number.parseInt(rawQty, 10),
    };
  });
}

/**
 * Decode a fragment back into run state, dropping anything that isn't a real
 * item. Accepts a full hash (`#r=...` or legacy `#run=...`) or a bare payload.
 * Returns null when nothing valid remains (malformed or empty links).
 */
export function decodeRun(fragment: string): SharedRunState | null {
  let payload = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  let legacy = false;
  if (payload.startsWith(`${SHARE_PARAM}=`)) {
    payload = payload.slice(SHARE_PARAM.length + 1);
  } else if (payload.startsWith(`${LEGACY_PARAM}=`)) {
    payload = payload.slice(LEGACY_PARAM.length + 1);
    legacy = true;
  }
  try {
    payload = decodeURIComponent(payload);
  } catch {
    // Malformed percent-encoding — try the raw payload; tokens never need it.
  }

  // Bare payloads are ambiguous; prefer compact, fall back to legacy slugs.
  const entries = legacy ? parseLegacySlugs(payload) : parseCompact(payload);
  const state = collect(entries);
  if (state || legacy) return state;
  return collect(parseLegacySlugs(payload));
}

function collect(entries: RawEntry[]): SharedRunState | null {
  const data = getGameData();
  const itemIds: string[] = [];
  const quantities: Record<string, number> = {};
  const seen = new Set<string>();

  for (const { slug, qty } of entries.slice(0, MAX_ENTRIES)) {
    if (!slug || seen.has(slug) || !data.itemsById.has(slug)) continue;
    seen.add(slug);
    itemIds.push(slug);
    if (qty !== undefined && STACKABLE_IDS.has(slug) && Number.isFinite(qty) && qty > 1) {
      quantities[slug] = clampQty(qty);
    }
  }

  return itemIds.length > 0 ? { itemIds, quantities } : null;
}
