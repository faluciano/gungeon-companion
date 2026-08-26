"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { GUEST_COOKIE } from "@/lib/guest";

/**
 * Rendered from the static landing page. Once the client-side session check
 * settles, returning users (signed in or in guest mode) are sent to /run.
 */
export default function RedirectIfActive() {
  const router = useRouter();
  const { data, isPending } = useSession();

  useEffect(() => {
    if (isPending) return;
    const isGuest = document.cookie
      .split("; ")
      .includes(`${GUEST_COOKIE}=1`);
    if (data?.user || isGuest) {
      router.replace("/run");
    }
  }, [data, isPending, router]);

  return null;
}
