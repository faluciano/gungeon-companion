import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SessionHeader from "@/components/SessionHeader";
import SiteFooter from "@/components/SiteFooter";
import RunNudge from "@/components/RunNudge";
import { SHORTCUTS } from "@/lib/data/shortcuts";

export function generateStaticParams() {
  return SHORTCUTS.map((s) => ({ id: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const shortcut = SHORTCUTS.find((s) => s.id === id);
  if (!shortcut) return {};
  const title = `${shortcut.name} Shortcut — Enter the Gungeon Elevator Guide`;
  const description =
    `What Tailor wants for the ${shortcut.name} elevator in Enter the Gungeon: ` +
    `${shortcut.costs.join(", or ")}. ${shortcut.blurb}`.slice(0, 300);
  return {
    title,
    description,
    alternates: { canonical: `/shortcuts/${shortcut.id}` },
    openGraph: { title, description, url: `/shortcuts/${shortcut.id}` },
  };
}

export default async function ShortcutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shortcut = SHORTCUTS.find((s) => s.id === id);
  if (!shortcut) notFound();

  const others = SHORTCUTS.filter((s) => s.id !== shortcut.id);

  return (
    <>
      <SessionHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-6">
        <nav className="mb-4 text-xs text-ink-faint">
          <Link href="/shortcuts" className="underline hover:text-ink">
            ← All Enter the Gungeon shortcuts
          </Link>
        </nav>

        <article className="panel p-5">
          <div className="flex items-start gap-4">
            <div
              className={`grid h-20 w-20 shrink-0 place-items-center border border-line-bright bg-bg-raised font-display font-bold text-amber ${shortcut.badge.length > 1 ? "text-2xl" : "text-4xl"}`}
            >
              {shortcut.badge}
            </div>
            <div className="min-w-0 flex-1">
              <p className="kicker mb-1">Enter the Gungeon · Elevator</p>
              <h1 className="font-display text-3xl font-bold text-ink">
                {shortcut.name}
              </h1>
              <p className="mt-1 text-sm text-ink-dim">{shortcut.blurb}</p>
            </div>
          </div>

          <div className="mt-5 panel-inset px-3 py-3">
            <p className="kicker mb-1.5 text-[0.58rem]">
              {shortcut.costs.length > 1 ? "Bring Tailor any one of" : "Requires"}
            </p>
            <ul className="space-y-1 text-sm text-ink">
              {shortcut.costs.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>

          <div className="mt-2 panel-inset border-l-2 border-l-teal px-3 py-3">
            <p className="kicker mb-1.5 text-[0.58rem]">On arrival</p>
            <p className="text-sm text-teal">{shortcut.ratOffer}</p>
          </div>

          {shortcut.unlocks.length > 0 && (
            <div className="mt-4">
              <p className="kicker mb-1.5 text-[0.58rem]">Unlocks</p>
              <ul className="flex flex-wrap gap-2">
                {shortcut.unlocks.map((u) => (
                  <li key={u.itemId}>
                    <Link
                      href={`/items/${u.itemId}`}
                      className="btn btn-ghost px-3 py-1 text-xs"
                    >
                      {u.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {shortcut.notes.length > 0 && (
            <ul className="mt-4 space-y-1 text-xs leading-relaxed text-ink-faint">
              {shortcut.notes.map((n) => (
                <li key={n}>· {n}</li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap gap-1.5">
            {shortcut.tags.map((t) => (
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
          <h2 className="kicker mb-3">Other shortcuts</h2>
          <ul className="flex flex-wrap gap-2">
            {others.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/shortcuts/${s.id}`}
                  className="btn btn-ghost px-3 py-1 text-xs"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <RunNudge subject={`the ${shortcut.name} shortcut`} />
      </main>
      <SiteFooter />
    </>
  );
}
