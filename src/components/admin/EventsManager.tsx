"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Star } from "lucide-react";
import type { WeddingEvent } from "@/lib/types";
import { AdminButton, ConfirmDialog, EmptyState, Field, Input, Modal, Textarea, useToast } from "./AdminUI";
import { ImageUploader } from "./ImageUploader";

export function EventsManager({ initialEvents }: { initialEvents: WeddingEvent[] }) {
  const { push } = useToast();
  const [events, setEvents] = useState(initialEvents);
  const [editing, setEditing] = useState<WeddingEvent | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<WeddingEvent | null>(null);

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      push(data.error || "Could not update the event.", "error");
      return null;
    }
    return data.event as WeddingEvent;
  }

  async function save(form: Partial<WeddingEvent>, existing: WeddingEvent | null) {
    const res = await fetch(existing ? `/api/admin/events/${existing.id}` : "/api/admin/events", {
      method: existing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(existing ? form : { ...form, sortOrder: events.length }),
    });
    const data = await res.json();
    if (!res.ok) return push(data.error || "Could not save the event.", "error");
    setEvents((es) => (existing ? es.map((e) => (e.id === data.event.id ? data.event : e)) : [...es, data.event]));
    push(existing ? "Event updated" : "Event added");
    setEditing(null);
    setCreating(false);
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= events.length) return;
    const reordered = [...events];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setEvents(reordered);
    await Promise.all(reordered.map((e, i) => patch(e.id, { sortOrder: i })));
    push("Event order updated");
  }

  async function toggleFeatured(event: WeddingEvent) {
    const updated = await patch(event.id, { isFeatured: event.isFeatured === 1 ? 0 : 1 });
    if (updated) {
      setEvents((es) => es.map((e) => (e.id === updated.id ? updated : e)));
      push(updated.isFeatured === 1 ? "Marked as the main ceremony" : "Removed the main ceremony marker");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/admin/events/${deleting.id}`, { method: "DELETE" });
    if (!res.ok) return push("Could not delete the event.", "error");
    setEvents((es) => es.filter((e) => e.id !== deleting.id));
    push(`"${deleting.title}" removed from the lineup`);
    setDeleting(null);
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ivory-50">Event lineup</h1>
          <p className="mt-1.5 text-sm text-ivory-100/50">{events.length} events in the programme</p>
        </div>
        <AdminButton onClick={() => setCreating(true)}><Plus size={14} /> Add event</AdminButton>
      </header>

      {events.length === 0 ? (
        <EmptyState title="No events yet" hint="Add the ceremony, reception, and anything else guests should know about." />
      ) : (
        <ul className="space-y-3">
          {events.map((event, i) => (
            <li key={event.id} className="card-glass rounded-md p-4 flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move event up" className="p-1 text-ivory-100/40 hover:text-gold-300 disabled:opacity-25">
                  <ArrowUp size={14} />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === events.length - 1} aria-label="Move event down" className="p-1 text-ivory-100/40 hover:text-gold-300 disabled:opacity-25">
                  <ArrowDown size={14} />
                </button>
              </div>

              {event.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.image} alt="" className="h-14 w-20 object-cover rounded-sm border border-gold-400/20 hidden sm:block" />
              )}

              <div className="flex-1 min-w-[180px]">
                <p className="text-ivory-50 text-sm font-medium flex items-center gap-2">
                  {event.title}
                  {event.isFeatured === 1 && <Star size={12} className="text-gold-300 fill-gold-300" />}
                </p>
                <p className="text-[11px] text-ivory-100/45 mt-0.5">
                  {event.eventDate}{event.startTime ? ` · ${event.startTime}` : ""}{event.location ? ` · ${event.location}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <button onClick={() => toggleFeatured(event)} aria-label="Toggle main ceremony" title="Mark as main ceremony" className="p-2 text-ivory-100/50 hover:text-gold-300">
                  <Star size={15} />
                </button>
                <button onClick={() => setEditing(event)} aria-label={`Edit ${event.title}`} className="p-2 text-ivory-100/50 hover:text-gold-300">
                  <Pencil size={15} />
                </button>
                <button onClick={() => setDeleting(event)} aria-label={`Delete ${event.title}`} className="p-2 text-ivory-100/50 hover:text-rose-300">
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(creating || editing) && (
        <EventForm event={editing} onClose={() => { setCreating(false); setEditing(null); }} onSave={(f) => save(f, editing)} />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete event"
          body={`"${deleting.title}" will be removed from the programme guests see. This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function EventForm({ event, onClose, onSave }: { event: WeddingEvent | null; onClose: () => void; onSave: (f: Partial<WeddingEvent>) => void }) {
  const [form, setForm] = useState({
    title: event?.title ?? "",
    description: event?.description ?? "",
    eventDate: event?.eventDate ?? "",
    startTime: event?.startTime ?? "",
    endTime: event?.endTime ?? "",
    location: event?.location ?? "",
    image: event?.image ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    if (!form.title.trim()) return setError("Give the event a title.");
    if (!form.eventDate) return setError("Choose the date this event takes place.");
    setError(null);
    onSave(form);
  }

  return (
    <Modal title={event ? "Edit event" : "Add event"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Title" htmlFor="e-title">
          <Input id="e-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Traditional Ceremony" />
        </Field>
        <Field label="Description" htmlFor="e-desc">
          <Textarea id="e-desc" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What guests can expect" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Date" htmlFor="e-date">
            <Input id="e-date" type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
          </Field>
          <Field label="Starts" htmlFor="e-start">
            <Input id="e-start" type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
          </Field>
          <Field label="Ends" htmlFor="e-end">
            <Input id="e-end" type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
          </Field>
        </div>
        <Field label="Location" htmlFor="e-loc">
          <Input id="e-loc" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Pot of Gold Residence" />
        </Field>
        <ImageUploader label="Event image" id="e-img" value={form.image} onChange={(url) => set("image", url)} />
        {error && <p className="text-xs text-rose-200">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton onClick={submit}>{event ? "Save changes" : "Add event"}</AdminButton>
        </div>
      </div>
    </Modal>
  );
}
