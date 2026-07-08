"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RunView, SearchResponse, SearchResult } from "@/lib/types";
import SearchPanel from "./SearchPanel";
import Loadout from "./Loadout";
import SynergyBoard from "./SynergyBoard";
import ItemDetailModal from "./ItemDetailModal";

export default function Dashboard({ initialRun }: { initialRun: RunView }) {
  const [run, setRun] = useState<RunView>(initialRun);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [detailRefresh, setDetailRefresh] = useState(0);

  const searchSeq = useRef(0);
  const lastArgs = useRef({ query: "", typeFilter: "" });

  const runSearch = useCallback(async (q: string, type: string) => {
    lastArgs.current = { query: q, typeFilter: type };
    if (!q.trim() && !type) {
      setResults([]);
      setSearching(false);
      return;
    }
    const seq = ++searchSeq.current;
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (type) params.set("type", type);
      const res = await fetch(`/api/search?${params.toString()}`);
      const data: SearchResponse = await res.json();
      if (seq === searchSeq.current) setResults(data.results);
    } finally {
      if (seq === searchSeq.current) setSearching(false);
    }
  }, []);

  // Debounced search on query / filter change.
  useEffect(() => {
    const handle = setTimeout(() => runSearch(query, typeFilter), 180);
    return () => clearTimeout(handle);
  }, [query, typeFilter, runSearch]);

  const refreshRun = useCallback(async () => {
    const res = await fetch("/api/run");
    if (res.ok) setRun((await res.json()) as RunView);
  }, []);

  const setPending = (id: string, on: boolean) =>
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const toggleItem = useCallback(
    async (id: string, owned: boolean) => {
      setPending(id, true);
      // Optimistically reflect ownership in the current search results.
      setResults((prev) =>
        prev.map((r) => (r.id === id ? { ...r, owned: !owned } : r)),
      );
      try {
        if (owned) {
          await fetch(`/api/run/items?itemId=${encodeURIComponent(id)}`, {
            method: "DELETE",
          });
        } else {
          await fetch("/api/run/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemId: id }),
          });
        }
        await Promise.all([
          refreshRun(),
          runSearch(lastArgs.current.query, lastArgs.current.typeFilter),
        ]);
        setDetailRefresh((n) => n + 1);
      } finally {
        setPending(id, false);
      }
    },
    [refreshRun, runSearch],
  );

  const resetRun = useCallback(async () => {
    await fetch("/api/run/reset", { method: "POST" });
    await Promise.all([
      refreshRun(),
      runSearch(lastArgs.current.query, lastArgs.current.typeFilter),
    ]);
  }, [refreshRun, runSearch]);

  const ownedSet = new Set(run.items.map((i) => i.id));

  return (
    <>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)_minmax(0,1.15fr)]">
        <div className="h-[calc(100vh-9rem)] min-h-[26rem] lg:sticky lg:top-24">
          <Loadout
            run={run}
            pendingIds={pendingIds}
            onOpen={setSelectedId}
            onRemove={(id) => toggleItem(id, true)}
            onReset={resetRun}
          />
        </div>
        <div className="h-[calc(100vh-9rem)] min-h-[26rem] lg:sticky lg:top-24">
          <SearchPanel
            query={query}
            typeFilter={typeFilter}
            results={results.map((r) => ({ ...r, owned: ownedSet.has(r.id) }))}
            searching={searching}
            hasQuery={Boolean(query.trim() || typeFilter)}
            pendingIds={pendingIds}
            onQueryChange={setQuery}
            onTypeChange={setTypeFilter}
            onOpen={setSelectedId}
            onToggle={toggleItem}
          />
        </div>
        <div className="h-[calc(100vh-9rem)] min-h-[26rem] lg:sticky lg:top-24">
          <SynergyBoard run={run} onOpenItem={setSelectedId} />
        </div>
      </div>

      {selectedId && (
        <ItemDetailModal
          itemId={selectedId}
          refreshKey={detailRefresh}
          pending={pendingIds.has(selectedId)}
          onClose={() => setSelectedId(null)}
          onToggle={(id, owned) => toggleItem(id, owned)}
        />
      )}
    </>
  );
}
