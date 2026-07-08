"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function Header({ email }: { email: string | null }) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line-bright bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center border border-amber bg-amber/10 font-display text-lg font-bold text-amber hard-shadow">
            ⁂
          </span>
          <div>
            <h1 className="font-display text-lg font-bold leading-none tracking-wide text-ink">
              AMMONOMICON
            </h1>
            <p className="mt-0.5 text-[0.62rem] uppercase tracking-[0.28em] text-ink-faint">
              Gungeon Run Companion
            </p>
          </div>
        </div>
        {email && (
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-ink-faint sm:inline">{email}</span>
            <button className="btn btn-ghost px-3 py-1.5 text-xs" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
