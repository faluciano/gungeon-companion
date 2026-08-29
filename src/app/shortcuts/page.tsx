import type { Metadata } from "next";
import SessionHeader from "@/components/SessionHeader";
import ShortcutBoard from "@/components/ShortcutBoard";
import SiteFooter from "@/components/SiteFooter";
import { SHORTCUT_FLOORS } from "@/lib/data/shortcuts";

const title = "Enter the Gungeon Shortcuts — Every Elevator & What Tailor Wants";
const description =
  "What each elevator shortcut in Enter the Gungeon costs — blanks, armor, junk, hearts, keys, casings or Hegemony Credits — plus the gun each one unlocks and what the Rat hands you on arrival.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/shortcuts" },
  openGraph: { title, description, url: "/shortcuts" },
};

// ItemList structured data so search engines see this page covers every
// elevator, not only the floor whose name matched the query.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Enter the Gungeon Elevator Shortcuts",
  description,
  numberOfItems: SHORTCUT_FLOORS.length,
  itemListElement: SHORTCUT_FLOORS.map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: `${s.name} shortcut`,
    url: `https://gungeoncompanion.com/shortcuts/${s.id}`,
  })),
};

export default function ShortcutsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SessionHeader />
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-5 py-6">
        <ShortcutBoard />
      </main>
      <SiteFooter />
    </>
  );
}
