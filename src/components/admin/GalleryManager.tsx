"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { GalleryImage } from "@/lib/types";
import { AdminButton, ConfirmDialog, EmptyState, Field, Input, Modal, Select, useToast } from "./AdminUI";
import { ImageField } from "./ImageField";

const SECTIONS = ["hero", "couple", "story", "events", "gallery", "venue"];

export function GalleryManager({ initialImages }: { initialImages: GalleryImage[] }) {
  const { push } = useToast();
  const [images, setImages] = useState(initialImages);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<GalleryImage | null>(null);

  async function add(form: { url: string; title: string; section: string }) {
    const res = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sortOrder: images.length }),
    });
    const data = await res.json();
    if (!res.ok) return push(data.error || "Could not add the image.", "error");
    setImages((is) => [...is, data.image]);
    push("Image added");
    setCreating(false);
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/admin/gallery/${deleting.id}`, { method: "DELETE" });
    if (!res.ok) return push("Could not delete the image.", "error");
    setImages((is) => is.filter((i) => i.id !== deleting.id));
    push("Image removed");
    setDeleting(null);
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ivory-50">Gallery</h1>
          <p className="mt-1.5 text-sm text-ivory-100/50">{images.length} images across the site</p>
        </div>
        <AdminButton onClick={() => setCreating(true)}><Plus size={14} /> Add image</AdminButton>
      </header>

      {images.length === 0 ? (
        <EmptyState title="No images yet" hint="Add photography by URL and assign it to a section of the site." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="group relative rounded-sm overflow-hidden border border-gold-400/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.title || ""} className="w-full h-40 object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-navy-950/85 px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] tracking-[0.15em] uppercase text-gold-300">{img.section}</span>
                <button onClick={() => setDeleting(img)} aria-label="Delete image" className="text-ivory-100/50 hover:text-rose-300">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <ImageForm onClose={() => setCreating(false)} onSave={add} />}

      {deleting && (
        <ConfirmDialog
          title="Delete image"
          body="This image will be removed from the site. This cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function ImageForm({ onClose, onSave }: { onClose: () => void; onSave: (f: { url: string; title: string; section: string }) => void }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("gallery");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!/^https?:\/\//.test(url.trim())) return setError("Enter an image URL starting with http:// or https://");
    setError(null);
    onSave({ url: url.trim(), title: title.trim(), section });
  }

  return (
    <Modal title="Add image" onClose={onClose}>
      <div className="space-y-4">
        <ImageField label="Image" id="i-url" value={url} onChange={setUrl} />
        <Field label="Caption" htmlFor="i-title">
          <Input id="i-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional" />
        </Field>
        <Field label="Section" htmlFor="i-section">
          <Select id="i-section" value={section} onChange={(e) => setSection(e.target.value)}>
            {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        {error && <p className="text-xs text-rose-200">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton onClick={submit}>Add image</AdminButton>
        </div>
      </div>
    </Modal>
  );
}
