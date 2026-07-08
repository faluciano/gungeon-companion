import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/** Get the current session (or null) from request headers. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Get the current user id, throwing a 401-style error if unauthenticated. */
export async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return session.user.id;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
