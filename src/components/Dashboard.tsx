"use client";

import { useCallback, useEffect, useMemo, useState, useDeferredValue } from "react";
import { computeRunView, computeSearchResults } from "@/lib/run-core";
import { saveGuestRun } from "@/lib/guest";
import { buildShareUrl } from "@/lib/share";
import { STACKABLE_IDS } from "@/lib/junkan";
import SearchPanel from "./SearchPanel";
import Loadout from "./Loadout";
import SynergyBoard from "./SynergyBoard";
import ItemDetailModal from "./ItemDetailModal";

type ItemType = "gun" | "passive" | "active" | "";

export default function Dashboard({
  runId,
  runName,
  initialItemIds,
  initialQuantities = {},
  guest = false,
}: {
  runId: string;
  runName: string;
  initialItemIds: string[];
  /** itemId -> owned count for stackable items (Junk family). */
  initialQuantities?: Record<string, number>;
  /** Guest runs persist to localStorage on this device instead of the server. */
  guest?: boolean;
}) {
  // The run's item ids (plus stack counts) are the only client state;
  // everything else (loadout, synergies, search results) derives synchronously
  // from the bundled dataset.
  const [ownedIds, setOwnedIds] = useState<Set<string>>(() => new Set(initialItemIds));
  const [quantities, setQuantities] = useState<Map<string, number>>(
    () => new Map(Object.entries(initialQuantities)),
  );
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ItemType>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [syncError, setSyncError] = useState(false);
  const [mobileTab, setMobileTab] = useState<"loadout" | "search" | "synergies">("search");
  const [expandedPanel, setExpandedPanel] = useState<typeof mobileTab | null>(null);

  const deferredQuery = useDeferredValue(query);

  const run = useMemo(
    () => computeRunView(runId, runName, ownedIds, quantities),
    [runId, runName, ownedIds, quantities],
  );

  const results = useMemo(() => {
    if (!deferredQuery.trim() && !typeFilter) return [];
    return computeSearchResults(deferredQuery.trim(), typeFilter, ownedIds);
  }, [deferredQuery, typeFilter, ownedIds]);

  useEffect(() => {
    if (!expandedPanel) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpandedPanel(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [expandedPanel]);

  const setPending = (id: string, on: boolean) =>
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  // Guest runs never touch the network — mirror every change to localStorage.
  useEffect(() => {
    if (guest) saveGuestRun(ownedIds, quantities);
  }, [guest, ownedIds, quantities]);

  const [shareCopied, setShareCopied] = useState(false);
  const shareRun = useCallback(async () => {
    const url = buildShareUrl(window.location.origin, ownedIds, quantities);
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Clipboard blocked (permissions, non-secure context) — show the link.
      window.prompt("Copy your share link:", url);
    }
  }, [ownedIds, quantities]);

  const toggleItem = useCallback(
    async (id: string, owned: boolean) => {
      if (pendingIds.has(id)) return;
      if (owned) {
        // Dropping an item forgets its stack count.
        setQuantities((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      }
      if (guest) {
        setOwnedIds((prev) => {
          const next = new Set(prev);
          if (owned) next.delete(id);
          else next.add(id);
          return next;
        });
        return;
      }
      setPending(id, true);
      // Optimistic: the UI (loadout, synergies, search badges) updates
      // immediately; the request only persists the change.
      setOwnedIds((prev) => {
        const next = new Set(prev);
        if (owned) next.delete(id);
        else next.add(id);
        return next;
      });
      try {
        const res = owned
          ? await fetch(`/api/run/items?itemId=${encodeURIComponent(id)}`, {
              method: "DELETE",
            })
          : await fetch("/api/run/items", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ itemId: id }),
            });
        if (!res.ok) throw new Error(`Sync failed (${res.status})`);
        setSyncError(false);
      } catch {
        // Roll back so the UI never shows unsaved state as saved.
        setOwnedIds((prev) => {
          const next = new Set(prev);
          if (owned) next.add(id);
          else next.delete(id);
          return next;
        });
        setSyncError(true);
      } finally {
        setPending(id, false);
      }
    },
    [pendingIds, guest],
  );

  const setQuantity = useCallback(
    async (id: string, quantity: number) => {
      if (!STACKABLE_IDS.has(id)) return;
      const clamped = Math.max(1, Math.min(99, Math.floor(quantity)));
      const previous = quantities.get(id) ?? 1;
      if (clamped === previous) return;
      // Optimistic for both modes; guests persist via the localStorage effect.
      setQuantities((prev) => new Map(prev).set(id, clamped));
      if (guest) return;
      try {
        const res = await fetch("/api/run/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: id, quantity: clamped }),
        });
        if (!res.ok) throw new Error(`Sync failed (${res.status})`);
        setSyncError(false);
      } catch {
        setQuantities((prev) => new Map(prev).set(id, previous));
        setSyncError(true);
      }
    },
    [guest, quantities],
  );

  const resetRun = useCallback(async () => {
    const previous = ownedIds;
    setOwnedIds(new Set());
    setQuantities(new Map());
    if (guest) return;
    try {
      const res = await fetch("/api/run/reset", { method: "POST" });
      if (!res.ok) throw new Error(`Sync failed (${res.status})`);
      setSyncError(false);
    } catch {
      setOwnedIds(previous);
      setSyncError(true);
    }
  }, [ownedIds, guest]);

  const panelHeight =
    "h-[calc(100dvh-11.5rem)] min-h-[24rem] lg:h-[calc(100vh-9rem)] lg:min-h-[26rem] lg:sticky lg:top-24";
  const panelClass = (panel: typeof mobileTab) => {
    const mobileVisibility = mobileTab === panel ? "block" : "hidden";
    if (expandedPanel === panel) {
      return `${mobileVisibility} lg:fixed lg:inset-0 lg:z-40 lg:block lg:h-auto lg:min-h-0`;
    }
    if (expandedPanel) return `${mobileVisibility} lg:hidden`;
    return `${mobileVisibility} lg:block ${panelHeight}`;
  };
  const toggleExpanded = (panel: typeof mobileTab) =>
    setExpandedPanel((current) => (current === panel ? null : panel));

  const tabs: { id: typeof mobileTab; label: string; badge: number | null }[] = [
    { id: "loadout", label: "Loadout", badge: run.counts.items },
    { id: "search", label: "Search", badge: null },
    { id: "synergies", label: "Synergies", badge: run.active.length },
  ];

  return (
    <>
      {syncError && (
        <div className="mb-3 border border-danger/60 bg-danger/10 px-4 py-2 text-xs text-danger">
          Couldn&apos;t save your last change — check your connection and try again.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)_minmax(0,1.15fr)] lg:pb-0">
        <div className={panelClass("loadout")}>
          <Loadout
            run={run}
            pendingIds={pendingIds}
            onOpen={setSelectedId}
            onRemove={(id) => toggleItem(id, true)}
            onSetQuantity={setQuantity}
            onReset={resetRun}
            onShare={shareRun}
            shareCopied={shareCopied}
            expanded={expandedPanel === "loadout"}
            onToggleExpanded={() => toggleExpanded("loadout")}
          />
        </div>
        <div className={panelClass("search")}>
          <SearchPanel
            query={query}
            typeFilter={typeFilter}
            results={results}
            searching={query !== deferredQuery}
            hasQuery={Boolean(query.trim() || typeFilter)}
            pendingIds={pendingIds}
            onQueryChange={setQuery}
            onTypeChange={(t) => setTypeFilter(t as ItemType)}
            onOpen={setSelectedId}
            onToggle={toggleItem}
            expanded={expandedPanel === "search"}
            onToggleExpanded={() => toggleExpanded("search")}
          />
        </div>
        <div className={panelClass("synergies")}>
          <SynergyBoard
            run={run}
            onOpenItem={setSelectedId}
            expanded={expandedPanel === "synergies"}
            onToggleExpanded={() => toggleExpanded("synergies")}
          />
        </div>
      </div>

      {/* Mobile tab switcher — bottom of the screen, thumb-reachable. Desktop
          shows all three panels side by side. */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line-bright bg-bg/95 px-5 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-3 gap-1.5 py-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setMobileTab(t.id)}
              aria-pressed={mobileTab === t.id}
              className={`btn flex min-h-11 items-center justify-center gap-1.5 px-2 py-2 text-xs ${
                mobileTab === t.id ? "btn-primary" : "btn-ghost"
              }`}
            >
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span
                  className={`inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[0.6rem] font-bold leading-4 ${
                    mobileTab === t.id ? "bg-bg/25 text-bg" : "bg-amber/20 text-amber"
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {selectedId && (
        <ItemDetailModal
          itemId={selectedId}
          ownedIds={ownedIds}
          junkan={run.junkan}
          pending={pendingIds.has(selectedId)}
          onClose={() => setSelectedId(null)}
          onToggle={toggleItem}
        />
      )}
    </>
  );
}
