import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import AuthGate from "@/components/AuthGate";
import SiteFooter from "@/components/SiteFooter";
import { getSession } from "@/lib/session";
import { getRunView } from "@/lib/run-view";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  if (!session?.user?.id) {
    return (
      <>
        <Header email={null} />
        <main className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col justify-center px-5 py-10">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="rise">
              <p className="kicker mb-3">Enter the Gungeon · Companion</p>
              <h2 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
                Track your run.
                <br />
                <span className="text-amber">Reveal every synergy.</span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-dim">
                Log the guns and items you pick up, and the Ammonomicon instantly
                surfaces which combos are <span className="text-teal">active</span>{" "}
                and which are <span className="text-amber">one pickup away</span>.
                Search any item to see if it clicks with what you&apos;re holding —
                complete with accurate descriptions and effects.
              </p>
              <ul className="mt-6 space-y-2 text-xs text-ink-faint">
                <li>▣ 500+ guns &amp; items · 390+ real synergies</li>
                <li>◈ Live synergy detection as your loadout changes</li>
                <li>◆ Passwordless passkey sign-in · runs synced to your account</li>
              </ul>
            </div>
            <AuthGate />
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const run = await getRunView(session.user.id);

  return (
    <>
      <Header email={session.user.email ?? null} />
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-5 py-6">
        <Dashboard initialRun={run} />
      </main>
      <SiteFooter />
    </>
  );
}
