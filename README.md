# WaterPure RO Services — Website + AI-Powered CRM

A complete, **zero-setup, runnable** implementation of the RO water service
provider platform designed in `RO-Water-CRM-Blueprint.pdf`:

- **Public website** — services, pricing, about, contact, booking form + chatbot
- **Customer portal** — OTP login, dashboard, bookings, invoices
- **Unified CRM** — one panel for AI cold-calling **and** online leads
  (Google/Meta ads, website, WhatsApp, missed calls, referrals)
- **AI telecalling** — every outbound call is dialed by an AI voice agent
  that asks prospects if they want a human for specifics, creating a hand-off
  ticket automatically
- **Team, campaigns, pipeline, analytics, import** — built in

---

## Quick start (this machine)

The project was installed and seeded already, so to run it:

```powershell
cd "C:\Users\Lenovo\Documents\Default Project"

# Start the dev server (Node is used for Next.js itself):
node node_modules/next/dist/bin/next dev -p 3000
```

Open **http://localhost:3000**

| Area | URL | Login |
|------|-----|-------|
| Public website | `/` | — |
| Staff login | `/login` | `owner@waterpure.example` / `owner123` |
| CRM dashboard | `/crm` (after login) | above |
| Customer portal | `/portal/login` | phone `+919876543210`, **any 6-digit OTP** (dev) |

More staff accounts: `manager@waterpure.example`/`manager123`,
`agent@waterpure.example`/`agent123`, `tech@waterpure.example`/`tech123`,
`accounts@waterpure.example`/`acc123`, `lead@waterpure.example`/`lead123`.

The seed data includes 7 users, 61 leads, 36 simulated AI calls, 7 human
hand-off tickets, and 7 converted customers with bookings/invoices.

---

## Architecture

```
prisma/               Database: 12 models (Lead, User, Call, Ticket, Campaign…)
  schema.prisma       SQLite locally; identical schema works on PostgreSQL
  seed.ts             61 leads + 36 simulated AI calls + customers/bookings
src/
  app/                Next.js App Router (site + /login + /crm/* + /portal/*)
  app/api/            Auth, leads CRUD/import, bookings, AI calls & campaigns,
                      tickets, portal OTP, Twilio webhooks, health
  components/         UI primitives, charts, site chrome, CRM panels, chatbot
  lib/                Prisma client, auth (JWT), enums, scoring, dedupe, DnD,
                      CSV parse, AI providers (Twilio + OpenAI), mock AI brain,
                      automation workflows, knowledge RAG-lite
scripts/              Helper scripts (registry proxy, install recipe)
```

### AI mode: `mock` (default) vs `live`

Everything runs locally with **no paid keys** out of the box:

- `AI_MODE=mock` (`.env`) — the AI call engine (`src/lib/ai/agent.ts`) simulates
  realistic calls: conversation, sentiment, intent detection, lead scoring,
  DND/skip handling, bot-vs-human decision, and automatic human hand-off.
- `AI_MODE=live` — the same flows drive **real** Twilio voice calls with
  OpenAI GPT-4o Realtime (`src/lib/ai/providers.ts`). Add `TWILIO_*`,
  `OPENAI_API_KEY` to `.env`. Webhook handlers at `/api/webhooks/twilio/*`
  receive call status + speech and write back to the same pipeline.

### Unified lead pipeline

Every channel funnels into one `Lead` table:

- AI cold calls → `Lead.source = COLD_UPLOAD`
- Website form / chatbot → `POST /api/public/lead` → `source = WEBSITE`
- Ad campaigns (Google/Meta) → campaign uploads → `source = GOOGLE_ADS` …
- Imported CSV files → `/api/leads/import` (PapaParse)

The AI agent scores each lead (0–100), assigns it to an agent, and — when a
prospect asks for specifics — opens a **hand-off ticket** plus an instant
WhatsApp/SMS summary. Humans take over exactly where nuance is needed.

---

## Switch to PostgreSQL (production)

`prisma/schema.prisma` uses only portable scalar types (enums are app-layer
Strings), so moving to Postgres is a two-line change:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```env
DATABASE_URL="postgresql://user:pass@host:5432/ro_crm?schema=public"
```

then re-run setup. The same schema + seed work unchanged.

---

## Installing from scratch on this machine

**Do not use `npm install` on this machine** — its local network corrupts npm's
long-lived TLS connections to `registry.npmjs.org`
(`ERR_SSL_CIPHER_OPERATION_FAILED`, aborting on multi-MB responses). The
reliable recipe used here is captured in **`scripts/install-with-bun.ps1`**:

1. Use **Bun** (BoringSSL) pointed at the **npmmirror** CDN
   (`bunfig.toml`) — every package downloads cleanly there.
2. Pre-staging Prisma engine binaries avoids the second flaky download from
   `binaries.prisma.sh` (the script caches `query_engine-windows.dll.node` +
   `schema-engine-windows.exe` under `%APPDATA%\Prisma\...` with `.sha256`).

Then:

```powershell
node node_modules/prisma/build/index.js db push   # create dev.db
node node_modules/tsx/dist/cli.mjs prisma/seed.ts # seed demo data
node node_modules/next/dist/bin/next dev -p 3000  # run
```

## Notes

- `.env` holds `AI_MODE`, keys, and `AUTH_SECRET`. All values are demo/dev-ready.
- `prisma/dev.db` is the SQLite database (generated — safe to delete + reseed).
- `stepcrm360/`, `STEPCRM360-Roadmap/`, `cafe-mvp.html` and the
  `RO-Water-CRM-Blueprint.*` files are pre-existing workspace content, left
  untouched.