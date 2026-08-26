import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import DeleteAccount from "@/components/DeleteAccount";

export const metadata: Metadata = {
  title: "Privacy — Ammonomicon",
  description:
    "What the Ammonomicon stores, why, and how to get it deleted. Short version: guest runs stay in your browser; accounts store an email and passkey.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="kicker mb-3">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-ink-dim">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Header email={null} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
        <p className="kicker mb-3">Ammonomicon · Privacy</p>
        <h1 className="font-display text-3xl font-bold text-ink">
          What this site knows about you
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-dim">
          The Ammonomicon is a free, fan-made companion for Enter the Gungeon,
          run by one person. It collects the minimum it needs to work, sells
          nothing, and shows no ads. This page is the whole story.
        </p>

        <Section title="If you play as a guest">
          <p>
            Nothing about you is stored on the server. Your run lives in your
            browser&apos;s localStorage, on your device, and a single cookie
            (<code className="text-ink">guest_run</code>) remembers that you
            chose guest mode. Clearing your browser data removes all of it.
          </p>
        </Section>

        <Section title="If you create an account">
          <p>To sync runs across devices, the server stores:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <span className="text-ink">Your email address and display name</span> —
              to identify your account.
            </li>
            <li>
              <span className="text-ink">Passkey public keys</span>{" — "}passkeys mean
              there is no password. The private half never leaves your device;
              what&apos;s stored here cannot be used to sign in as you anywhere.
            </li>
            <li>
              <span className="text-ink">Session records</span>, including IP address
              and browser user-agent — kept for sign-in security (spotting
              stolen sessions, rate-limiting abuse).
            </li>
            <li>
              <span className="text-ink">Your runs</span> — the items and guns you
              track.
            </li>
          </ul>
        </Section>

        <Section title="Share links">
          <p>
            A share link encodes the run in the link itself (the part after{" "}
            <code className="text-ink">#</code>). That fragment is never sent to or
            stored on the server — sharing happens entirely between you and
            whoever you send the link to.
          </p>
        </Section>

        <Section title="Analytics">
          <p>
            The site uses Vercel Web Analytics: anonymous, cookie-free page
            counts (visitors, pages, country). It cannot identify you and no
            analytics data is tied to accounts.
          </p>
        </Section>

        <Section title="Who else touches the data">
          <p>
            The site runs on Vercel (hosting) and stores account data in a
            managed Postgres database. Those providers process data only to
            host this site. Nothing is sold, shared, or used for advertising —
            by them on this site&apos;s behalf, or by me.
          </p>
        </Section>

        <Section title="Deleting your data">
          <p>
            Guest data: clear this site&apos;s browsing data, done. Account data:
            sign in and delete your account right here — everything (account,
            passkeys, sessions, runs) is removed permanently.
          </p>
          <DeleteAccount />
        </Section>

        <Section title="Changes">
          <p>
            If what&apos;s collected ever changes, this page changes with it.
            Last updated: August 26, 2026.
          </p>
        </Section>

        <p className="mt-10 text-sm">
          <Link href="/" className="underline hover:text-ink">
            ← Back to the Ammonomicon
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
