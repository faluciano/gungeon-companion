"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { computeItemDetail } from "@/lib/run-core";
import {
  JUNKAN_RANKS,
  MECHA_RANK,
  SER_JUNKAN_ID,
  type JunkanStatus,
} from "@/lib/junkan";
import { statusChipClass, statusLabel, typeGlyph, typeLabel } from "@/lib/ui";
import TierBadge from "./TierBadge";
import ItemIcon from "./ItemIcon";

export default function ItemDetailModal({
  itemId,
  ownedIds,
  junkan,
  onClose,
  onToggle,
  pending,
}: {
  itemId: string;
  ownedIds: Set<string>;
  /** Current run's Ser Junkan status, to highlight his rank in the ladder. */
  junkan?: JunkanStatus | null;
  onClose: () => void;
  onToggle: (id: string, owned: boolean) => void;
  pending: boolean;
}) {
  const detail = useMemo(() => computeItemDetail(itemId, ownedIds), [itemId, ownedIds]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const item = detail?.item;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        className="panel my-4 w-full max-w-2xl rise"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line-bright p-5">
          <div className="flex min-w-0 items-center gap-4">
            {item && (
              <ItemIcon
                name={item.name}
                imageUrl={
                  item.id === SER_JUNKAN_ID && junkan
                    ? junkan.current.imageUrl
                    : item.imageUrl
                }
                quality={item.quality}
                size={64}
              />
            )}
            <div className="min-w-0">
              <p className="kicker mb-1">
                {typeGlyph((item?.type ?? "gun") as never)}{" "}
                {item ? typeLabel(item.type) : "Unknown item"}
              </p>
              <h2 className="truncate font-display text-2xl font-semibold text-ink">
                {item?.name ?? "…"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {item && <TierBadge quality={item.quality} />}
            <button
              onClick={onClose}
              className="btn btn-ghost h-8 w-8 text-lg leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </header>

        {!detail || !item ? (
          <div className="p-8 text-center text-sm text-ink-faint">
            This item isn&apos;t in the Ammonomicon.
          </div>
        ) : (
          <div className="p-5">
            <p className="text-sm leading-relaxed text-ink-dim">{item.description}</p>
            {item.quote && (
              <p className="mt-3 border-l-2 border-amber-deep pl-3 font-display text-sm italic text-amber">
                “{item.quote}”
              </p>
            )}

            <div className="mt-5">
              <button
                className={`btn w-full px-4 py-2.5 text-sm ${
                  item.owned ? "btn-ghost" : "btn-primary"
                }`}
                disabled={pending}
                onClick={() => onToggle(item.id, item.owned)}
              >
                {item.owned ? "− Remove from run" : "+ Add to run"}
              </button>
              <Link
                href={`/items/${item.id}`}
                className="mt-2 block text-center text-xs text-ink-faint underline underline-offset-2 hover:text-ink"
              >
                Open the full {item.name} page ↗
              </Link>
            </div>

            {item.id === SER_JUNKAN_ID && (
              <div className="mt-6">
                <p className="kicker mb-3">Rank ladder · one rank per Junk</p>
                <ul className="space-y-1.5">
                  {[...JUNKAN_RANKS, MECHA_RANK].map((r) => {
                    const isMecha = r === MECHA_RANK;
                    const current =
                      junkan != null &&
                      (isMecha ? junkan.mecha : !junkan.mecha && junkan.current === r);
                    return (
                      <li
                        key={r.rank}
                        className={`flex gap-3 border px-3 py-2 text-xs ${
                          current
                            ? "border-amber/60 bg-amber/10"
                            : "border-line"
                        }`}
                      >
                        <ItemIcon
                          name={r.rank}
                          imageUrl={r.imageUrl}
                          quality="C"
                          size={32}
                        />
                        <span className="w-14 shrink-0 text-right font-display font-semibold text-ink-dim">
                          {isMecha
                            ? "Gold"
                            : r.junk === 7
                              ? "7+ junk"
                              : `${r.junk} junk`}
                        </span>
                        <span className="min-w-0">
                          <span className={`font-semibold ${current ? "text-amber" : "text-ink"}`}>
                            {r.rank}
                            {current ? " — current" : ""}
                          </span>{" "}
                          <span className="text-ink-faint">{r.effect}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-[0.7rem] text-ink-faint">
                  Lies count as Junk. Use the ×N stepper on Junk in your loadout
                  to track pickups.
                </p>
              </div>
            )}

            <div className="mt-6">
              <p className="kicker mb-3">
                Synergies · {detail.synergies.length}
              </p>
              {detail.synergies.length === 0 ? (
                <p className="panel-inset px-4 py-6 text-center text-xs text-ink-faint">
                  This item has no known synergies.
                </p>
              ) : (
                <ul className="space-y-3">
                  {detail.synergies.map((s) => (
                    <li key={s.id} className="panel-inset p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-display text-base font-semibold text-ink">
                          {s.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          {s.activatesOnAdd && (
                            <span className="chip chip-ready pulse-teal">Completes on add</span>
                          )}
                          <span className={statusChipClass(s.status)}>
                            {statusLabel(s.status)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-ink-dim">{s.effect}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {s.groups.map((g, gi) => (
                          <div key={g.index} className="flex items-center gap-2">
                            {gi > 0 && <span className="text-ink-faint">+</span>}
                            <span
                              className={`inline-flex items-center gap-1 border px-2 py-1 text-[0.7rem] ${
                                g.satisfied
                                  ? "border-teal/60 bg-teal/10 text-teal"
                                  : "border-line text-ink-faint"
                              }`}
                            >
                              {g.minItems > 1 && (
                                <span className="opacity-70">{g.minItems} of:</span>
                              )}
                              {g.items.map((it, ii) => (
                                <span key={it.id}>
                                  {ii > 0 && <span className="opacity-50"> / </span>}
                                  <span className={it.owned ? "font-semibold" : ""}>
                                    {it.name}
                                  </span>
                                </span>
                              ))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
