import type { Metadata } from "next";
import SessionHeader from "@/components/SessionHeader";
import ShrineBoard from "@/components/ShrineBoard";
import SiteFooter from "@/components/SiteFooter";
import { SHRINES } from "@/lib/data/shrines";

const description =
  "Every shrine in Enter the Gungeon — Ammo, Angel, Blood, Beholster, and the rest — with what each one does, what it costs, and how much curse it adds.";

export const metadata: Metadata = {
  title: `Enter the Gungeon Shrines — All ${SHRINES.length} Shrines, Effects & Costs`,
  description,
  alternates: { canonical: "/shrines" },
  openGraph: {
    title: `Enter the Gungeon Shrines — All ${SHRINES.length} Shrines, Effects & Costs`,
    description,
    url: "/shrines",
  },
};

// ItemList structured data so search engines understand this page covers
// every shrine, not just the one whose flavor text matched the query.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Enter the Gungeon Shrines",
  description,
  numberOfItems: SHRINES.length,
  itemListElement: SHRINES.map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: s.name,
    url: `https://gungeoncompanion.com/shrines/${s.id}`,
  })),
};

export default function ShrinesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SessionHeader />
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-5 py-6">
        <ShrineBoard />
      </main>
      <SiteFooter />
    </>
  );
}
