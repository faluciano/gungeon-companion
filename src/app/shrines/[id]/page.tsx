import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SessionHeader from "@/components/SessionHeader";
import SiteFooter from "@/components/SiteFooter";
import RunNudge from "@/components/RunNudge";
import { SHRINES } from "@/lib/data/shrines";

/** Wrap the flavor line in quotes unless it already carries its own. */
function quoteFlavor(flavor: string) {
  return /^["\u201c]/.test(flavor) ? flavor : `\u201c${flavor}\u201d`;
}

function breadcrumbJsonLd(shrine: { id: string; name: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ammonomicon", item: "https://gungeoncompanion.com/" },
      { "@type": "ListItem", position: 2, name: "Shrines", item: "https://gungeoncompanion.com/shrines" },
      { "@type": "ListItem", position: 3, name: shrine.name, item: `https://gungeoncompanion.com/shrines/${shrine.id}` },
    ],
  };
}

export function generateStaticParams() {
  return SHRINES.map((s) => ({ id: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const shrine = SHRINES.find((s) => s.id === id);
  if (!shrine) return {};
  // Players search the in-game flavor line verbatim, so it belongs in the
  // title where Google bolds the match — not just in the description.
  const title = `${shrine.name} — ${quoteFlavor(shrine.flavor)} · Enter the Gungeon`;
  const description = `${quoteFlavor(shrine.flavor)} What the ${shrine.name} does in Enter the Gungeon: ${shrine.effect}`.slice(0, 300);
  return {
    title,
    description,
    alternates: { canonical: `/shrines/${shrine.id}` },
    openGraph: { title, description, url: `/shrines/${shrine.id}` },
  };
}

export default async function ShrinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shrine = SHRINES.find((s) => s.id === id);
  if (!shrine) notFound();

  const others = SHRINES.filter((s) => s.id !== shrine.id);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(shrine)) }}
      />
      <SessionHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-6">
        <nav className="mb-4 text-xs text-ink-faint">
          <Link href="/shrines" className="underline hover:text-ink">
            ← All Enter the Gungeon shrines
          </Link>
        </nav>

        <article className="panel p-5">
          <div className="flex items-start gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center border border-line-bright bg-bg-raised">
              {/* eslint-disable-next-line @next/next/no-img-element -- hotlinked wiki sprite; next/image would proxy/charge for external CDN */}
              <img
                src={shrine.imageUrl}
                alt={shrine.name}
                width={72}
                height={72}
                referrerPolicy="no-referrer"
                className="h-[4.5rem] w-[4.5rem] object-contain p-1"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="kicker mb-1">Enter the Gungeon · Shrine</p>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-bold text-ink">
                  {shrine.name}
                </h1>
                {shrine.curse && (
                  <span className="chip chip-ready shrink-0">{shrine.curse}</span>
                )}
              </div>
              <p className="mt-1 font-display text-sm italic text-amber">
                {shrine.flavor}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink-dim">{shrine.effect}</p>

          <div className="mt-5 grid grid-cols-2 gap-2">
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
        </article>

        <section className="mt-6">
          <h2 className="kicker mb-3">Other shrines</h2>
          <ul className="flex flex-wrap gap-2">
            {others.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/shrines/${s.id}`}
                  className="btn btn-ghost px-3 py-1 text-xs"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <RunNudge subject={`the ${shrine.name}`} />
      </main>
      <SiteFooter />
    </>
  );
}
