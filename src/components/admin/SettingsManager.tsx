"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { AdminButton, Field, Input, Textarea, useToast } from "./AdminUI";
import { ImageUploader } from "./ImageUploader";

/** "2026-09-20T11:00:00.000Z" to the "2026-09-20T11:00" a datetime-local input wants. */
function toInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SettingsManager({ initialSettings }: { initialSettings: SiteSettings }) {
  const { push } = useToast();
  const [form, setForm] = useState({
    coupleNames: initialSettings.coupleNames ?? "",
    weddingDate: toInputValue(initialSettings.weddingDate),
    heroImage: initialSettings.heroImage ?? "",
    heroTagline: initialSettings.heroTagline ?? "",
    storyTitle: initialSettings.storyTitle ?? "",
    storyBody: initialSettings.storyBody ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.coupleNames.trim()) return setError("Add the couple's names.");
    if (!form.coupleNames.includes("&")) {
      return setError("Separate the two names with an ampersand, for example Ellis & Monique.");
    }
    const date = form.weddingDate ? new Date(form.weddingDate) : null;
    if (form.weddingDate && Number.isNaN(date?.getTime())) {
      return setError("That wedding date is not valid.");
    }
    setError(null);
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, weddingDate: date ? date.toISOString() : null }),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) return push(data.error || "Could not save the site details.", "error");
    push("Site details saved");
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-ivory-50">Site details</h1>
        <p className="mt-1.5 text-sm text-ivory-100/50">
          The hero image, couple names, date and story shown on the home page and the invitations.
        </p>
      </header>

      <div className="card-glass rounded-md p-6 max-w-xl space-y-5">
        <ImageUploader
          label="Hero image"
          id="s-hero"
          value={form.heroImage}
          onChange={(url) => set("heroImage", url)}
        />
        <p className="-mt-2 text-[11px] leading-relaxed text-ivory-100/45">
          Sits full width behind the names on the home page, and behind the invitation preview
          when a link is shared. A wide landscape photo works best.
        </p>

        <Field label="Couple names" htmlFor="s-names">
          <Input
            id="s-names"
            value={form.coupleNames}
            onChange={(e) => set("coupleNames", e.target.value)}
            placeholder="Ellis & Monique"
          />
        </Field>

        <Field label="Wedding date and start time" htmlFor="s-date">
          <Input
            id="s-date"
            type="datetime-local"
            value={form.weddingDate}
            onChange={(e) => set("weddingDate", e.target.value)}
          />
        </Field>

        <Field label="Tagline" htmlFor="s-tagline">
          <Input
            id="s-tagline"
            value={form.heroTagline}
            onChange={(e) => set("heroTagline", e.target.value)}
            placeholder="Two families, one crown, one heart."
          />
        </Field>

        <Field label="Story heading" htmlFor="s-story-title">
          <Input id="s-story-title" value={form.storyTitle} onChange={(e) => set("storyTitle", e.target.value)} />
        </Field>

        <Field label="Story" htmlFor="s-story-body">
          <Textarea
            id="s-story-body"
            rows={6}
            value={form.storyBody}
            onChange={(e) => set("storyBody", e.target.value)}
          />
        </Field>

        {error && <p className="text-xs text-rose-200">{error}</p>}

        <AdminButton onClick={save} disabled={saving}>
          {saving ? "Saving" : "Save site details"}
        </AdminButton>
      </div>
    </div>
  );
}
