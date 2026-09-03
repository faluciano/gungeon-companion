import type { Metadata } from "next";
import Link from "next/link";
import SessionHeader from "@/components/SessionHeader";
import SiteFooter from "@/components/SiteFooter";
import ItemCatalog from "@/components/ItemCatalog";
import { getGameData } from "@/lib/game-data";

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

export default function ItemsPage() {
  const { items } = getGameData();

  return (
    <>
      <SessionHeader />
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-5 py-6">
        <div className="panel p-4">
          <h1 className="kicker mb-2">Enter the Gungeon // Items</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-dim">
            The full Ammonomicon: all {items.length} guns and items in Enter the
            Gungeon. Search by name, effect, or synergy, and open any item to see
            what it does and every synergy it can form. Tracking a run?{" "}
            <Link href="/" className="text-amber underline">
              Log your loadout
            </Link>{" "}
            and synergies light up automatically.
          </p>
        </div>

        <ItemCatalog />
      </main>
      <SiteFooter />
    </>
  );
}
