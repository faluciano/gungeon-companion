"use client";

import Header from "./Header";
import { useSession } from "@/lib/auth-client";

/**
 * Header variant that resolves the session on the client, so pages using it can
 * be statically rendered (no server-side cookie read / dynamic function).
 */
export default function SessionHeader() {
  const { data } = useSession();
  return <Header email={data?.user?.email ?? null} />;
}
