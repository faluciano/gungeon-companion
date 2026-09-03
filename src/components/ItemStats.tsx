import TierBadge from "./TierBadge";
import type { GameItem } from "@/lib/game-data";
import {
  fireModeHint,
  gunClassLabel,
  qualitySource,
  type StatRow,
} from "@/lib/gun-stats";
import { typeLabel } from "@/lib/ui";

/** Ammonomicon fact sheet: type, quality, where it drops, and gun specifics. */
export function ItemFacts({
  item,
  synergyCount,
}: {
  item: GameItem;
  synergyCount: number;
}) {
  const stats = item.stats;
  const facts: { label: string; value: React.ReactNode; hint?: string }[] = [
    { label: "Type", value: typeLabel(item.type) },
    {
      label: "Quality",
      value: (
        <span className="flex items-center gap-2">
          <TierBadge quality={item.quality} />
          <span className="text-ink-dim">{qualitySource(item.quality)}</span>
        </span>
      ),
      hint:
        item.quality === "N"
          ? "No quality tier: starting gear, quest items, or rewards"
          : `${item.quality}-tier items drop from ${qualitySource(item.quality).toLowerCase()}`,
    },
    {
      label: "Synergies",
      value: synergyCount === 0 ? "None" : String(synergyCount),
    },
  ];
  if (stats) {
    facts.push(
      {
        label: "Fire mode",
        value: stats.fireMode,
        hint: fireModeHint(stats.fireMode) ?? undefined,
      },
      {
        label: "Class",
        value: gunClassLabel(stats.gunClass),
        hint: `Internal gun class: ${stats.gunClass}`,
      },
    );
    if (stats.infiniteAmmo) {
      facts.push({
        label: "Ammo",
        value: <span className="text-teal">Unlimited</span>,
        hint: "Never runs dry — but unlimited-ammo guns can't reveal secret walls",
      });
    }
  }

  return (
    <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {facts.map((f) => (
        <div key={f.label} className="panel-inset px-3 py-2" title={f.hint}>
          <dt className="kicker mb-1 text-[0.58rem]">{f.label}</dt>
          <dd className="text-xs text-ink">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function barClass(score: number): string {
  if (score >= 0.75) return "bg-teal";
  if (score >= 0.4) return "bg-amber";
  return "bg-ink-faint";
}

/** Combat stats with a rank bar per stat against every gun in the Ammonomicon. */
export function GunStatsPanel({
  item,
  rows,
}: {
  item: GameItem;
  rows: StatRow[];
}) {
  if (rows.length === 0) return null;
  const ranked = rows.filter((r) => r.rank != null);
  const gunCount = Math.max(...rows.map((r) => r.of));

  return (
    <section className="mt-6">
      <h2 className="kicker mb-3">{item.name} stats</h2>
      <div className="panel p-5">
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.def.key}
              className="grid grid-cols-[5.5rem_1fr] items-baseline gap-x-3 gap-y-1 sm:grid-cols-[6.5rem_1fr_6rem]"
              title={r.def.hint}
            >
              <span className="kicker text-[0.6rem]">{r.def.label}</span>
              <span className="min-w-0 text-sm text-ink">
                <span className="font-display font-semibold">{r.display}</span>
              </span>
              <span className="col-span-2 sm:col-span-1 sm:text-right">
                {r.score != null && r.rank != null ? (
                  <span className="flex items-center gap-2 sm:justify-end">
                    <span
                      className="h-1.5 w-24 shrink-0 overflow-hidden rounded-sm bg-line"
                      role="meter"
                      aria-valuemin={1}
                      aria-valuemax={r.of}
                      aria-valuenow={r.rank}
                      aria-label={`${r.def.label} rank ${r.rank} of ${r.of} guns`}
                    >
                      <span
                        className={`block h-full ${barClass(r.score)}`}
                        style={{ width: `${Math.max(4, Math.round(r.score * 100))}%` }}
                      />
                    </span>
                    <span className="whitespace-nowrap text-[0.65rem] text-ink-faint">
                      #{r.rank} of {r.of}
                    </span>
                  </span>
                ) : (
                  <span className="text-[0.65rem] text-ink-faint">
                    {r.display === "∞" ? "Unlimited" : "Not ranked"}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[0.7rem] leading-relaxed text-ink-faint">
          {ranked.length > 0
            ? `Ranked against the ${gunCount} guns in the Ammonomicon that list each stat; longer bars are better. `
            : ""}
          Fire rate is the delay between shots, so lower is faster; lower reload
          and spread are better too. Guns with several forms or charge levels are
          ranked on their base figure. Stats come from the community wiki and
          may lag behind patches.
        </p>
      </div>
    </section>
  );
}
