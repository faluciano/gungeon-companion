# Ammonomicon — Enter the Gungeon Run Companion

A web app that tracks the items and guns in your current **Enter the Gungeon** run and
tells you, as you search, which items **synergize** with what you already hold. Every item
has an accurate description, and synergies show whether they're **active** or **one item
away**.

- **Passkey-only auth** (WebAuthn) — no passwords.
- **Cloud-saved runs** in Postgres, per account.
- **Extremely robust search** — punctuation/accent-insensitive, acronym-aware,
  typo-tolerant, and it also matches descriptions, flavour quotes, and synergy names.
- Curated, datamined dataset of **501 items** and **394 synergies** bundled and seeded.

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

3. **Install, migrate, seed, run:**

   ```bash
   bun install
   bun run db:push     # create tables
   bun run db:seed     # load the 501-item / 394-synergy dataset
   bun run dev         # http://localhost:3000
   ```

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Dev server |
| `bun run build` / `bun run start` | Production build / serve |
| `bun run lint` | ESLint |
| `bun run db:push` | Push the Drizzle schema to the database |
| `bun run db:seed` | Seed the bundled dataset (idempotent) |
| `bun run db:studio` | Drizzle Studio |
| `bunx tsx --test scripts/*.test.ts` | Unit tests (search + synergy engine) |

## Data pipeline

The dataset is bundled at `src/lib/data/dataset.json`. It is built by
`scripts/build-dataset.py` (run with `uv run scripts/build-dataset.py`) from the raw
datamined CSV/JSON in `scripts/raw/`. `scripts/seed.ts` loads it into the DB.

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
   DATABASE_URL="<prod-url>" bunx tsx scripts/seed.ts
   ```

5. **Deploy.** Vercel auto-detects Next.js — no `vercel.json` needed.

## Testing

```bash
bunx tsx --test scripts/*.test.ts
```

- `scripts/search.test.ts` — punctuation, acronyms, typos, multi-word, quote/description/
  synergy matching, and ranking.
- `scripts/engine.test.ts` — synergy evaluation (active / one-away / potential, OR-groups,
  two-of, activates-on-add).

---

Fan-made companion. Item & synergy data from the Enter the Gungeon community wiki.
Not affiliated with Dodge Roll or Devolver Digital.
