# The Royal Wedding — Ellis & Monique

A production-quality wedding website: a cinematic guest experience plus a full admin CMS.
Navy, emerald and gold; British royal typography meets subtle African pattern work.

## Stack

- **Next.js 16** (App Router, server components by default)
- **TypeScript** (strict)
- **Tailwind CSS v4** with a custom token system
- **SQLite / Turso** via `@libsql/client` with a typed async repository layer (`src/lib/repo.ts`)
- **Framer Motion** for scroll reveals, drawer and modal transitions
- **bcrypt** password hashing + server-side session cookies

> **Note on the ORM:** the brief suggested Prisma. Prisma downloads platform query-engine
> binaries at install time, which the build sandbox blocked (403 on `binaries.prisma.sh`).
> The data layer is a small typed repository over `@libsql/client` instead — same
> relational schema, same separation of concerns, no binary fetch. Swapping in Prisma
> later means reimplementing `src/lib/repo.ts` against the identical schema in
> `src/lib/db.ts`; nothing else imports the database.

## Deploying to Vercel

Vercel's serverless functions have a **read-only filesystem** (writable `/tmp` only,
wiped between invocations and not shared across instances), so the local database file
can't survive there:

- **Database → [Turso](https://turso.tech).** libSQL is wire-compatible with SQLite,
  so the schema and every query in `src/lib/repo.ts` are unchanged — only the
  connection target moves from a local file to a remote database. Create a database,
  then set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in the Vercel project's
  environment variables. Without them the app fails fast with a message saying so,
  rather than trying to write to a read-only disk.
- **Images** are plain URLs. Photos that ship with the site live in `public/uploads/`
  and are committed, so Vercel serves them as static assets — no storage service and
  no `BLOB_READ_WRITE_TOKEN` needed. Anything else can be any public image URL.

Neither variable is required locally — see `.env.example`. Without them the app runs
against a local libSQL file at `data/wedding.db`.

## Getting started

```bash
npm install
cp .env.example .env    # then change the admin password
npm run dev             # http://localhost:3000
```

The local database is created and seeded automatically on first request at
`data/wedding.db`. Set `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` to point this at a
real Turso database instead — the same migration and seed logic runs either way.

### Admin access

`/admin` → redirects to `/admin/login`

Credentials come from `.env` and seed the first administrator on first run:

```
ADMIN_EMAIL=admin@royalwedding.gh
ADMIN_PASSWORD=ChangeMe123!
```

Change these before deploying. Passwords are stored as bcrypt hashes; sessions are
httpOnly cookies with a 12-hour expiry.

## Routes

**Guest**
- `/` — hero, countdown, story, event timeline, menu, venue, live stream
- `/invite/[token]` — personalized invitation, addressed by name, with its own OG preview

**Admin** (all protected by the `(protected)` route group layout)
- `/admin/dashboard` — RSVP statistics, response rate, recent replies
- `/admin/guests` — CRUD, search, filter by status, copy/regenerate invitation links
- `/admin/events` — CRUD, reorder, mark the main ceremony
- `/admin/menu` — dishes by course + visibility control (hidden / scheduled / visible)
- `/admin/gallery` — add images by URL (the first supplies the story portrait; the
  public photo wall is currently hidden)
- `/admin/streaming` — platform, URL, title, start time, enable toggle
- `/admin/venue` — name, locations, address, coordinates, maps override

## Images

Every image field in the admin (gallery, events, venue) takes a URL, with a live
preview beside it. File uploading was removed on purpose: it needed Vercel Blob in
production and a writable disk locally, which is a lot of moving parts for a fixed
set of wedding photos.

The couple's photos live in `public/uploads/` and are committed to the repo, so they
deploy as ordinary static assets and are referenced by path — `/uploads/hero.webp`,
`/uploads/gallery/DSC_4912.webp`. `npm run gallery:manifest` regenerates
`src/lib/gallery-manifest.ts` (which the database seed reads) after adding or removing
files there. Any other public image URL works too.

## Notable behaviour

- **Invitation tokens** are 14-character `nanoid` values, never sequential IDs.
  Regenerating a token immediately invalidates the previous link (verified: old → 404).
- **Menu release** is server-evaluated on load and client-evaluated by a live countdown,
  so the menu reveals itself at the configured time without a refresh.
- **Get Directions** resolves in priority order: custom maps URL → coordinates → address.
  Nothing is hardcoded.
- **Stream CTA** adapts its label and icon to the configured platform and only renders
  when the stream is enabled.
- **RSVP is invitation-only and one-shot.** It is reachable only from a valid
  `/invite/[token]` link — the public site shows no RSVP button at all. The guest's name
  and party size come from the guest record rather than the form, and a second
  submission is refused with a 409. To let someone respond again, set their status back
  to "Awaiting response" in `/admin/guests`.

## Fonts

Fraunces (display), Inter (body) and Great Vibes (the script on the invitation) load from
Google Fonts via a stylesheet link rather than `next/font`. The build sandbox couldn't
reach `fonts.googleapis.com`, and `next/font` fetches at build time. To self-host instead,
download the families into `public/fonts` and switch to `next/font/local` in
`src/app/layout.tsx`.

## Verification

```bash
npx tsc --noEmit      # clean
npx eslint src        # clean
npm run build         # 27 routes
```

Flows tested end-to-end against a running server: admin login (reject + accept),
guest create/update/delete, token regeneration and old-link invalidation, invitation
page rendering and OG tags, RSVP accept, duplicate RSVP, invalid token, input validation,
event CRUD, menu release logic across all three modes, stream platform adaptation,
and Google Maps URL construction.
