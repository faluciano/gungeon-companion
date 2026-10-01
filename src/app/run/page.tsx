import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import DashboardPlaceholder from "@/components/DashboardPlaceholder";
import GuestDashboard from "@/components/GuestDashboard";
import InstallBanner from "@/components/InstallBanner";
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
            <InstallBanner />
            <GuestDashboard />
          </main>
          <SiteFooter />
        </>
      );
    }

    redirect("/");
  }

  // The session check stays above the Suspense boundary so `redirect` is still
  // a real HTTP redirect; only the run query streams in behind the header.
  return (
    <>
      <Header email={session.user.email ?? null} />
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-5 py-6">
        <InstallBanner />
        <Suspense fallback={<DashboardPlaceholder />}>
          <SignedInDashboard userId={session.user.id} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function SignedInDashboard({ userId }: { userId: string }) {
  const run = await getOrCreateActiveRun(userId);

  return (
    <Dashboard
      runId={run.id}
      runName={run.name}
      initialItemIds={run.itemIds}
      initialQuantities={run.quantities}
    />
  );
}
