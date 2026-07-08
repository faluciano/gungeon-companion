"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Mode = "signin" | "signup";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthGate() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    setBusy(true);
    try {
      const res = await authClient.signIn.passkey();
      if (res?.error) {
        setError(res.error.message ?? "Could not sign in with that passkey.");
        return;
      }
      router.refresh();
    } catch {
      setError("Passkey sign-in was cancelled or is unavailable on this device.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp() {
    setError(null);
    setNotice(null);
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setError("Enter a valid email address to create your account.");
      return;
    }
    setBusy(true);
    try {
      // Passkey-first registration: `context` is forwarded to resolveUser on
      // the server, which creates the account keyed to this email.
      const res = await authClient.passkey.addPasskey({
        name: "Primary passkey",
        context: value,
      });
      if (res?.error) {
        setError(res.error.message ?? "Could not create a passkey.");
        return;
      }
      // Establish a session with the freshly created credential.
      const signIn = await authClient.signIn.passkey();
      if (signIn?.error) {
        setNotice("Account created. Sign in with your passkey to continue.");
        setMode("signin");
        return;
      }
      router.refresh();
    } catch {
      setError("Passkey registration was cancelled or is unavailable on this device.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rise">
      <div className="panel p-7">
        <p className="kicker mb-2">Ammonomicon // Access</p>
        <h2 className="font-display text-2xl font-semibold text-ink">
          {mode === "signin" ? "Enter the Gungeon" : "Register a Gungeoneer"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-dim">
          {mode === "signin"
            ? "Authenticate with your passkey — a fingerprint, face, or security key. No passwords in this dungeon."
            : "Claim your codex. We bind a passkey to your email so your runs follow you across devices."}
        </p>

        <div className="mt-6 space-y-4">
          {mode === "signup" && (
            <label className="block">
              <span className="kicker">Email</span>
              <input
                type="email"
                value={email}
                autoComplete="username webauthn"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gungeoneer@keep.io"
                className="mt-2 w-full border border-line-bright bg-bg-raised px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
              />
            </label>
          )}

          {error && (
            <p className="border border-danger/60 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
          {notice && (
            <p className="border border-teal/50 bg-teal/10 px-3 py-2 text-xs text-teal">
              {notice}
            </p>
          )}

          <button
            className="btn btn-primary w-full px-4 py-3 text-sm"
            disabled={busy}
            onClick={mode === "signin" ? handleSignIn : handleSignUp}
          >
            {busy
              ? "Communing with the Gungeon…"
              : mode === "signin"
                ? "Sign in with passkey"
                : "Create account + passkey"}
          </button>
        </div>

        <div className="mt-6 border-t border-line pt-4 text-center text-xs text-ink-faint">
          {mode === "signin" ? (
            <button
              className="underline decoration-amber-deep underline-offset-4 hover:text-ink"
              onClick={() => {
                setMode("signup");
                setError(null);
                setNotice(null);
              }}
            >
              New here? Register a Gungeoneer →
            </button>
          ) : (
            <button
              className="underline decoration-amber-deep underline-offset-4 hover:text-ink"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
            >
              ← Already have a passkey? Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
