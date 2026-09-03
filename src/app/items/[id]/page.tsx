import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SessionHeader from "@/components/SessionHeader";
import SiteFooter from "@/components/SiteFooter";
import RunNudge from "@/components/RunNudge";
import { getGameData } from "@/lib/game-data";
import { tierClass, tierLabel, typeGlyph, typeLabel } from "@/lib/ui";

function breadcrumbJsonLd(item: { id: string; name: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ammonomicon", item: "https://gungeoncompanion.com/" },
      { "@type": "ListItem", position: 2, name: "Items", item: "https://gungeoncompanion.com/items" },
      { "@type": "ListItem", position: 3, name: item.name, item: `https://gungeoncompanion.com/items/${item.id}` },
    ],
  };
}

export function generateStaticParams() {
  return getGameData().items.map((i) => ({ id: i.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { itemsById, synergiesByItem } = getGameData();
  const item = itemsById.get(id);
  if (!item) return {};
  const synCount = synergiesByItem.get(id)?.length ?? 0;
  const title = `${item.name} — Enter the Gungeon ${typeLabel(item.type)} Guide`;
  const description = `${item.name} in Enter the Gungeon: ${item.description}${
    synCount > 0 ? ` See all ${synCount} ${item.name} synergies.` : ""
  }`.slice(0, 300);
  return {
    title,
    description,
    alternates: { canonical: `/items/${item.id}` },
    openGraph: { title, description, url: `/items/${item.id}` },
  };
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { itemsById, synergiesByItem } = getGameData();
  const item = itemsById.get(id);
  if (!item) notFound();

  const synergies = synergiesByItem.get(id) ?? [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(item)) }}
      />
      <SessionHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-6">
        <nav className="mb-4 text-xs text-ink-faint">
          <Link href="/items" className="underline hover:text-ink">
            ← All Enter the Gungeon items
          </Link>
        </nav>

        <article className="panel p-5">
          <div className="flex items-start gap-4">
            <span
              className={`inline-flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border tier-${item.quality.toLowerCase()}`}
              style={{ borderColor: "currentColor" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- hotlinked wiki sprite; next/image would proxy/charge for external CDN */}
              <img
                src={item.imageUrl ?? ""}
                alt={item.name}
                width={72}
                height={72}
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain p-1.5"
                style={{ imageRendering: "pixelated" }}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="kicker mb-1">
                Enter the Gungeon · {typeGlyph(item.type)} {typeLabel(item.type)}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-bold text-ink">
                  {item.name}
                </h1>
                <span className={tierClass(item.quality)}>{tierLabel(item.quality)}</span>
              </div>
              {item.quote && (
                <p className="mt-1 font-display text-sm italic text-amber">
                  &ldquo;{item.quote}&rdquo;
                </p>
              )}
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink-dim">
            {item.description}
          </p>
        </article>

        <section className="mt-6">
          <h2 className="kicker mb-3">
            Synergies · {synergies.length}
          </h2>
          {synergies.length === 0 ? (
            <p className="panel px-5 py-6 text-sm text-ink-faint">
              {item.name} has no listed synergies — it works the same no matter
              what else you&apos;re carrying.
            </p>
          ) : (
            <ul className="space-y-3">
              {synergies.map((s) => (
                <li key={s.id} className="panel p-4">
                  <h3 className="font-display text-base font-semibold text-teal">
                    {s.name}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                    {s.effect}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[0.65rem] uppercase tracking-wider text-ink-faint">
                    Requires:
                    {s.groups.map((g, gi) => (
                      <span key={g.index} className="flex flex-wrap items-center gap-1.5">
                        {gi > 0 && <span className="text-ink-faint">+</span>}
                        {g.items.map((gItem, ii) => (
                          <span key={gItem.id} className="flex items-center gap-1.5">
                            {ii > 0 && <span className="lowercase">or</span>}
                            {gItem.id === item.id ? (
                              <span className="border border-line bg-bg px-2 py-0.5 text-amber">
                                {gItem.name}
                              </span>
                            ) : (
                              <Link
                                href={`/items/${gItem.id}`}
                                className="border border-line bg-bg px-2 py-0.5 text-ink underline-offset-2 hover:underline"
                              >
                                {gItem.name}
                              </Link>
                            )}
                          </span>
                        ))}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <RunNudge subject={item.name} />
      </main>
      <SiteFooter />
    </>
  );
}
