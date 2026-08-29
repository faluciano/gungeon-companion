"use client";

import { useState } from "react";
import Link from "next/link";
import { SHORTCUTS, type Shortcut, type ShortcutUnlock } from "@/lib/data/shortcuts";

function UnlockChip({ unlock }: { unlock: ShortcutUnlock }) {
  const [failed, setFailed] = useState(false);
  return (
    <Link
      href={`/items/${unlock.itemId}`}
      className="inline-flex items-center gap-2 border border-line bg-bg px-2 py-1 text-xs text-ink hover:border-amber hover:text-amber"
    >
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element -- hotlinked wiki sprite; next/image would proxy/charge for external CDN
        <img
          src={unlock.imageUrl}
          alt=""
          width={24}
          height={24}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-6 w-6 object-contain"
          style={{ imageRendering: "pixelated" }}
        />
      )}
      {unlock.name}
    </Link>
  );
}

export function ShortcutCard({ shortcut }: { shortcut: Shortcut }) {
  return (
    <li id={shortcut.id} className="panel flex scroll-mt-20 flex-col p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center border border-line-bright bg-bg-raised font-display text-xl font-bold text-amber">
          {shortcut.badge}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-ink">
            <Link href={`/shortcuts/${shortcut.id}`} className="hover:text-amber">
              {shortcut.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-ink-faint">{shortcut.blurb}</p>
        </div>
      </div>

      <div className="mt-4 panel-inset px-3 py-2">
        <p className="kicker mb-1 text-[0.58rem]">
          {shortcut.costs.length > 1 ? "Bring any one of" : "Requires"}
        </p>
        <ul className="space-y-0.5 text-xs text-ink">
          {shortcut.costs.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      <div className="mt-2 panel-inset border-l-2 border-l-teal px-3 py-2">
        <p className="kicker mb-1 text-[0.58rem]">On arrival</p>
        <p className="text-xs text-teal">{shortcut.ratOffer}</p>
      </div>

      {shortcut.unlocks.length > 0 && (
        <div className="mt-3">
          <p className="kicker mb-1.5 text-[0.58rem]">Unlocks</p>
          <div className="flex flex-wrap gap-2">
            {shortcut.unlocks.map((u) => (
              <UnlockChip key={u.itemId} unlock={u} />
            ))}
          </div>
        </div>
      )}

      {shortcut.notes.length > 0 && (
        <ul className="mt-3 space-y-1 text-[0.7rem] leading-relaxed text-ink-faint">
          {shortcut.notes.map((n) => (
            <li key={n}>· {n}</li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function ShortcutBoard() {
  return (
    <div className="space-y-5">
      <div className="panel p-4">
        <h2 className="kicker mb-2">Enter the Gungeon // Shortcuts</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-ink-dim">
          Tailor the Tinker repairs the Breach elevators in exchange for
          supplies. Find him by stepping away from the elevator on any floor
          until it leaves, then dropping down the shaft. Materials can be handed
          over across several runs, but each requirement has to be paid in full
          in one go — and you only ever owe one of the options listed.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SHORTCUTS.map((s) => (
          <ShortcutCard key={s.id} shortcut={s} />
        ))}
      </ul>
    </div>
  );
}
