# The Royal Wedding — Ellis & Monique

A production-quality wedding website: a cinematic guest experience plus a full admin CMS.
Navy, emerald and gold; British royal typography meets subtle African pattern work.

## Stack

- **Next.js 16** (App Router, server components by default)
- **TypeScript** (strict)
- **Tailwind CSS v4** with a custom token system
- **SQLite / Turso** via `@libsql/client` with a typed async repository layer (`src/lib/repo.ts`)
- **Cloudflare R2** for image uploads (S3-compatible, presigned direct-to-bucket uploads), with a local-disk fallback for development
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
wiped between invocations and not shared across instances). A database file and a
local uploads folder can't survive that, so both are backed by services built for it:

- **Database → [Turso](https://turso.tech).** libSQL is wire-compatible with SQLite,
  so the schema and every query in `src/lib/repo.ts` are unchanged — only the
  connection target moves from a local file to a remote database. Create a database,
  then set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in the Vercel project's
  environment variables.
- **Uploads → Vercel Blob.** Attach a Blob store to the project from the Storage tab;
  Vercel injects `BLOB_READ_WRITE_TOKEN` automatically, and `/api/admin/upload`
  detects it and switches from local disk to Blob with no other change needed.

Neither variable is required locally — see `.env.example`. Without them, the app runs
against a local libSQL file at `data/wedding.db` and writes uploads to
`public/uploads/`, exactly as it did before this migration. Set them only in the
Vercel project (or wherever the filesystem is ephemeral) and nothing else changes.

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
- `/` — hero, countdown, story, event timeline, menu, gallery, venue, live stream
- `/invite/[token]` — personalized invitation, addressed by name, with its own OG preview

**Admin** (all protected by the `(protected)` route group layout)
- `/admin/dashboard` — RSVP statistics, response rate, recent replies
- `/admin/guests` — CRUD, search, filter by status, copy/regenerate invitation links
- `/admin/events` — CRUD, reorder, mark the main ceremony
- `/admin/menu` — dishes by course + visibility control (hidden / scheduled / visible)
- `/admin/gallery` — add images by URL and assign them to a section
- `/admin/streaming` — platform, URL, title, start time, enable toggle
- `/admin/venue` — name, locations, address, coordinates, maps override

## Image uploads

Every image field in the admin (gallery, events, venue) has two modes: paste a link,
or upload a file straight from the device. Uploads go through `POST /api/admin/upload`
(admin-authenticated, 8MB limit, JPG/PNG/WEBP/GIF/SVG only), which stores the file and
returns a URL — that URL lands in the same `url` column a pasted link would use, so the
rest of the app doesn't know or care which mode was used.

Where the file actually goes depends on environment, automatically:
- **`BLOB_READ_WRITE_TOKEN` set** (Vercel with a Blob store attached) → uploads to
  Vercel Blob, returns the Blob URL.
- **Not set** (local development) → writes to `public/uploads/` on disk, exactly as
  before.

No code change is needed to move between the two — see "Deploying to Vercel" above.

## Notable behaviour

- **Invitation tokens** are 14-character `nanoid` values, never sequential IDs.
  Regenerating a token immediately invalidates the previous link (verified: old → 404).
- **Menu release** is server-evaluated on load and client-evaluated by a live countdown,
  so the menu reveals itself at the configured time without a refresh.
- **Get Directions** resolves in priority order: custom maps URL → coordinates → address.
  Nothing is hardcoded.
- **Stream CTA** adapts its label and icon to the configured platform and only renders
  when the stream is enabled.
- **RSVP** works both from a personal invitation link and cold from the site; a repeat
  submission updates the response and reports `alreadyRegistered`.

## Fonts

Fraunces (display) and Inter (body) load from Google Fonts via a stylesheet link rather
than `next/font`. The build sandbox couldn't reach `fonts.googleapis.com`, and `next/font`
fetches at build time. To self-host instead, download both families into `public/fonts`
and switch to `next/font/local` in `src/app/layout.tsx`.

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
Google Maps URL construction, and file upload (local-disk path — the Blob path can't be
tested without a real Vercel Blob token, but it's a straightforward call to the
documented `put()` API).
