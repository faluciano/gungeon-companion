import type { Metadata } from "next";
import Link from "next/link";
import SessionHeader from "@/components/SessionHeader";
import SiteFooter from "@/components/SiteFooter";
import { getGameData, type GameItem } from "@/lib/game-data";
import { tierClass, tierLabel, typeGlyph, typeLabel, type ItemType } from "@/lib/ui";

const description =
  "Browse all guns, passives, and actives in Enter the Gungeon — every item with its quality tier, effect, and the synergies it unlocks.";

export const metadata: Metadata = {
  title: "Enter the Gungeon Items — All Guns & Items with Synergies",
  description,
  alternates: { canonical: "/items" },
  openGraph: {
    title: "Enter the Gungeon Items — All Guns & Items with Synergies",
    description,
    url: "/items",
  },
};

/** Server-rendered sprite; no error fallback needed since every item has one. */
function Sprite({ item }: { item: GameItem }) {
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border tier-${item.quality.toLowerCase()}`}
      style={{ borderColor: "currentColor" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- hotlinked wiki sprite; next/image would proxy/charge for external CDN */}
      <img
        src={item.imageUrl ?? ""}
        alt={item.name}
        width={36}
        height={36}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-full w-full object-contain p-1"
        style={{ imageRendering: "pixelated" }}
      />
    </span>
  );
}

export default function ItemsPage() {
  const { items, synergiesByItem } = getGameData();
  const types: ItemType[] = ["gun", "passive", "active"];

  return (
    <>
      <SessionHeader />
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-5 py-6">
        <div className="panel p-4">
          <h1 className="kicker mb-2">Enter the Gungeon // Items</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-dim">
            The full Ammonomicon: all {items.length} guns and items in Enter the
            Gungeon. Open any item to see what it does and every synergy it can
            form. Tracking a run?{" "}
            <Link href="/" className="text-amber underline">
              Log your loadout
            </Link>{" "}
            and synergies light up automatically.
          </p>
        </div>

        {types.map((t) => {
          const group = items.filter((i) => i.type === t);
          return (
            <section key={t} className="mt-6">
              <h2 className="kicker mb-3">
                {typeGlyph(t)} {typeLabel(t)}s · {group.length}
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/items/${item.id}`}
                      className="panel flex items-center gap-3 px-3 py-2 transition-colors hover:border-line-bright"
                    >
                      <Sprite item={item} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">
                          {item.name}
                        </span>
                        <span className="block text-[0.62rem] uppercase tracking-wider text-ink-faint">
                          {synergiesByItem.get(item.id)?.length ?? 0} synergies
                        </span>
                      </span>
                      <span className={tierClass(item.quality)}>
                        {tierLabel(item.quality)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
      <SiteFooter />
    </>
  );
}
