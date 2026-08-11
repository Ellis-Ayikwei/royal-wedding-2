"use client";

import { useState } from "react";
import type { Venue } from "@/lib/types";
import { AdminButton, Field, Input, Textarea, useToast } from "./AdminUI";
import { ImageUploader } from "./ImageUploader";

export function VenueManager({ initialVenue }: { initialVenue: Venue }) {
  const { push } = useToast();
  const [form, setForm] = useState({
    name: initialVenue.name ?? "",
    ceremonyLocation: initialVenue.ceremonyLocation ?? "",
    receptionLocation: initialVenue.receptionLocation ?? "",
    address: initialVenue.address ?? "",
    latitude: initialVenue.latitude?.toString() ?? "",
    longitude: initialVenue.longitude?.toString() ?? "",
    mapsUrl: initialVenue.mapsUrl ?? "",
    image: initialVenue.image ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.name.trim()) return setError("Give the venue a name.");
    if (!form.address.trim()) return setError("Add an address so Get Directions works for guests.");
    const lat = form.latitude ? Number(form.latitude) : null;
    const lng = form.longitude ? Number(form.longitude) : null;
    if ((form.latitude && Number.isNaN(lat)) || (form.longitude && Number.isNaN(lng))) {
      return setError("Latitude and longitude must be numbers.");
    }
    setError(null);
    setSaving(true);
    const res = await fetch("/api/admin/venue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, latitude: lat, longitude: lng }),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) return push(data.error || "Could not save the venue.", "error");
    push("Venue saved");
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-ivory-50">Venue</h1>
        <p className="mt-1.5 text-sm text-ivory-100/50">
          Get Directions uses the custom maps link if set, otherwise the coordinates, otherwise the address.
        </p>
      </header>

      <div className="card-glass rounded-md p-6 max-w-xl space-y-5">
        <Field label="Venue name" htmlFor="v-name">
          <Input id="v-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Ceremony location" htmlFor="v-cer">
          <Input id="v-cer" value={form.ceremonyLocation} onChange={(e) => set("ceremonyLocation", e.target.value)} />
        </Field>
        <Field label="Reception location" htmlFor="v-rec">
          <Input id="v-rec" value={form.receptionLocation} onChange={(e) => set("receptionLocation", e.target.value)} />
        </Field>
        <Field label="Address" htmlFor="v-addr">
          <Textarea id="v-addr" rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude" htmlFor="v-lat">
            <Input id="v-lat" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="51.4839" />
          </Field>
          <Field label="Longitude" htmlFor="v-lng">
            <Input id="v-lng" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="-0.6045" />
          </Field>
        </div>
        <Field label="Custom Google Maps link" htmlFor="v-maps">
          <Input id="v-maps" value={form.mapsUrl} onChange={(e) => set("mapsUrl", e.target.value)} placeholder="Optional — overrides coordinates" />
        </Field>
        <ImageUploader label="Venue image" id="v-img" value={form.image} onChange={(url) => set("image", url)} />

        {error && <p className="text-xs text-rose-200">{error}</p>}

        <AdminButton onClick={save} disabled={saving}>{saving ? "Saving" : "Save venue"}</AdminButton>
      </div>
    </div>
  );
}
