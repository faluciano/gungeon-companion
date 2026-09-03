"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { getGameData, type GameItem } from "@/lib/game-data";
import { searchItems } from "@/lib/search";
import { tierClass, tierLabel, typeGlyph, typeLabel, type ItemType } from "@/lib/ui";

const TYPES: ItemType[] = ["gun", "passive", "active"];

// Module-level so the catalogue is built once, not per render.
const DATA = getGameData();

const TYPE_FILTERS: { value: ItemType | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "gun", label: "Guns" },
  { value: "passive", label: "Passives" },
  { value: "active", label: "Actives" },
];

function Sprite({ item }: { item: GameItem }) {
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border tier-${item.quality.toLowerCase()}`}
      style={{ borderColor: "currentColor" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- hotlinked wiki sprite; next/image would proxy/charge for external CDN */}
      <img
        src={item.imageUrl ?? ""}
        alt={item.name}
        width={36}
        height={36}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-full w-full object-contain p-1"
        style={{ imageRendering: "pixelated" }}
      />
    </span>
  );
}

function ItemCard({ item, synergyCount }: { item: GameItem; synergyCount: number }) {
  return (
    <li>
      <Link
        href={`/items/${item.id}`}
        className="panel flex items-center gap-3 px-3 py-2 transition-colors hover:border-line-bright"
      >
        <Sprite item={item} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-ink">{item.name}</span>
          <span className="block text-[0.62rem] uppercase tracking-wider text-ink-faint">
            {synergyCount} {synergyCount === 1 ? "synergy" : "synergies"}
          </span>
        </span>
        <span className={tierClass(item.quality)}>{tierLabel(item.quality)}</span>
      </Link>
    </li>
  );
}

/**
 * The full item catalogue with the tracker's typo-tolerant search on top.
 *
 * With no query every item is rendered grouped by type, so the prerendered
 * HTML still lists all 500+ items for crawlers. Typing swaps that for a
 * relevance-ranked flat list from the same engine the run tracker uses.
 */
export default function ItemCatalog() {
  const { items, synergiesByItem, synergyNamesById } = DATA;
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ItemType | "">("");
  const deferredQuery = useDeferredValue(query);

  // The React Compiler memoizes this on trimmed/type; no manual useMemo needed.
  const trimmed = deferredQuery.trim();
  const hits = trimmed
    ? searchItems(items, trimmed, { type, limit: 60, synergyNamesById })
    : null;

  const synergyCount = (id: string) => synergiesByItem.get(id)?.length ?? 0;

  return (
    <>
      <div className="panel mt-4 p-4">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-amber">
            ⌕
          </span>
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guns & items… (typos welcome)"
            aria-label="Search items"
            autoComplete="off"
            spellCheck={false}
            className="w-full border border-line-bright bg-bg-raised py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setType(f.value)}
              className={`btn px-3 py-1 text-xs ${type === f.value ? "btn-primary" : "btn-ghost"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {hits ? (
        <section className="mt-6">
          <h2 className="kicker mb-3">
            {hits.length === 0
              ? "No items match"
              : `${hits.length}${hits.length === 60 ? "+" : ""} results`}
            {" · "}
            <span className="text-ink">{trimmed}</span>
          </h2>
          {hits.length === 0 ? (
            <p className="panel px-5 py-6 text-sm text-ink-faint">
              Nothing in the Ammonomicon matches that. Try fewer words or a
              different spelling.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {hits.map((h) => (
                <ItemCard key={h.item.id} item={h.item} synergyCount={synergyCount(h.item.id)} />
              ))}
            </ul>
          )}
        </section>
      ) : (
        TYPES.filter((t) => !type || t === type).map((t) => {
          const group = items.filter((i) => i.type === t);
          return (
            <section key={t} className="mt-6">
              <h2 className="kicker mb-3">
                {typeGlyph(t)} {typeLabel(t)}s · {group.length}
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.map((item) => (
                  <ItemCard key={item.id} item={item} synergyCount={synergyCount(item.id)} />
                ))}
              </ul>
            </section>
          );
        })
      )}
    </>
  );
}
