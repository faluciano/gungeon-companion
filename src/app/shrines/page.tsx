import type { Metadata } from "next";
import Header from "@/components/Header";
import ShrineBoard from "@/components/ShrineBoard";
import SiteFooter from "@/components/SiteFooter";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shrines — Gungeon Run Companion",
  description:
    "What every shrine in Enter the Gungeon does — the boon it grants, what it costs, and the curse or risk that comes with it.",
};

export default async function ShrinesPage() {
  const session = await getSession();

  return (
    <>
      <Header email={session?.user?.email ?? null} />
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-5 py-6">
        <ShrineBoard />
      </main>
      <SiteFooter />
    </>
  );
}
