"use client";

import { useMemo, useState } from "react";
import { SHRINES, type Shrine } from "@/lib/data/shrines";

function ShrineImage({ shrine }: { shrine: Shrine }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="grid h-16 w-16 shrink-0 place-items-center border border-line-bright bg-bg-raised">
      {failed ? (
        <span className="text-2xl opacity-50">⛩</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- hotlinked wiki sprite; next/image would proxy/charge for external CDN
        <img
          src={shrine.imageUrl}
          alt={shrine.name}
          width={56}
          height={56}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-14 w-14 object-contain p-1"
          style={{ imageRendering: "pixelated" }}
        />
      )}
    </div>
  );
}

function ShrineCard({ shrine }: { shrine: Shrine }) {
  return (
    <li className="panel flex flex-col p-4">
      <div className="flex items-start gap-3">
        <ShrineImage shrine={shrine} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-ink">{shrine.name}</h3>
            {shrine.curse && (
              <span className="chip chip-ready shrink-0">{shrine.curse}</span>
            )}
          </div>
          <p className="mt-0.5 font-display text-xs italic text-amber">{shrine.flavor}</p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-dim">{shrine.effect}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="panel-inset px-3 py-2">
          <p className="kicker mb-1 text-[0.58rem]">Cost</p>
          <p className="text-xs text-ink">{shrine.give}</p>
        </div>
        <div className="panel-inset border-l-2 border-l-teal px-3 py-2">
          <p className="kicker mb-1 text-[0.58rem]">Reward</p>
          <p className="text-xs text-teal">{shrine.gain}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {shrine.tags.map((t) => (
          <span
            key={t}
            className="border border-line bg-bg px-2 py-0.5 text-[0.62rem] uppercase tracking-wider text-ink-faint"
          >
            {t}
          </span>
        ))}
      </div>
    </li>
  );
}

export default function ShrineBoard() {
  const [tag, setTag] = useState("");

  const allTags = useMemo(
    () => Array.from(new Set(SHRINES.flatMap((s) => s.tags))).sort(),
    [],
  );

  const filtered = useMemo(
    () => (tag ? SHRINES.filter((s) => s.tags.includes(tag)) : SHRINES),
    [tag],
  );

  return (
    <div className="space-y-5">
      <div className="panel p-4">
        <p className="kicker mb-2">Ammonomicon // Shrines</p>
        <p className="max-w-3xl text-sm leading-relaxed text-ink-dim">
          Shrines are statues scattered through the Gungeon that grant a boon —
          usually for a price. A green lantern by a door hints one waits inside.
          Browse what each one does before you strike a bargain.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setTag("")}
            className={`btn px-3 py-1 text-xs ${tag === "" ? "btn-primary" : "btn-ghost"}`}
          >
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t === tag ? "" : t)}
              className={`btn px-3 py-1 text-xs ${tag === t ? "btn-primary" : "btn-ghost"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="panel px-6 py-10 text-center text-sm text-ink-faint">
          No shrines match that filter.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <ShrineCard key={s.id} shrine={s} />
          ))}
        </ul>
      )}
    </div>
  );
}
