"use client";

import type { RunView } from "@/lib/types";
import { typeGlyph } from "@/lib/ui";
import ItemIcon from "./ItemIcon";
import TierTag from "./TierTag";

export default function Loadout({
  run,
  pendingIds,
  onOpen,
  onRemove,
  onReset,
}: {
  run: RunView;
  pendingIds: Set<string>;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
  onReset: () => void;
}) {
  const { counts } = run;
  return (
    <section className="panel flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line-bright p-4">
        <div>
          <p className="kicker mb-1">Current Loadout</p>
          <p className="font-display text-lg font-semibold text-ink">
            {counts.items} item{counts.items === 1 ? "" : "s"}
          </p>
        </div>
        <button
          className="btn btn-ghost px-3 py-1.5 text-xs"
          onClick={onReset}
          disabled={counts.items === 0}
          title="Clear all items from this run"
        >
          Reset run
        </button>
      </div>

      <div className="flex gap-3 border-b border-line px-4 py-2 text-[0.7rem] text-ink-faint">
        <span>{typeGlyph("gun")} {counts.guns} guns</span>
        <span>{typeGlyph("passive")} {counts.passives} passives</span>
        <span>{typeGlyph("active")} {counts.actives} actives</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {run.items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <span className="text-3xl opacity-40">▦</span>
            <p className="text-xs text-ink-faint">
              Your loadout is empty. Search for the guns and items you pick up to
              track synergies in real time.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2">
            {run.items.map((it) => (
              <li
                key={it.id}
                className="group flex cursor-pointer items-center gap-2.5 border border-line bg-bg-raised px-3 py-2 transition-colors hover:border-amber-deep"
                onClick={() => onOpen(it.id)}
              >
                <ItemIcon name={it.name} imageUrl={it.imageUrl} quality={it.quality} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-display text-sm font-semibold text-ink">
                      {it.name}
                    </span>
                    <TierTag quality={it.quality} />
                  </div>
                  <p className="line-clamp-1 text-[0.7rem] text-ink-faint">{it.description}</p>
                </div>
                <button
                  className="btn btn-ghost h-7 w-7 shrink-0 text-sm leading-none opacity-60 group-hover:opacity-100"
                  disabled={pendingIds.has(it.id)}
                  aria-label={`Remove ${it.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(it.id);
                  }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
