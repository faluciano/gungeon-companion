"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { computeRunView } from "@/lib/run-core";
import { decodeRun, type SharedRunState } from "@/lib/share";
import { enterGuestMode, loadGuestRun, saveGuestRun } from "@/lib/guest";
import { typeGlyph } from "@/lib/ui";
import type { SynergyEvaluationView } from "@/lib/types";
import ItemIcon from "./ItemIcon";
import TierTag from "./TierTag";

// Dedicated viewer for shared run links (/share#r=...). Deliberately NOT the
// tracker UI — it's a read-only showcase of someone else's loadout, so it can
// never be mistaken for (or overwrite) the visitor's own run. The only ways
// out are explicit: back to your own run, or import this one.

type Snapshot = SharedRunState | null | "pending";

// The fragment only exists in the browser: the server snapshot renders the
// "pending" placeholder, then the client snapshot decodes the hash. Cached by
// raw hash so the reference stays stable, as useSyncExternalStore requires.
let lastHash: string | undefined;
let lastDecoded: SharedRunState | null = null;

function getSnapshot(): Snapshot {
  const hash = window.location.hash;
  if (hash !== lastHash) {
    lastHash = hash;
    lastDecoded = decodeRun(hash);
  }
  return lastDecoded;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

function ItemChip({
  item,
}: {
  item: { name: string; quality: SynergyEvaluationView["contributors"][number]["quality"]; imageUrl: string | null };
}) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-line bg-bg-raised px-1.5 py-0.5 text-[0.7rem] text-ink-dim">
      <ItemIcon name={item.name} imageUrl={item.imageUrl} quality={item.quality} size={16} />
      {item.name}
    </span>
  );
}

function SynergyCard({ synergy }: { synergy: SynergyEvaluationView }) {
  const active = synergy.status === "active";
  return (
    <li className="border border-line bg-bg-raised p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-sm font-semibold text-ink">{synergy.name}</p>
        <span
          className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${
            active ? "bg-teal/15 text-teal" : "bg-amber/15 text-amber"
          }`}
        >
          {active ? "Active" : `Need ${synergy.requiredGroups - synergy.satisfiedGroups} more`}
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink-dim">{synergy.effect}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {synergy.contributors.map((c) => (
          <ItemChip key={c.id} item={c} />
        ))}
      </div>
      {!active && synergy.needed.length > 0 && (
        <div className="mt-2">
          <p className="text-[0.62rem] uppercase tracking-[0.2em] text-ink-faint">Add one of</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {synergy.needed[0].options.map((o) => (
              <ItemChip key={o.id} item={o} />
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

export default function SharedRun({ signedIn }: { signedIn: boolean }) {
  const decoded = useSyncExternalStore<Snapshot>(subscribe, getSnapshot, () => "pending");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  // Importing replaces the visitor's own run — confirm inline first
  // (no window.confirm — it's blockable and easy to mis-tap).
  const [confirmingOverwrite, setConfirmingOverwrite] = useState(false);

  const run = useMemo(() => {
    if (decoded === "pending" || decoded === null) return null;
    return computeRunView(
      "shared",
      "Shared Run",
      decoded.itemIds,
      new Map(Object.entries(decoded.quantities)),
    );
  }, [decoded]);

  if (decoded === "pending") {
    return (
      <div className="grid min-h-[24rem] place-items-center text-xs uppercase tracking-[0.28em] text-ink-faint">
        Opening the Ammonomicon…
      </div>
    );
  }

  if (decoded === null || !run) {
    return (
      <div className="mx-auto grid min-h-[24rem] max-w-md place-items-center text-center">
        <div>
          <span className="text-3xl opacity-40">▦</span>
          <p className="mt-3 text-sm text-ink-dim">
            This share link is empty or broken — it doesn&apos;t contain a
            recognizable run.
          </p>
          <Link href="/" className="btn btn-primary mt-5 inline-block px-4 py-2 text-xs">
            Start your own run
          </Link>
        </div>
      </div>
    );
  }

  async function saveRun(overwriteConfirmed = false) {
    if (decoded === "pending" || decoded === null) return;
    // Saving replaces whatever run the visitor already has (synced run for
    // accounts, this browser's guest run otherwise) — always stop and ask
    // unless we can see the guest run is empty.
    if (!overwriteConfirmed && (signedIn || loadGuestRun().itemIds.length > 0)) {
      setConfirmingOverwrite(true);
      return;
    }
    setConfirmingOverwrite(false);
    setSaving(true);
    setSaveError(false);
    const quantities = new Map(Object.entries(decoded.quantities));
    try {
      if (signedIn) {
        const res = await fetch("/api/run/items", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: decoded.itemIds.map((itemId) => ({
              itemId,
              quantity: quantities.get(itemId) ?? 1,
            })),
          }),
        });
        if (!res.ok) throw new Error(`Import failed (${res.status})`);
      } else {
        saveGuestRun(decoded.itemIds, quantities);
        enterGuestMode();
      }
      // Straight to the tracker — the guest cookie / session is set by now.
      window.location.href = "/run";
    } catch {
      setSaveError(true);
      setSaving(false);
    }
  }

  const { counts } = run;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Masthead — unmistakably someone else's loadout, not your tracker. */}
      <div className="border border-amber/60 bg-amber/5 p-5 sm:p-6">
        <p className="kicker mb-2">Shared Loadout</p>
        <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
          {counts.items} item{counts.items === 1 ? "" : "s"} ·{" "}
          <span className="text-teal">{run.active.length} synerg{run.active.length === 1 ? "y" : "ies"} active</span>
        </h2>
        <p className="mt-2 flex gap-3 text-xs text-ink-faint">
          <span>{typeGlyph("gun")} {counts.guns} guns</span>
          <span>{typeGlyph("passive")} {counts.passives} passives</span>
          <span>{typeGlyph("active")} {counts.actives} actives</span>
        </p>
        <p className="mt-3 max-w-xl text-xs leading-relaxed text-ink-dim">
          Someone sent you this Enter the Gungeon run. Browsing it changes
          nothing of yours — your own run is safe until you choose to replace
          it.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {confirmingOverwrite ? (
            <>
              <p className="mr-1 text-xs text-amber">
                {signedIn
                  ? "This will replace the run saved to your account — continue?"
                  : "This will replace the run saved in this browser — continue?"}
              </p>
              <button
                className="btn btn-primary px-3 py-1.5 text-xs"
                onClick={() => saveRun(true)}
                disabled={saving}
              >
                {saving ? "Saving…" : "Replace my run"}
              </button>
              <button
                className="btn btn-ghost px-3 py-1.5 text-xs"
                onClick={() => setConfirmingOverwrite(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-primary px-3.5 py-2 text-xs"
                onClick={() => saveRun()}
                disabled={saving}
              >
                {saving ? "Saving…" : "Continue this run"}
              </button>
              <Link href="/" className="btn btn-ghost px-3.5 py-2 text-xs">
                Open my run
              </Link>
            </>
          )}
        </div>
        {saveError && (
          <p className="mt-3 text-xs text-danger">
            Couldn&apos;t save this run — check your connection and try again.
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="panel p-4">
          <p className="kicker mb-3">The Loadout</p>
          <ul className="grid grid-cols-1 gap-2">
            {run.items.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-2.5 border border-line bg-bg-raised px-3 py-2"
              >
                <ItemIcon name={it.name} imageUrl={it.imageUrl} quality={it.quality} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-display text-sm font-semibold text-ink">
                      {it.name}
                    </span>
                    <TierTag quality={it.quality} />
                    {it.quantity > 1 && (
                      <span className="font-display text-xs font-semibold text-ink-dim">
                        ×{it.quantity}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-[0.7rem] text-ink-faint">{it.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-5">
          <section className="panel p-4">
            <p className="kicker mb-3">Active Now · {run.active.length}</p>
            {run.active.length === 0 ? (
              <p className="text-xs text-ink-faint">No synergies active yet.</p>
            ) : (
              <ul className="grid gap-2">
                {run.active.map((s) => (
                  <SynergyCard key={s.id} synergy={s} />
                ))}
              </ul>
            )}
          </section>
          {run.nearly.length > 0 && (
            <section className="panel p-4">
              <p className="kicker mb-3">One Item Away · {run.nearly.length}</p>
              <ul className="grid gap-2">
                {run.nearly.map((s) => (
                  <SynergyCard key={s.id} synergy={s} />
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
