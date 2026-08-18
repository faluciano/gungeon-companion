// Guest mode: run tracking without an account. The cookie tells the server
// to render the dashboard for an unauthenticated visitor; the run itself
// lives only in the browser's localStorage.

export const GUEST_COOKIE = "guest_run";
export const GUEST_RUN_ID = "guest";
export const GUEST_RUN_NAME = "Guest Run";
export const GUEST_STORAGE_KEY = "gungeon-guest-run-items";

export function loadGuestItemIds(): string[] {
  try {
    const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function saveGuestItemIds(itemIds: Iterable<string>) {
  try {
    window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify([...itemIds]));
  } catch {
    // Storage unavailable (private mode, quota) — the run stays in memory.
  }
}

export function enterGuestMode() {
  document.cookie = `${GUEST_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
}

export function exitGuestMode() {
  document.cookie = `${GUEST_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
