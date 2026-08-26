import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import GuestDashboard from "@/components/GuestDashboard";
import SiteFooter from "@/components/SiteFooter";
import { getSession } from "@/lib/session";
import { getOrCreateActiveRun } from "@/lib/runs";
import { GUEST_COOKIE } from "@/lib/guest";

export const dynamic = "force-dynamic";

export default async function RunPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    const cookieStore = await cookies();
    if (cookieStore.get(GUEST_COOKIE)?.value === "1") {
      return (
        <>
          <Header email={null} guest />
          <main className="mx-auto w-full max-w-[1500px] flex-1 px-5 py-6">
            <GuestDashboard />
          </main>
          <SiteFooter />
        </>
      );
    }

    redirect("/");
  }

  const run = await getOrCreateActiveRun(session.user.id);

  return (
    <>
      <Header email={session.user.email ?? null} />
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-5 py-6">
        <Dashboard
          runId={run.id}
          runName={run.name}
          initialItemIds={run.itemIds}
          initialQuantities={run.quantities}
        />
      </main>
      <SiteFooter />
    </>
  );
}
