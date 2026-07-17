"use client";

import { useMemo, useState } from "react";
import { normalize } from "@/lib/search";
import type { RunView, SynergyEvaluationView } from "@/lib/types";
import ItemIcon from "./ItemIcon";

function SynergyRow({
  synergy,
  onOpenItem,
}: {
  synergy: SynergyEvaluationView;
  onOpenItem: (id: string) => void;
}) {
  const active = synergy.status === "active";
  return (
    <li
      className={`panel-inset p-4 ${active ? "border-l-2 border-l-teal" : "border-l-2 border-l-amber-deep"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-base font-semibold text-ink">{synergy.name}</h3>
        <span
          className={`chip shrink-0 ${active ? "chip-active" : "chip-ready"}`}
        >
          {active ? "Active" : `Need 1 more`}
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-dim">{synergy.effect}</p>

      {active ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {synergy.contributors.map((c) => (
            <button
              key={c.id}
              onClick={() => onOpenItem(c.id)}
              className="flex items-center gap-1.5 border border-teal/40 bg-teal/10 py-0.5 pl-0.5 pr-2 text-[0.7rem] text-teal hover:border-teal"
            >
              <ItemIcon name={c.name} imageUrl={c.imageUrl} quality={c.quality} size={20} />
              {c.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-2.5">
          <p className="kicker mb-1 text-[0.6rem]">Add one of</p>
          <div className="flex flex-wrap gap-1.5">
            {synergy.needed.flatMap((g) =>
              g.options.map((o) => (
                <button
                  key={o.id}
                  onClick={() => onOpenItem(o.id)}
                  className="flex items-center gap-1.5 border border-line bg-bg py-0.5 pl-0.5 pr-2 text-[0.7rem] text-ink-dim hover:border-amber-deep hover:text-ink"
                >
                  <ItemIcon name={o.name} imageUrl={o.imageUrl} quality={o.quality} size={20} />
                  {o.name}
                </button>
              )),
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export default function SynergyBoard({
  run,
  onOpenItem,
  expanded,
  onToggleExpanded,
}: {
  run: RunView;
  onOpenItem: (id: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const [query, setQuery] = useState("");
  const hasAny = run.active.length > 0 || run.nearly.length > 0;
  const normalizedQuery = normalize(query);
  const { active, nearly } = useMemo(() => {
    const matchesQuery = (synergy: SynergyEvaluationView) => {
      if (!normalizedQuery) return true;
      const itemNames = [
        ...synergy.contributors.map((item) => item.name),
        ...synergy.needed.flatMap((group) => group.options.map((item) => item.name)),
      ];
      const haystack = normalize([synergy.name, synergy.effect, ...itemNames].join(" "));
      return normalizedQuery.split(" ").every((term) => haystack.includes(term));
    };
    return {
      active: run.active.filter(matchesQuery),
      nearly: run.nearly.filter(matchesQuery),
    };
  }, [run.active, run.nearly, normalizedQuery]);
  const hasMatches = active.length > 0 || nearly.length > 0;

  return (
    <section className="panel flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line-bright p-4">
        <div>
          <p className="kicker mb-1">Synergies</p>
          <p className="font-display text-lg font-semibold text-ink">
            <span className="text-teal">{run.active.length}</span> active ·{" "}
            <span className="text-amber">{run.nearly.length}</span> within reach
          </p>
        </div>
        <button
          className="btn btn-ghost hidden px-3 py-1.5 text-xs lg:block"
          onClick={onToggleExpanded}
          aria-label={expanded ? "Exit full screen synergies" : "Open full screen synergies"}
          title={expanded ? "Exit full screen" : "Open full screen"}
        >
          {expanded ? "↙ Collapse" : "↗ Expand"}
        </button>
      </div>

      <div className="border-b border-line px-4 py-3">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-amber">
            ⌕
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search synergies…"
            aria-label="Search synergies"
            autoComplete="off"
            spellCheck={false}
            className="w-full border border-line-bright bg-bg-raised py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {!hasAny ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <span className="text-3xl opacity-40">✧</span>
            <p className="text-xs text-ink-faint">
              No synergies yet. As you add items, active combos and near-misses
              appear here automatically.
            </p>
          </div>
        ) : !hasMatches ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <span className="text-3xl opacity-40">⌕</span>
            <p className="text-xs text-ink-faint">No synergies match that search.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <div>
                <p className="kicker mb-3 text-teal">◈ Active now</p>
                <ul className="space-y-3">
                  {active.map((s) => (
                    <SynergyRow key={s.id} synergy={s} onOpenItem={onOpenItem} />
                  ))}
                </ul>
              </div>
            )}
            {nearly.length > 0 && (
              <div>
                <p className="kicker mb-3 text-amber">◇ One item away</p>
                <ul className="space-y-3">
                  {nearly.map((s) => (
                    <SynergyRow key={s.id} synergy={s} onOpenItem={onOpenItem} />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
