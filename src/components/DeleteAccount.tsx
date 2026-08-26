"use client";

import { useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";

// Self-service account deletion, rendered on /privacy. Only appears for
// signed-in users; deleting cascades to passkeys, sessions, and runs (the
// schema's onDelete: "cascade" foreign keys). Passkey accounts have no
// password, so better-auth requires a fresh session — stale ones get told
// to sign in again rather than a cryptic failure.

export default function DeleteAccount() {
  const { data } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!data?.user) return null;

  async function deleteAccount() {
    setDeleting(true);
    setError(null);
    const { error: err } = await authClient.deleteUser();
    if (err) {
      setDeleting(false);
      setError(
        err.status === 400
          ? "For safety, deleting needs a recent sign-in. Sign out, sign back in with your passkey, and try again."
          : "Couldn't delete your account — check your connection and try again.",
      );
      return;
    }
    window.location.href = "/";
  }

  return (
    <div className="mt-4 border border-danger/40 bg-danger/5 p-4">
      <p className="text-xs text-ink-dim">
        Signed in as <span className="text-ink">{data.user.email}</span>. Deleting
        your account permanently removes your email, passkeys, sessions, and runs.
        There is no undo.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {confirming ? (
          <>
            <button
              className="btn border border-danger bg-danger/15 px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/25"
              onClick={deleteAccount}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Permanently delete everything"}
            </button>
            <button
              className="btn btn-ghost px-3 py-1.5 text-xs"
              onClick={() => setConfirming(false)}
              disabled={deleting}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            className="btn btn-ghost border border-danger/50 px-3 py-1.5 text-xs text-danger"
            onClick={() => setConfirming(true)}
          >
            Delete my account
          </button>
        )}
      </div>
      {error && <p className="mt-3 text-xs text-danger">{error}</p>}
    </div>
  );
}
