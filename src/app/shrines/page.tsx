import type { Metadata } from "next";
import SessionHeader from "@/components/SessionHeader";
import ShrineBoard from "@/components/ShrineBoard";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Shrines — Gungeon Run Companion",
  description:
    "What every shrine in Enter the Gungeon does — the boon it grants, what it costs, and the curse or risk that comes with it.",
};

export default function ShrinesPage() {
  return (
    <>
      <SessionHeader />
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-5 py-6">
        <ShrineBoard />
      </main>
      <SiteFooter />
    </>
  );
}
