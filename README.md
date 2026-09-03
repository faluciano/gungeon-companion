# Ammonomicon — Enter the Gungeon Run Companion

A web app that tracks the items and guns in your current **Enter the Gungeon** run and
tells you, as you search, which items **synergize** with what you already hold. Every item
has an accurate description, and synergies show whether they're **active** or **one item
away**.

- **Passkey-only auth** (WebAuthn) — no passwords.
- **Cloud-saved runs** in Postgres, per account.
- **Extremely robust search** — punctuation/accent-insensitive, acronym-aware,
  typo-tolerant, and it also matches descriptions, flavour quotes, and synergy names.
- Curated, datamined dataset of **501 items** and **394 synergies** bundled with the app.
  Search and synergy evaluation run **entirely in the browser** — zero latency, no
  server round-trips; the server only handles auth and persists run item ids.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19) |
| Styling | Tailwind CSS v4 |
| Auth | Better Auth + passkey plugin (WebAuthn) |
| Database | Postgres via Drizzle ORM (`node-postgres`) |
| Hosting | Vercel (+ Vercel Postgres / Neon) |
| Tooling | Bun (package manager + scripts), tsx, uv (dataset ETL) |

## Local development

**Prerequisites:** [Bun](https://bun.sh) and a local Postgres. This project uses Podman.

1. **Start a local Postgres** (Podman on macOS uses the `applehv` provider):

   ```bash
   CONTAINERS_MACHINE_PROVIDER=applehv podman machine init   # first time only
   CONTAINERS_MACHINE_PROVIDER=applehv podman machine start
   podman run -d --name gungeon-pg -e POSTGRES_PASSWORD=gungeon \
     -e POSTGRES_DB=gungeon -p 5433:5432 postgres:16
   ```

2. **Configure env** — copy `.env.example` to `.env.local` and fill it in:

   ```bash
   cp .env.example .env.local
   openssl rand -base64 32   # use for BETTER_AUTH_SECRET
   ```

3. **Install, migrate, run:**

   ```bash
   bun install
   bun run db:push     # create tables (auth, run state, rate limiting)
   bun run dev         # http://localhost:3000
   ```

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Dev server |
| `bun run build` / `bun run start` | Production build / serve |
| `bun run lint` | ESLint |
| `bun run db:push` | Push the Drizzle schema to the database |
| `bun run db:studio` | Drizzle Studio |
| `bunx tsx --test scripts/*.test.ts` | Unit tests (search + synergy engine) |

## Rate limiting

All API surfaces are rate limited, with counters stored in the Postgres
`rate_limit` table (in-memory counters would be per-instance and useless on
serverless):

- **Auth endpoints** use Better Auth's built-in limiter (per IP + path,
  429 + `X-Retry-After`). Passkey registration is strictest (3/min) since it
  creates user rows without a session; sign-in allows 10/min; everything else
  60/min. Configured in `src/lib/auth.ts`.
- **Run mutations** (`/api/run/items`, `/api/run/reset`) are limited per user
  (60/min and 10/min) via `src/lib/rate-limit.ts`, returning 429 +
  `Retry-After`.

> **Deploy note:** the `rate_limit` table is part of the Drizzle schema, so
> existing databases need a `bun run db:push` (or `drizzle-kit push` against
> prod) to create it — without it every auth request fails.

## Data pipeline

The dataset is bundled at `src/lib/data/dataset.json`. It is built by
`scripts/build-dataset.py` (run with `uv run scripts/build-dataset.py`) from the raw
datamined CSV/JSON in `scripts/raw/`. The app reads it directly (server and client);
the database stores only auth tables and per-run item ids. Rebuilding carries the
existing item icon URLs over (they come from `scripts/resolve-images.mjs`, which needs
network access), unescapes wiki HTML entities, and emits `groupMinimums` for synergy
groups that need more than one member at once (Chief Master: any two Master Rounds).

## How search works

Search (`src/lib/search.ts`) normalises text (folds accents, strips punctuation so
`A.W.P.` → `awp`) and scores every item across:

- **name** — exact / prefix / compact / **acronym** (`sr` → Sniper Rifle),
- **description** and **flavour quote**,
- **related synergy names** (searching `yes scope` surfaces the items that complete it),

with **subsequence + banded-Levenshtein** fallbacks for typos (`snipr` → Sniper Rifle).
Results are relevance-ranked. Single-character tokens are ignored in multi-word coverage so
`a.w.p` returns only A.W.P.

## Deploying to Vercel

1. Push this repo to GitHub and **Import** it in Vercel.
2. Provision a database — **Vercel Postgres** or Neon — and copy its pooled connection string.
3. Set the project **Environment Variables** (Production):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Postgres connection string (SSL auto-enabled for non-local hosts) |
   | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
   | `BETTER_AUTH_URL` | Deployed origin, e.g. `https://your-app.vercel.app` |
   | `NEXT_PUBLIC_APP_URL` | Same origin as above |

   > The passkey Relying Party ID is derived from `BETTER_AUTH_URL`'s hostname, so it
   > **must** match the domain you actually visit.

4. **Initialise the production database** once (with `DATABASE_URL` pointing at the prod DB):

   ```bash
   DATABASE_URL="<prod-url>" bunx drizzle-kit push --force
   ```

5. **Deploy.** Vercel auto-detects Next.js — no `vercel.json` needed.

## Testing

```bash
bunx tsx --test scripts/*.test.ts
```

- `scripts/search.test.ts` — punctuation, acronyms, typos, multi-word, quote/description/
  synergy matching, and ranking.
- `scripts/engine.test.ts` — synergy evaluation (active / one-away / potential, OR-groups,
  two-of, groups that need several members at once, activates-on-add).

---

Fan-made companion. Item & synergy data from the Enter the Gungeon community wiki.
Not affiliated with Dodge Roll or Devolver Digital.
