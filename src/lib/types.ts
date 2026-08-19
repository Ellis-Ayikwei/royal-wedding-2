export type RsvpStatus = "pending" | "accepted" | "declined";

export interface Guest {
  id: string;
  name: string;
  phone: string;
  invitationToken: string;
  rsvpStatus: RsvpStatus;
  guestCount: number;
  dietaryRequirements: string | null;
  message: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeddingEvent {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  image: string | null;
  sortOrder: number;
  isFeatured: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  category: string;
  name: string;
  description: string | null;
  available: number;
  sortOrder: number;
}

export type MenuVisibilityMode = "hidden" | "visible" | "scheduled";

export interface MenuSettings {
  id: number;
  visibilityMode: MenuVisibilityMode;
  releaseAt: string | null;
}

export interface GalleryImage {
  id: string;
  url: string;
  title: string | null;
  section: string;
  sortOrder: number;
  createdAt: string;
}

export type StreamPlatform = "youtube" | "zoom" | "google_meet" | "discord" | "twitch" | "custom";

export interface StreamSettings {
  id: number;
  platform: StreamPlatform;
  url: string | null;
  title: string | null;
  enabled: number;
  startAt: string | null;
}

export interface Venue {
  id: number;
  name: string | null;
  ceremonyLocation: string | null;
  receptionLocation: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  mapsUrl: string | null;
  image: string | null;
}

export interface SiteSettings {
  id: number;
  coupleNames: string | null;
  weddingDate: string | null;
  heroImage: string | null;
  heroTagline: string | null;
  storyTitle: string | null;
  storyBody: string | null;
}

export type PhotoStatus = "visible" | "hidden";

export interface EventPhoto {
  id: string;
  url: string;
  uploaderName: string | null;
  caption: string | null;
  status: PhotoStatus;
  createdAt: string;
}
