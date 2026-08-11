"use client";

import { useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Clock } from "lucide-react";
import type { MenuItem, MenuSettings, MenuVisibilityMode } from "@/lib/types";
import { AdminButton, ConfirmDialog, EmptyState, Field, Input, Modal, Select, Textarea, useToast } from "./AdminUI";

const CATEGORIES = ["Starters", "Main Courses", "Desserts", "Drinks"];

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MenuManager({ initialItems, initialSettings }: { initialItems: MenuItem[]; initialSettings: MenuSettings }) {
  const { push } = useToast();
  const [items, setItems] = useState(initialItems);
  const [settings, setSettings] = useState(initialSettings);
  const [releaseAt, setReleaseAt] = useState(toLocalInput(initialSettings.releaseAt));
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<MenuItem | null>(null);

  async function saveSettings(mode: MenuVisibilityMode, release: string) {
    const res = await fetch("/api/admin/menu/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visibilityMode: mode,
        releaseAt: mode === "scheduled" && release ? new Date(release).toISOString() : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) return push(data.error || "Could not save menu visibility.", "error");
    setSettings(data.settings);
    push("Menu visibility saved");
  }

  async function addItem(form: { category: string; name: string; description: string }) {
    const res = await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, available: 1, sortOrder: items.length }),
    });
    const data = await res.json();
    if (!res.ok) return push(data.error || "Could not add the dish.", "error");
    setItems((is) => [...is, data.item]);
    push("Dish added to the menu");
    setCreating(false);
  }

  async function toggleAvailable(item: MenuItem) {
    const res = await fetch(`/api/admin/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: item.available === 1 ? 0 : 1 }),
    });
    const data = await res.json();
    if (!res.ok) return push("Could not update the dish.", "error");
    setItems((is) => is.map((i) => (i.id === data.item.id ? data.item : i)));
    push(data.item.available === 1 ? "Dish shown on the menu" : "Dish hidden from the menu");
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/admin/menu/${deleting.id}`, { method: "DELETE" });
    if (!res.ok) return push("Could not delete the dish.", "error");
    setItems((is) => is.filter((i) => i.id !== deleting.id));
    push(`"${deleting.name}" removed`);
    setDeleting(null);
  }

  const categories = Array.from(new Set([...CATEGORIES, ...items.map((i) => i.category)]));

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ivory-50">Menu</h1>
          <p className="mt-1.5 text-sm text-ivory-100/50">Control the dishes and when guests can see them</p>
        </div>
        <AdminButton onClick={() => setCreating(true)}><Plus size={14} /> Add dish</AdminButton>
      </header>

      <section className="card-glass rounded-md p-5 mb-8">
        <h2 className="font-display text-lg text-ivory-50 mb-1">Menu visibility</h2>
        <p className="text-xs text-ivory-100/45 mb-4">
          Guests see a countdown until the release time, then the menu appears automatically.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          {([
            { mode: "hidden" as const, label: "Hidden", icon: EyeOff },
            { mode: "scheduled" as const, label: "Release at a time", icon: Clock },
            { mode: "visible" as const, label: "Visible now", icon: Eye },
          ]).map((opt) => {
            const Icon = opt.icon;
            const active = settings.visibilityMode === opt.mode;
            return (
              <button
                key={opt.mode}
                onClick={() => saveSettings(opt.mode, releaseAt)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-sm border text-sm transition-colors ${
                  active ? "border-gold-300 bg-gold-300/10 text-gold-200" : "border-gold-400/20 text-ivory-100/60 hover:border-gold-400/40"
                }`}
              >
                <Icon size={15} /> {opt.label}
              </button>
            );
          })}
        </div>
        {settings.visibilityMode === "scheduled" && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <Field label="Release date and time" htmlFor="release">
                <Input id="release" type="datetime-local" value={releaseAt} onChange={(e) => setReleaseAt(e.target.value)} />
              </Field>
            </div>
            <AdminButton onClick={() => saveSettings("scheduled", releaseAt)}>Save release time</AdminButton>
          </div>
        )}
      </section>

      {items.length === 0 ? (
        <EmptyState title="No dishes yet" hint="Add starters, mains, desserts, and drinks to build the royal feast." />
      ) : (
        <div className="space-y-8">
          {categories
            .filter((c) => items.some((i) => i.category === c))
            .map((category) => (
              <section key={category}>
                <h2 className="font-display italic text-gold-300 text-base mb-3 pb-2 border-b border-gold-400/15">{category}</h2>
                <ul className="space-y-2">
                  {items.filter((i) => i.category === category).map((item) => (
                    <li key={item.id} className="card-glass rounded-sm px-4 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${item.available ? "text-ivory-50" : "text-ivory-100/35 line-through"}`}>{item.name}</p>
                        {item.description && <p className="text-[11px] text-ivory-100/40 mt-0.5">{item.description}</p>}
                      </div>
                      <button onClick={() => toggleAvailable(item)} aria-label={`Toggle availability of ${item.name}`} className="p-2 text-ivory-100/50 hover:text-gold-300">
                        {item.available ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                      <button onClick={() => setDeleting(item)} aria-label={`Delete ${item.name}`} className="p-2 text-ivory-100/50 hover:text-rose-300">
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}

      {creating && <MenuForm categories={categories} onClose={() => setCreating(false)} onSave={addItem} />}

      {deleting && (
        <ConfirmDialog
          title="Delete dish"
          body={`"${deleting.name}" will be removed from the menu. This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function MenuForm({ categories, onClose, onSave }: { categories: string[]; onClose: () => void; onSave: (f: { category: string; name: string; description: string }) => void }) {
  const [category, setCategory] = useState(categories[0] ?? "Starters");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!name.trim()) return setError("Give the dish a name.");
    setError(null);
    onSave({ category, name: name.trim(), description: description.trim() });
  }

  return (
    <Modal title="Add dish" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Course" htmlFor="m-cat">
          <Select id="m-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Dish name" htmlFor="m-name">
          <Input id="m-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jollof-crusted Beef Wellington" />
        </Field>
        <Field label="Description" htmlFor="m-desc">
          <Textarea id="m-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Truffle jus, garden vegetables" />
        </Field>
        {error && <p className="text-xs text-rose-200">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton onClick={submit}>Add dish</AdminButton>
        </div>
      </div>
    </Modal>
  );
}
