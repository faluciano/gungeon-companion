import type { Metadata } from "next";
import Header from "@/components/Header";
import SharedRun from "@/components/SharedRun";
import SiteFooter from "@/components/SiteFooter";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shared run — Ammonomicon",
  description:
    "A shared Enter the Gungeon loadout — see its items, active synergies, and what it's one pickup away from.",
};

// The run itself travels in the URL fragment, which never reaches the server —
// this page only resolves who's viewing so the import flow knows where a
// "save" should land (localStorage for guests, the synced run for accounts).
export default async function SharedRunPage() {
  const session = await getSession();

  return (
    <>
      <Header email={session?.user?.email ?? null} guest={!session?.user?.id} />
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-5 py-6">
        <SharedRun signedIn={Boolean(session?.user?.id)} />
      </main>
      <SiteFooter />
    </>
  );
}
