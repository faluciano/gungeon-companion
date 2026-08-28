"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { exitGuestMode } from "@/lib/guest";
import InstallButton from "@/components/InstallButton";

const NAV: { href: string; label: string }[] = [
  { href: "/", label: "Run" },
  { href: "/shrines", label: "Shrines" },
];

export default function Header({
  email,
  guest = false,
}: {
  email: string | null;
  guest?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
  }

  function handleExitGuest() {
    exitGuestMode();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line-bright bg-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-2 px-3 py-3.5 sm:gap-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center border border-amber bg-amber/10 font-display text-lg font-bold text-amber hard-shadow">
              ⁂
            </span>
            <div className="hidden sm:block">
              <h1 className="font-display text-lg font-bold leading-none tracking-wide text-ink">
                AMMONOMICON
              </h1>
              <p className="mt-0.5 text-[0.62rem] uppercase tracking-[0.28em] text-ink-faint">
                Gungeon Run Companion
              </p>
            </div>
          </Link>
          <nav className="flex items-center gap-1.5">
            {NAV.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`btn px-3 py-1.5 text-xs ${active ? "btn-primary" : "btn-ghost"}`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <InstallButton />
          <a
            href="https://ko-fi.com/faluciano"
            target="_blank"
            rel="noopener noreferrer"
            className="btn border border-amber bg-amber/10 px-3 py-1.5 text-xs font-bold text-amber hover:bg-amber/20"
          >
            ☕<span className="hidden sm:inline"> Support</span>
          </a>
          {email ? (
            <>
              <span
                className="rounded-sm bg-teal/15 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-teal"
                title={`Runs sync to ${email} across devices`}
              >
                ◆ Synced
              </span>
              <span className="hidden text-xs text-ink-faint md:inline">{email}</span>
              <button className="btn btn-ghost px-3 py-1.5 text-xs" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : guest ? (
            <>
              <span className="hidden text-xs text-ink-faint md:inline">Guest run</span>
              <button className="btn btn-ghost px-3 py-1.5 text-xs" onClick={handleExitGuest}>
                Sign in
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
