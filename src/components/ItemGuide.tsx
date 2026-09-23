import Link from "next/link";
import type { ItemGuide as Guide } from "@/lib/data/item-guides";

/** Quest walkthrough: where to take the item and how not to lose it on the way. */
export default function ItemGuide({
  guide,
  related = [],
  compact = false,
}: {
  guide: Guide;
  /** Resolved `guide.related` items to link to. */
  related?: { id: string; name: string }[];
  /** Goal and steps only — for the run tracker's item modal. */
  compact?: boolean;
}) {
  return (
    <section className={compact ? "mt-5" : "panel mt-6 p-5"}>
      <h2 className="kicker mb-2">How to use it</h2>
      <p className="text-sm font-semibold leading-relaxed text-amber">{guide.goal}</p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-dim marker:text-ink-faint">
        {guide.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>

      {!compact && guide.tips.length > 0 && (
        <>
          <h3 className="kicker mb-2 mt-5">Don&apos;t lose it</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-dim marker:text-ink-faint">
            {guide.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </>
      )}

      {!compact && related.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[0.65rem] uppercase tracking-wider text-ink-faint">
          See also:
          {related.map((r) => (
            <Link
              key={r.id}
              href={`/items/${r.id}`}
              className="border border-line bg-bg px-2 py-0.5 text-ink underline-offset-2 hover:underline"
            >
              {r.name}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
