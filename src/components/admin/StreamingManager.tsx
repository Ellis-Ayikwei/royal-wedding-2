"use client";

import { useState } from "react";
import type { StreamSettings, StreamPlatform } from "@/lib/types";
import { AdminButton, Field, Input, Select, useToast } from "./AdminUI";

const PLATFORMS: { value: StreamPlatform; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "zoom", label: "Zoom" },
  { value: "google_meet", label: "Google Meet" },
  { value: "discord", label: "Discord" },
  { value: "twitch", label: "Twitch" },
  { value: "custom", label: "Custom URL" },
];

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function StreamingManager({ initialSettings }: { initialSettings: StreamSettings }) {
  const { push } = useToast();
  const [platform, setPlatform] = useState<StreamPlatform>(initialSettings.platform);
  const [url, setUrl] = useState(initialSettings.url ?? "");
  const [title, setTitle] = useState(initialSettings.title ?? "");
  const [enabled, setEnabled] = useState(initialSettings.enabled === 1);
  const [startAt, setStartAt] = useState(toLocalInput(initialSettings.startAt));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (enabled && !/^https?:\/\//.test(url.trim())) {
      setError("Add a stream URL starting with http:// or https:// before enabling the stream.");
      return;
    }
    setError(null);
    setSaving(true);
    const res = await fetch("/api/admin/streaming", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform,
        url: url.trim(),
        title: title.trim(),
        enabled: enabled ? 1 : 0,
        startAt: startAt ? new Date(startAt).toISOString() : null,
      }),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) return push(data.error || "Could not save stream settings.", "error");
    push("Stream settings saved");
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-ivory-50">Live stream</h1>
        <p className="mt-1.5 text-sm text-ivory-100/50">
          The Watch Live section only appears on the site when the stream is enabled.
        </p>
      </header>

      <div className="card-glass rounded-md p-6 max-w-xl space-y-5">
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <div>
            <p className="text-sm text-ivory-50">Show the stream on the site</p>
            <p className="text-[11px] text-ivory-100/45 mt-0.5">Guests see the Join CTA when this is on</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(!enabled)}
            className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${enabled ? "bg-emerald-500" : "bg-navy-700"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-ivory-50 transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </label>

        <div className="rule-gold-solid" />

        <Field label="Platform" htmlFor="s-platform">
          <Select id="s-platform" value={platform} onChange={(e) => setPlatform(e.target.value as StreamPlatform)}>
            {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </Select>
        </Field>

        <Field label="Stream URL" htmlFor="s-url">
          <Input id="s-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/live/..." />
        </Field>

        <Field label="Stream title" htmlFor="s-title">
          <Input id="s-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Royal Ceremony — Live" />
        </Field>

        <Field label="Starts at" htmlFor="s-start">
          <Input id="s-start" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
        </Field>

        {error && <p className="text-xs text-rose-200">{error}</p>}

        <AdminButton onClick={save} disabled={saving}>{saving ? "Saving" : "Save stream settings"}</AdminButton>
      </div>
    </div>
  );
}
