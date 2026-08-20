import { getDb } from "./db";
import { nanoid } from "nanoid";
import type {
  Guest,
  WeddingEvent,
  MenuItem,
  MenuSettings,
  GalleryImage,
  StreamSettings,
  Venue,
  SiteSettings,
  RsvpStatus,
  EventPhoto,
  PhotoStatus,
} from "./types";

function now() {
  return new Date().toISOString();
}

// ---------- Site settings ----------
export async function getSiteSettings(): Promise<SiteSettings> {
  const db = await getDb();
  const res = await db.execute("SELECT * FROM site_settings WHERE id = 1");
  return res.rows[0] as unknown as SiteSettings;
}

// ---------- Guests ----------
export async function listGuests(): Promise<Guest[]> {
  const db = await getDb();
  const res = await db.execute("SELECT * FROM guests ORDER BY createdAt DESC");
  return res.rows as unknown as Guest[];
}

export async function getGuestByToken(token: string): Promise<Guest | undefined> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM guests WHERE invitationToken = ?",
    args: [token],
  });
  return res.rows[0] as unknown as Guest | undefined;
}

export async function getGuestById(id: string): Promise<Guest | undefined> {
  const db = await getDb();
  const res = await db.execute({ sql: "SELECT * FROM guests WHERE id = ?", args: [id] });
  return res.rows[0] as unknown as Guest | undefined;
}

export async function createGuest(input: {
  name: string;
  phone: string;
  guestCount?: number;
}): Promise<Guest> {
  const db = await getDb();
  const id = nanoid();
  const token = nanoid(14);
  const ts = now();
  await db.execute({
    sql: `INSERT INTO guests (id, name, phone, invitationToken, rsvpStatus, guestCount, dietaryRequirements, message, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, 'pending', ?, NULL, NULL, ?, ?)`,
    args: [id, input.name, input.phone, token, input.guestCount ?? 1, ts, ts],
  });
  return (await getGuestById(id)) as Guest;
}

// The admin can set rsvpStatus directly. Responses often arrive by phone, and the
// guest-facing RSVP is one-shot, so setting a guest back to 'pending' is also the way
// to let them respond through their link again.
export async function updateGuest(
  id: string,
  input: Partial<Pick<Guest, "name" | "phone" | "guestCount" | "rsvpStatus" | "message">>
): Promise<Guest | undefined> {
  const existing = await getGuestById(id);
  if (!existing) return undefined;
  const db = await getDb();
  await db.execute({
    sql: `UPDATE guests SET name = ?, phone = ?, guestCount = ?, rsvpStatus = ?, message = ?, updatedAt = ? WHERE id = ?`,
    args: [
      input.name ?? existing.name,
      input.phone ?? existing.phone,
      input.guestCount ?? existing.guestCount,
      input.rsvpStatus ?? existing.rsvpStatus,
      input.message ?? existing.message,
      now(),
      id,
    ],
  });
  return getGuestById(id);
}

export async function regenerateInvitationToken(id: string): Promise<Guest | undefined> {
  const db = await getDb();
  const token = nanoid(14);
  await db.execute({
    sql: `UPDATE guests SET invitationToken = ?, updatedAt = ? WHERE id = ?`,
    args: [token, now(), id],
  });
  return getGuestById(id);
}

export async function deleteGuest(id: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM guests WHERE id = ?", args: [id] });
}

// guestCount is set by the admin when the guest is invited and is deliberately not
// writable here. The guest confirms the party they were invited for, they don't choose it.
export async function submitRsvp(
  token: string,
  input: {
    attendance: RsvpStatus;
    phone?: string;
    message?: string;
  }
): Promise<Guest | undefined> {
  const guest = await getGuestByToken(token);
  if (!guest) return undefined;
  const db = await getDb();
  await db.execute({
    sql: `UPDATE guests SET rsvpStatus = ?, phone = ?, message = ?, updatedAt = ? WHERE invitationToken = ?`,
    args: [
      input.attendance,
      input.phone ?? guest.phone,
      input.message ?? guest.message,
      now(),
      token,
    ],
  });
  return getGuestByToken(token);
}

export async function guestStats() {
  const all = await listGuests();
  return {
    total: all.length,
    accepted: all.filter((g) => g.rsvpStatus === "accepted").length,
    pending: all.filter((g) => g.rsvpStatus === "pending").length,
    declined: all.filter((g) => g.rsvpStatus === "declined").length,
    totalGuestCount: all
      .filter((g) => g.rsvpStatus === "accepted")
      .reduce((sum, g) => sum + g.guestCount, 0),
    recent: all.slice(0, 6),
  };
}

// ---------- Events ----------
export async function listEvents(): Promise<WeddingEvent[]> {
  const db = await getDb();
  const res = await db.execute("SELECT * FROM events ORDER BY sortOrder ASC, eventDate ASC");
  return res.rows as unknown as WeddingEvent[];
}

export async function getEventById(id: string): Promise<WeddingEvent | undefined> {
  const db = await getDb();
  const res = await db.execute({ sql: "SELECT * FROM events WHERE id = ?", args: [id] });
  return res.rows[0] as unknown as WeddingEvent | undefined;
}

export async function createEvent(
  input: Omit<WeddingEvent, "id" | "createdAt" | "updatedAt">
): Promise<WeddingEvent> {
  const db = await getDb();
  const id = nanoid();
  const ts = now();
  await db.execute({
    sql: `INSERT INTO events (id, title, description, eventDate, startTime, endTime, location, image, sortOrder, isFeatured, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.title,
      input.description,
      input.eventDate,
      input.startTime,
      input.endTime,
      input.location,
      input.image,
      input.sortOrder,
      input.isFeatured,
      ts,
      ts,
    ],
  });
  return (await getEventById(id)) as WeddingEvent;
}

export async function updateEvent(
  id: string,
  input: Partial<Omit<WeddingEvent, "id">>
): Promise<WeddingEvent | undefined> {
  const existing = await getEventById(id);
  if (!existing) return undefined;
  const db = await getDb();
  const merged = { ...existing, ...input, updatedAt: now() };
  await db.execute({
    sql: `UPDATE events SET title=?, description=?, eventDate=?, startTime=?, endTime=?, location=?, image=?, sortOrder=?, isFeatured=?, updatedAt=? WHERE id=?`,
    args: [
      merged.title,
      merged.description,
      merged.eventDate,
      merged.startTime,
      merged.endTime,
      merged.location,
      merged.image,
      merged.sortOrder,
      merged.isFeatured,
      merged.updatedAt,
      id,
    ],
  });
  return getEventById(id);
}

export async function deleteEvent(id: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM events WHERE id = ?", args: [id] });
}

// ---------- Menu ----------
export async function listMenuItems(): Promise<MenuItem[]> {
  const db = await getDb();
  const res = await db.execute("SELECT * FROM menu_items ORDER BY category ASC, sortOrder ASC");
  return res.rows as unknown as MenuItem[];
}

async function getMenuItemById(id: string): Promise<MenuItem | undefined> {
  const db = await getDb();
  const res = await db.execute({ sql: "SELECT * FROM menu_items WHERE id = ?", args: [id] });
  return res.rows[0] as unknown as MenuItem | undefined;
}

export async function createMenuItem(input: Omit<MenuItem, "id">): Promise<MenuItem> {
  const db = await getDb();
  const id = nanoid();
  await db.execute({
    sql: `INSERT INTO menu_items (id, category, name, description, available, sortOrder) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, input.category, input.name, input.description, input.available, input.sortOrder],
  });
  return (await getMenuItemById(id)) as MenuItem;
}

export async function updateMenuItem(
  id: string,
  input: Partial<Omit<MenuItem, "id">>
): Promise<MenuItem | undefined> {
  const existing = await getMenuItemById(id);
  if (!existing) return undefined;
  const db = await getDb();
  const merged = { ...existing, ...input };
  await db.execute({
    sql: `UPDATE menu_items SET category=?, name=?, description=?, available=?, sortOrder=? WHERE id=?`,
    args: [merged.category, merged.name, merged.description, merged.available, merged.sortOrder, id],
  });
  return getMenuItemById(id);
}

export async function deleteMenuItem(id: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM menu_items WHERE id = ?", args: [id] });
}

export async function getMenuSettings(): Promise<MenuSettings> {
  const db = await getDb();
  const res = await db.execute("SELECT * FROM menu_settings WHERE id = 1");
  return res.rows[0] as unknown as MenuSettings;
}

export async function updateMenuSettings(
  input: Partial<Omit<MenuSettings, "id">>
): Promise<MenuSettings> {
  const existing = await getMenuSettings();
  const merged = { ...existing, ...input };
  const db = await getDb();
  await db.execute({
    sql: "UPDATE menu_settings SET visibilityMode = ?, releaseAt = ? WHERE id = 1",
    args: [merged.visibilityMode, merged.releaseAt],
  });
  return getMenuSettings();
}

export function isMenuVisible(settings: MenuSettings): boolean {
  if (settings.visibilityMode === "visible") return true;
  if (settings.visibilityMode === "hidden") return false;
  if (settings.visibilityMode === "scheduled" && settings.releaseAt) {
    return new Date(settings.releaseAt).getTime() <= Date.now();
  }
  return false;
}

// ---------- Gallery ----------
export async function listGalleryImages(): Promise<GalleryImage[]> {
  const db = await getDb();
  const res = await db.execute("SELECT * FROM gallery_images ORDER BY sortOrder ASC");
  return res.rows as unknown as GalleryImage[];
}

export async function createGalleryImage(
  input: Omit<GalleryImage, "id" | "createdAt">
): Promise<GalleryImage> {
  const db = await getDb();
  const id = nanoid();
  const ts = now();
  await db.execute({
    sql: `INSERT INTO gallery_images (id, url, title, section, sortOrder, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, input.url, input.title, input.section, input.sortOrder, ts],
  });
  const res = await db.execute({ sql: "SELECT * FROM gallery_images WHERE id = ?", args: [id] });
  return res.rows[0] as unknown as GalleryImage;
}

export async function deleteGalleryImage(id: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM gallery_images WHERE id = ?", args: [id] });
}

// ---------- Stream ----------
export async function getStreamSettings(): Promise<StreamSettings> {
  const db = await getDb();
  const res = await db.execute("SELECT * FROM stream_settings WHERE id = 1");
  return res.rows[0] as unknown as StreamSettings;
}

export async function updateStreamSettings(
  input: Partial<Omit<StreamSettings, "id">>
): Promise<StreamSettings> {
  const existing = await getStreamSettings();
  const merged = { ...existing, ...input };
  const db = await getDb();
  await db.execute({
    sql: "UPDATE stream_settings SET platform=?, url=?, title=?, enabled=?, startAt=? WHERE id=1",
    args: [merged.platform, merged.url, merged.title, merged.enabled, merged.startAt],
  });
  return getStreamSettings();
}

// ---------- Venue ----------
export async function getVenue(): Promise<Venue> {
  const db = await getDb();
  const res = await db.execute("SELECT * FROM venue WHERE id = 1");
  return res.rows[0] as unknown as Venue;
}

export async function updateVenue(input: Partial<Omit<Venue, "id">>): Promise<Venue> {
  const existing = await getVenue();
  const merged = { ...existing, ...input };
  const db = await getDb();
  await db.execute({
    sql: `UPDATE venue SET name=?, ceremonyLocation=?, receptionLocation=?, address=?, latitude=?, longitude=?, mapsUrl=?, image=? WHERE id=1`,
    args: [
      merged.name,
      merged.ceremonyLocation,
      merged.receptionLocation,
      merged.address,
      merged.latitude,
      merged.longitude,
      merged.mapsUrl,
      merged.image,
    ],
  });
  return getVenue();
}

// ---------- Guest photo wall ----------
export async function listPublicPhotos(): Promise<EventPhoto[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM event_photos WHERE status = 'visible' ORDER BY createdAt DESC",
    args: [],
  });
  return res.rows as unknown as EventPhoto[];
}

export async function listAllPhotos(): Promise<EventPhoto[]> {
  const db = await getDb();
  const res = await db.execute("SELECT * FROM event_photos ORDER BY createdAt DESC");
  return res.rows as unknown as EventPhoto[];
}

export async function getEventPhotoById(id: string): Promise<EventPhoto | undefined> {
  const db = await getDb();
  const res = await db.execute({ sql: "SELECT * FROM event_photos WHERE id = ?", args: [id] });
  return res.rows[0] as unknown as EventPhoto | undefined;
}

export async function createEventPhoto(input: {
  url: string;
  mediaType?: "image" | "video";
  uploaderName?: string | null;
  caption?: string | null;
}): Promise<EventPhoto> {
  const db = await getDb();
  const id = nanoid();
  const ts = now();
  await db.execute({
    sql: `INSERT INTO event_photos (id, url, mediaType, uploaderName, caption, status, createdAt) VALUES (?, ?, ?, ?, ?, 'visible', ?)`,
    args: [id, input.url, input.mediaType || "image", input.uploaderName || null, input.caption || null, ts],
  });
  return (await getEventPhotoById(id)) as EventPhoto;
}

export async function updatePhotoStatus(id: string, status: PhotoStatus): Promise<EventPhoto | undefined> {
  const db = await getDb();
  await db.execute({ sql: "UPDATE event_photos SET status = ? WHERE id = ?", args: [status, id] });
  return getEventPhotoById(id);
}

export async function deleteEventPhoto(id: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM event_photos WHERE id = ?", args: [id] });
}

export function buildMapsUrl(venue: Venue): string {
  if (venue.mapsUrl) return venue.mapsUrl;
  if (venue.latitude != null && venue.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`;
  }
  if (venue.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`;
  }
  return "https://www.google.com/maps";
}
