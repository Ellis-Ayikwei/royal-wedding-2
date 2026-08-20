"use client";

import { useMemo, useState } from "react";
import { Download, Eye, EyeOff, Trash2 } from "lucide-react";
import type { EventPhoto, PhotoStatus } from "@/lib/types";
import { ConfirmDialog, EmptyState, Select, useToast } from "./AdminUI";

type Filter = "all" | PhotoStatus;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PhotosManager({
  initialPhotos,
  photosUrl,
  qrDataUrl,
}: {
  initialPhotos: EventPhoto[];
  photosUrl: string;
  qrDataUrl: string;
}) {
  const { push } = useToast();
  const [photos, setPhotos] = useState(initialPhotos);
  const [filter, setFilter] = useState<Filter>("all");
  const [deleting, setDeleting] = useState<EventPhoto | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? photos : photos.filter((p) => p.status === filter)),
    [photos, filter]
  );

  async function toggleStatus(photo: EventPhoto) {
    const status: PhotoStatus = photo.status === "visible" ? "hidden" : "visible";
    const res = await fetch(`/api/admin/photos/${photo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) return push(data.error || "Could not update the photo.", "error");
    setPhotos((ps) => ps.map((p) => (p.id === photo.id ? data.photo : p)));
    push(status === "visible" ? "Photo is visible on the wall" : "Photo hidden from the wall");
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/admin/photos/${deleting.id}`, { method: "DELETE" });
    if (!res.ok) return push("Could not delete the photo.", "error");
    setPhotos((ps) => ps.filter((p) => p.id !== deleting.id));
    push("Photo deleted");
    setDeleting(null);
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-ivory-50">Photo Wall</h1>
        <p className="mt-1.5 text-sm text-ivory-100/50">{photos.length} photos shared by guests</p>
      </header>

      <div className="card-glass rounded-md p-5 sm:p-6 mb-8 flex flex-col sm:flex-row items-center gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="QR code for the guest photo wall" className="h-32 w-32 rounded-sm border border-gold-400/25 bg-ivory-50" />
        <div className="flex-1 text-center sm:text-left">
          <p className="text-[11px] tracking-[0.15em] uppercase text-gold-300">Scan to join the wall</p>
          <p className="mt-1.5 text-sm text-ivory-100/60 break-all">{photosUrl}</p>
          <p className="mt-3 text-xs text-ivory-100/40">Print this code for the tables so guests can scan and share photos as they go.</p>
        </div>
        <a
          href={qrDataUrl}
          download="photo-wall-qr.png"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm text-[11px] font-medium tracking-[0.15em] uppercase border border-gold-400/30 text-gold-200 hover:bg-gold-300/10 transition-colors"
        >
          <Download size={14} /> Download
        </a>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <Select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} aria-label="Filter by status" className="w-auto min-w-[160px]">
          <option value="all">All photos</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={photos.length === 0 ? "No photos yet" : "No matching photos"}
          hint={
            photos.length === 0
              ? "Photos guests share from the QR code will show up here for moderation."
              : "Adjust the filter to find what you're looking for."
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((photo) => (
            <div key={photo.id} className="group relative rounded-sm overflow-hidden border border-gold-400/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {photo.mediaType === "video" ? (
                <video src={photo.url} muted playsInline preload="metadata" className={`w-full h-40 object-cover ${photo.status === "hidden" ? "opacity-40" : ""}`} />
              ) : (
                <img
                  src={photo.url}
                  alt={photo.caption || ""}
                  className={`w-full h-40 object-cover ${photo.status === "hidden" ? "opacity-40" : ""}`}
                />
              )}
              <div className="absolute inset-x-0 top-0 px-3 py-2 flex items-center justify-between bg-gradient-to-b from-navy-950/80 to-transparent">
                <span
                  className={`text-[10px] tracking-[0.12em] uppercase px-2 py-0.5 rounded-full border ${
                    photo.status === "visible"
                      ? "text-emerald-300 border-emerald-400/40"
                      : "text-ivory-100/50 border-ivory-100/25"
                  }`}
                >
                  {photo.status}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-navy-950/85 px-3 py-2">
                <p className="text-xs text-ivory-50 truncate">{photo.uploaderName || "A guest"}</p>
                <p className="text-[10px] text-ivory-100/40">{formatDate(photo.createdAt)}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <button
                    onClick={() => toggleStatus(photo)}
                    title={photo.status === "visible" ? "Hide from wall" : "Show on wall"}
                    aria-label={photo.status === "visible" ? "Hide from wall" : "Show on wall"}
                    className="p-1.5 text-ivory-100/60 hover:text-gold-300 rounded-sm"
                  >
                    {photo.status === "visible" ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => setDeleting(photo)}
                    title="Delete photo"
                    aria-label="Delete photo"
                    className="p-1.5 text-ivory-100/60 hover:text-rose-300 rounded-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete photo"
          body="This photo will be removed from the wall and storage. This cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
