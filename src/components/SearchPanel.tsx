"use client";

import type { SearchResult } from "@/lib/types";
import { typeGlyph } from "@/lib/ui";
import TierBadge from "./TierBadge";

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "gun", label: "Guns" },
  { value: "passive", label: "Passives" },
  { value: "active", label: "Actives" },
];

export default function SearchPanel({
  query,
  typeFilter,
  results,
  searching,
  hasQuery,
  pendingIds,
  onQueryChange,
  onTypeChange,
  onOpen,
  onToggle,
}: {
  query: string;
  typeFilter: string;
  results: SearchResult[];
  searching: boolean;
  hasQuery: boolean;
  pendingIds: Set<string>;
  onQueryChange: (q: string) => void;
  onTypeChange: (t: string) => void;
  onOpen: (id: string) => void;
  onToggle: (id: string, owned: boolean) => void;
}) {
  return (
    <section className="panel flex h-full flex-col overflow-hidden">
      <div className="border-b border-line-bright p-4">
        <p className="kicker mb-2">Ammonomicon // Search</p>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-amber">
            ⌕
          </span>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search guns & items…"
            autoComplete="off"
            spellCheck={false}
            className="w-full border border-line-bright bg-bg-raised py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => onTypeChange(f.value)}
              className={`btn px-3 py-1 text-xs ${
                typeFilter === f.value ? "btn-primary" : "btn-ghost"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {searching && results.length === 0 ? (
          <p className="p-6 text-center text-xs text-ink-faint">Scanning the armory…</p>
        ) : results.length === 0 ? (
          <p className="p-6 text-center text-xs text-ink-faint">
            {hasQuery ? "No items match that search." : "Start typing to search the Gungeon."}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {results.map((r) => (
              <li
                key={r.id}
                className="group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-bg-raised"
                onClick={() => onOpen(r.id)}
              >
                <TierBadge quality={r.quality} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-display text-sm font-semibold text-ink">
                      {r.name}
                    </span>
                    <span className="shrink-0 text-[0.7rem] text-ink-faint">
                      {typeGlyph(r.type)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-faint">{r.description}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {r.activatesCount > 0 && (
                      <span className="chip chip-ready pulse-teal">
                        ⚡ Completes {r.activatesCount}
                      </span>
                    )}
                    {r.activeCount > 0 && (
                      <span className="chip chip-active">✓ {r.activeCount} active</span>
                    )}
                    {r.activatesCount === 0 &&
                      r.activeCount === 0 &&
                      r.synergyCount > 0 && (
                        <span className="chip chip-potential">
                          {r.synergyCount} synergy{r.synergyCount === 1 ? "" : "s"}
                        </span>
                      )}
                  </div>
                </div>
                <button
                  className={`btn shrink-0 px-3 py-1.5 text-xs ${
                    r.owned ? "btn-ghost" : "btn-primary"
                  }`}
                  disabled={pendingIds.has(r.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(r.id, r.owned);
                  }}
                >
                  {r.owned ? "−" : "+"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
