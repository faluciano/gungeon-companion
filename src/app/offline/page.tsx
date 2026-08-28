import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Offline — Ammonomicon",
};

export default function OfflinePage() {
  return (
    <>
      <main className="mx-auto flex min-h-[70vh] w-full max-w-[1500px] flex-1 flex-col justify-center px-5 py-10 text-center">
        <p className="kicker mb-3">Connection lost</p>
        <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
          The Ammonomicon is <span className="text-amber">out of reach</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-dim">
          Your run is saved. Reconnect and reload to pick it back up where you
          left off.
        </p>
        <div className="mt-8">
          <Link href="/" className="btn btn-primary px-4 py-2 text-xs">
            Try again
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
