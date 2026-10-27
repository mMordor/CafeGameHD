# GameZone: gaming lounge website (Next.js 14)

Persian / RTL site for a gaming lounge: interactive PC showcase, live seat reservation, About page,
café menu and a protected staff dashboard.

| Route | What it is |
| --- | --- |
| `/` | 3D-style hero, Standard / Pro selector, specs panel, reservation flow |
| `/about` | Editorial About page with a curved card carousel |
| `/cafe` | Café menu (cold drinks, hot drinks, food) |
| `/admin/login`, `/admin` | Staff login and reservation dashboard |
| `/api/reservations` | Public availability (GET) and online booking (POST) |
| `/api/admin/*` | Staff-only API (session required on every call) |

Stack: Next.js 14 App Router, React 18, TypeScript, plain CSS, GSAP, optional `@google/model-viewer`.
No Tailwind or extra animation/icon libraries.

## Quick start

Requires **Node.js 22.18+** (the app itself runs on any Node 18+ that Next 14 supports; the `test` and
`migrate` scripts use Node's built-in TypeScript support).

```bash
npm install
cp .env.example .env.local      # then edit it
npm run dev                     # http://localhost:3000
```

Development logins when no accounts are configured: `admin / admin123` and `manager / manager123`
(disabled when `NODE_ENV=production`).

## Where to edit things

| What | File |
| --- | --- |
| Tiers, prices, capacities, specs, themes, opening hours, timezone | `lib/config.ts` (+ `NEXT_PUBLIC_*` env vars) |
| Café menu | `lib/menu.ts` (prices are integer toman; descriptions are optional) |
| Address / phone / Instagram / map | `lib/siteContent.ts` (empty fields are hidden) |
| Pricing formula | `lib/pricing.ts` (used by browser and server) |
| Allowed status changes | `lib/domain/status.ts` |

**Placeholders to confirm with the owner:** business timezone (default `Asia/Tehran`), bookable hours
(10:00 to 24:00), maximum booking length (5 h), and the online booking window (14 days) are defaults,
not verified business rules. Bookings cannot cross midnight.

## Reservation rules (enforced on the server)

- Price = hourly price x number of seats x hours (Standard 130,000, Pro 140,000 toman). The server
  recomputes it; a stale or tampered client total is rejected, never stored. Price and total are saved
  with each booking, so later price changes do not alter old reservations.
- Capacity: Standard 4, Pro 6. A booking may include several seats.
- A seat cannot overlap another active booking. `cancelled`, `no_show` and `completed` release seats.
- Past dates/hours are rejected using the **business timezone**, not the visitor's or server's clock.
- Each booking gets a 4-digit serial (`0000` to `9999`), unique among bookings that are `confirmed` or
  `checked_in` and have not ended. It is freed when the booking is cancelled/finished or its end time
  passes. If all 10,000 are active the booking is refused with HTTP 503; a duplicate is never issued.
  The serial identifies a booking for staff; it grants no access to anything.
- Status changes follow a fixed map (`confirmed -> checked_in -> completed`, etc.).
- Abuse controls: honeypot field, max 3 active online bookings per phone, per-IP and global rate
  limits, `Idempotency-Key` to absorb double submits, same-origin check, JSON-only bodies.

## Staff accounts and security

Roles: **manager** (view, add phone reservations, edit, change status) and **admin** (also permanent delete).

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # AUTH_SECRET
npm run hash-password -- "a long passphrase"                               # ADMIN_PASSWORD_HASH
```

Set `AUTH_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` (or `ADMIN_PASSWORD`), and the `MANAGER_*`
equivalents in the environment. Never commit them. In production the app refuses to sign sessions
without `AUTH_SECRET`.

- Sessions: signed, HttpOnly, SameSite=Lax cookies (`__Host-` prefix + Secure in production), 12 h.
  Changing a password or rotating `AUTH_SECRET` invalidates existing sessions.
- Every `/api/admin/*` handler and the `/admin` page check the session on the server.
- Login lockout is per **username** (8 failures / 15 min) plus per IP when `TRUST_PROXY=true`, so it
  works even if client IP headers are spoofed. Trade-off: someone can lock a known username out for
  15 minutes. Limits are in memory (per server instance).
- `X-Forwarded-For` is ignored unless `TRUST_PROXY=true`; only enable that behind a proxy you control.
- Responses for staff pages/APIs are `no-store`. Security headers are set in `next.config.js`.
  There is no Content-Security-Policy yet (Next inline scripts need a nonce setup).
- Logs never include passwords, tokens, names or phone numbers.

## Storage (read before deploying)

**Backend in this build: local JSON file store (`data/reservations.json`).**

- Safe for development and for **one server with a persistent disk**: atomic writes, rolling backup
  (`data/backups/latest.bak.json`), cross-process file lock, corrupt/empty/unknown files are an error
  (never treated as an empty database).
- **Not suitable** for Vercel/serverless (read-only or ephemeral disk) or several machines.
- In production it is refused unless you set `ALLOW_FILE_STORAGE=true`, so it cannot be used by accident.
- **PostgreSQL (Supabase / Neon) is NOT implemented in this build.** `db/schema.sql` documents the design
  (per-seat exclusion constraint for overlap safety, unique active serial). It has never been run.
  If `DATABASE_URL` is set the reservation service refuses to start instead of silently using files.
  To go multi-instance/serverless you need to write a `ReservationStore` adapter for PostgreSQL
  (`lib/storage/types.ts` is the interface; `lib/storage/file.ts` is the reference) and test it against
  a real database.

### Migration and backups

Older data (`seat: number`, bare array) is converted automatically on first access, or explicitly:

```bash
npm run migrate        # safe to repeat
```

It backs up the original bytes to `data/backups/reservations.pre-migration-<timestamp>.json` first,
converts `seat` to `seats: [seat]`, adds missing fields, assigns serials, and moves malformed or
duplicate-id records to `data/quarantine.json` (nothing is silently dropped). Legacy bookings had no
stored price, so they are priced at the current rate and flagged `pricingEstimated`.
Back up `data/` regularly (it contains customers' names and phone numbers).

## 3D model

No model asset is bundled or license-verified, so the built-in SVG PC case illustration is shown.
See `public/models/README.md` to plug in a `.glb` via `NEXT_PUBLIC_PC_MODEL_URL`.

## Tests and checks

```bash
npm test               # 73 tests: domain logic, storage, migration, concurrency, auth, API handlers
npm run check:imports  # every relative / "@/" import resolves
npm run typecheck      # tsc (needs `npm install`)
npm run build          # production build (needs network for Google Fonts)
```

The tests call the real route handlers with `Request` objects and run the file store, including a
race between 6 separate Node processes. They do not render React components, drive a browser, or use
a database.

## Deployment checklist

1. Node 22 LTS server with a **persistent disk**, HTTPS, and a process manager.
2. Set env: `AUTH_SECRET`, admin/manager credentials, `ALLOW_FILE_STORAGE=true`, `DATA_DIR` (on the
   persistent disk), `NEXT_PUBLIC_BUSINESS_TIMEZONE` and hours. `TRUST_PROXY=true` only behind your proxy.
3. `npm ci && npm run build && npm start` (`COOKIE_SECURE=false` only to test over plain http).
4. Back up `DATA_DIR`. Change all default passwords. Fill in `lib/siteContent.ts`.

## Known limitations

- Single-server storage (see above); no PostgreSQL adapter yet.
- No SMS/OTP verification: anyone can book with any phone number (mitigated by per-phone and rate limits).
- Rate limits and idempotency cache are per process.
- Staff accounts come from environment variables (two shared logins); no per-person accounts or audit log.
- About page uses illustrations, not venue photos; contact details are empty until filled in.
- Jalali dates come from the platform's ICU data (Intl); the date picker offers the next 14 days.
