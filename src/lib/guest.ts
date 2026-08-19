// Guest mode: run tracking without an account. The cookie tells the server
// to render the dashboard for an unauthenticated visitor; the run itself
// lives only in the browser's localStorage.

export const GUEST_COOKIE = "guest_run";
export const GUEST_RUN_ID = "guest";
export const GUEST_RUN_NAME = "Guest Run";
export const GUEST_STORAGE_KEY = "gungeon-guest-run-items";

export type GuestRunState = {
  itemIds: string[];
  /** itemId -> owned count; only stackable items ever exceed 1. */
  quantities: Record<string, number>;
};

export function loadGuestRun(): GuestRunState {
  try {
    const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return { itemIds: [], quantities: {} };
    const parsed = JSON.parse(raw);
    // Legacy format: a plain array of item ids.
    if (Array.isArray(parsed)) {
      return {
        itemIds: parsed.filter((v) => typeof v === "string"),
        quantities: {},
      };
    }
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.itemIds)) {
      const quantities: Record<string, number> = {};
      if (parsed.quantities && typeof parsed.quantities === "object") {
        for (const [k, v] of Object.entries(parsed.quantities)) {
          if (typeof v === "number" && Number.isFinite(v) && v > 1) {
            quantities[k] = Math.min(99, Math.floor(v));
          }
        }
      }
      return {
        itemIds: parsed.itemIds.filter((v: unknown) => typeof v === "string"),
        quantities,
      };
    }
    return { itemIds: [], quantities: {} };
  } catch {
    return { itemIds: [], quantities: {} };
  }
}

export function saveGuestRun(
  itemIds: Iterable<string>,
  quantities: ReadonlyMap<string, number>,
) {
  try {
    window.localStorage.setItem(
      GUEST_STORAGE_KEY,
      JSON.stringify({
        itemIds: [...itemIds],
        quantities: Object.fromEntries(
          [...quantities].filter(([, n]) => n > 1),
        ),
      }),
    );
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
