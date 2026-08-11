import { createClient, type Client } from "@libsql/client";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { GALLERY_IMAGES } from "./gallery-manifest";

const LOCAL_DB_PATH = path.join(process.cwd(), "data", "wedding.db");

function ensureLocalDataDir() {
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

declare global {
  var __weddingDb: Client | undefined;
  var __weddingDbReady: Promise<void> | undefined;
}

/**
 * Serverless hosts (Vercel, Lambda) give the function a read-only filesystem, so the
 * local-file fallback cannot work there — it fails deep inside libSQL with a bare
 * "ENOENT: mkdir '/var/task/data'". Detect it up front and say what to actually do.
 */
function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function createConnection(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    // Production / any environment pointed at a real Turso database.
    return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  if (isServerless()) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. This deployment has a read-only filesystem, so the " +
        "local data/wedding.db fallback cannot be used. Create a database at https://turso.tech " +
        "and set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in the project's environment variables, " +
        "then redeploy. See the 'Deploying to Vercel' section of the README."
    );
  }
  // Local development: libSQL's embedded file mode needs no cloud credentials
  // and behaves like plain SQLite on disk.
  ensureLocalDataDir();
  return createClient({ url: `file:${LOCAL_DB_PATH}` });
}

async function migrate(db: Client) {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS guests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      invitationToken TEXT NOT NULL UNIQUE,
      rsvpStatus TEXT NOT NULL DEFAULT 'pending',
      guestCount INTEGER NOT NULL DEFAULT 1,
      dietaryRequirements TEXT,
      message TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      eventDate TEXT NOT NULL,
      startTime TEXT,
      endTime TEXT,
      location TEXT,
      image TEXT,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      isFeatured INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      available INTEGER NOT NULL DEFAULT 1,
      sortOrder INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS menu_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      visibilityMode TEXT NOT NULL DEFAULT 'hidden',
      releaseAt TEXT
    );

    CREATE TABLE IF NOT EXISTS gallery_images (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT,
      section TEXT NOT NULL DEFAULT 'gallery',
      sortOrder INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stream_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      platform TEXT NOT NULL DEFAULT 'youtube',
      url TEXT,
      title TEXT,
      enabled INTEGER NOT NULL DEFAULT 0,
      startAt TEXT
    );

    CREATE TABLE IF NOT EXISTS venue (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT,
      ceremonyLocation TEXT,
      receptionLocation TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      mapsUrl TEXT,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      coupleNames TEXT,
      weddingDate TEXT,
      heroImage TEXT,
      heroTagline TEXT,
      storyTitle TEXT,
      storyBody TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      adminId TEXT NOT NULL,
      expiresAt TEXT NOT NULL
    );
  `);
}

async function seed(db: Client) {
  const now = new Date().toISOString();

  const adminCount = (await db.execute("SELECT COUNT(*) as c FROM admin_users"))
    .rows[0].c as number;
  if (adminCount === 0) {
    const defaultEmail = process.env.ADMIN_EMAIL || "admin@royalwedding.gh";
    const defaultPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
    await db.execute({
      sql: "INSERT INTO admin_users (id, email, passwordHash) VALUES (?, ?, ?)",
      args: [nanoid(), defaultEmail, bcrypt.hashSync(defaultPassword, 10)],
    });
  }

  const settingsCount = (await db.execute("SELECT COUNT(*) as c FROM site_settings"))
    .rows[0].c as number;
  if (settingsCount === 0) {
    await db.execute({
      sql: `INSERT INTO site_settings (id, coupleNames, weddingDate, heroImage, heroTagline, storyTitle, storyBody)
            VALUES (1, ?, ?, ?, ?, ?, ?)`,
      args: [
        "Ellis & Monique",
        "2026-09-20T11:00:00.000Z",
        "/uploads/hero.webp",
        "Two families, one crown, one heart.",
        "Our Story",
        "They met in Accra and found the same warmth in one another from the very first evening. What began as long conversations and longer walks grew into a partnership built on shared purpose, laughter, and an unshakeable devotion to family and heritage. Now, surrounded by the people who shaped them, they begin their next chapter together at Pot of Gold, East Legon.",
      ],
    });
  }

  const menuSettingsCount = (await db.execute("SELECT COUNT(*) as c FROM menu_settings"))
    .rows[0].c as number;
  if (menuSettingsCount === 0) {
    await db.execute({
      sql: "INSERT INTO menu_settings (id, visibilityMode, releaseAt) VALUES (1, 'scheduled', ?)",
      args: [new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString()],
    });
  }

  const streamCount = (await db.execute("SELECT COUNT(*) as c FROM stream_settings"))
    .rows[0].c as number;
  if (streamCount === 0) {
    await db.execute({
      sql: "INSERT INTO stream_settings (id, platform, url, title, enabled, startAt) VALUES (1, 'youtube', '', 'The Royal Ceremony — Live', 0, ?)",
      args: [new Date(Date.now() + 1000 * 60 * 60 * 24 * 40).toISOString()],
    });
  }

  const venueCount = (await db.execute("SELECT COUNT(*) as c FROM venue")).rows[0]
    .c as number;
  if (venueCount === 0) {
    await db.execute({
      sql: `INSERT INTO venue (id, name, ceremonyLocation, receptionLocation, address, latitude, longitude, mapsUrl, image)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        "Pot of Gold Residence",
        "Pot of Gold Residence — Traditional Ceremony",
        "Pot of Gold Residence — White Wedding Ceremony",
        "Near Boundary Rd, East Legon, Accra",
        null,
        null,
        "",
        "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=2400&auto=format&fit=crop",
      ],
    });
  }

  const eventCount = (await db.execute("SELECT COUNT(*) as c FROM events")).rows[0]
    .c as number;
  if (eventCount === 0) {
    const items = [
      {
        title: "Ga Traditional Ceremony",
        description:
          "A vibrant Ga ceremony honoring both families — kente and beads, the presentation of drinks, libation poured to the ancestors, and the elders' blessing before the bride is given away.",
        eventDate: "2026-09-20",
        startTime: "11:00",
        endTime: "13:30",
        location: "Pot of Gold — Courtyard",
        image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=2000&auto=format&fit=crop",
        featured: 0,
      },
      {
        title: "White Wedding Ceremony",
        description: "The formal exchange of vows, in white, before family and friends.",
        eventDate: "2026-09-20",
        startTime: "15:00",
        endTime: "16:30",
        location: "Pot of Gold — Garden Lawn",
        image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2000&auto=format&fit=crop",
        featured: 1,
      },
      {
        title: "Champagne Reception",
        description: "An evening of celebration on the lawns as the sun sets over East Legon.",
        eventDate: "2026-09-20",
        startTime: "17:00",
        endTime: "19:00",
        location: "Pot of Gold — Terrace",
        image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=2000&auto=format&fit=crop",
        featured: 0,
      },
      {
        title: "Gala Dinner & Speeches",
        description: "A seated dinner beneath the stars, with toasts from family and closest friends.",
        eventDate: "2026-09-20",
        startTime: "19:30",
        endTime: "22:00",
        location: "Pot of Gold — Grand Hall",
        image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2000&auto=format&fit=crop",
        featured: 0,
      },
      {
        title: "First Dance & Celebration",
        description: "The dance floor opens — live band, highlife rhythms, and celebration until midnight.",
        eventDate: "2026-09-20",
        startTime: "22:00",
        endTime: "23:00",
        location: "Pot of Gold — Grand Hall",
        image: "https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=2000&auto=format&fit=crop",
        featured: 0,
      },
    ];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await db.execute({
        sql: `INSERT INTO events (id, title, description, eventDate, startTime, endTime, location, image, sortOrder, isFeatured, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          nanoid(),
          item.title,
          item.description,
          item.eventDate,
          item.startTime,
          item.endTime,
          item.location,
          item.image,
          i,
          item.featured,
          now,
          now,
        ],
      });
    }
  }

  const menuCount = (await db.execute("SELECT COUNT(*) as c FROM menu_items")).rows[0]
    .c as number;
  if (menuCount === 0) {
    const items: [string, string, string][] = [
      ["Starters", "Kelewele-spiced Prawn Skewers", "Charred spiced plantain and ginger-lime dressing"],
      ["Starters", "Roasted Beet & Goat Cheese", "Candied walnuts, watercress, aged balsamic"],
      ["Main Courses", "Jollof-crusted Beef Wellington", "Truffle jus, garden vegetables"],
      ["Main Courses", "Grilled Sea Bass", "Coconut-tomato broth, plantain purée"],
      ["Main Courses", "Garden Groundnut Stew (V)", "Slow-roasted vegetables, jasmine rice"],
      ["Desserts", "Gold Leaf Chocolate Torte", "Sea salt caramel, raspberry coulis"],
      ["Desserts", "Coconut Shito Sorbet", "A playful nod to home"],
      ["Drinks", "Estate Reserve Champagne", ""],
      ["Drinks", "Sobolo Royale", "Hibiscus, ginger, sparkling wine"],
    ];
    for (let i = 0; i < items.length; i++) {
      const [category, name, description] = items[i];
      await db.execute({
        sql: `INSERT INTO menu_items (id, category, name, description, available, sortOrder) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [nanoid(), category, name, description, 1, i],
      });
    }
  }

  const galleryCount = (await db.execute("SELECT COUNT(*) as c FROM gallery_images"))
    .rows[0].c as number;
  if (galleryCount === 0) {
    // The couple's photos live in public/uploads/gallery, listed in a generated
    // manifest rather than scanned at runtime — a serverless function's filesystem
    // does not reliably contain public/. Regenerate with `npm run gallery:manifest`.
    const images = GALLERY_IMAGES;
    for (let i = 0; i < images.length; i++) {
      await db.execute({
        sql: `INSERT INTO gallery_images (id, url, title, section, sortOrder, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [nanoid(), images[i], "", "gallery", i, now],
      });
    }
  }
}

export async function getDb(): Promise<Client> {
  if (!global.__weddingDb) {
    global.__weddingDb = createConnection();
  }
  if (!global.__weddingDbReady) {
    global.__weddingDbReady = (async () => {
      await migrate(global.__weddingDb!);
      await seed(global.__weddingDb!);
    })();
  }
  await global.__weddingDbReady;
  return global.__weddingDb;
}
