"use client";

import { useMemo, useState } from "react";
import { Plus, Copy, RefreshCw, Pencil, Trash2, Search, FileSpreadsheet, Loader2 } from "lucide-react";
import type { Guest, RsvpStatus } from "@/lib/types";
import { AdminButton, ConfirmDialog, EmptyState, Field, Input, Modal, Select, useToast } from "./AdminUI";

type Filter = "all" | RsvpStatus;

interface GuestFormValues {
  name: string;
  phone: string;
  guestCount: number;
  rsvpStatus?: RsvpStatus;
}

export function GuestsManager({ initialGuests }: { initialGuests: Guest[] }) {
  const { push } = useToast();
  const [guests, setGuests] = useState(initialGuests);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Guest | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Guest | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function exportToExcel() {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/export");
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `guest-list-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      push("Guest list exported");
    } catch {
      push("Could not export the guest list. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  }

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      const matchesQuery =
        !query ||
        g.name.toLowerCase().includes(query.toLowerCase()) ||
        g.phone.includes(query);
      const matchesFilter = filter === "all" || g.rsvpStatus === filter;
      return matchesQuery && matchesFilter;
    });
  }, [guests, query, filter]);

  function inviteUrl(token: string) {
    return `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${token}`;
  }

  async function copyInvite(guest: Guest) {
    try {
      await navigator.clipboard.writeText(inviteUrl(guest.invitationToken));
      push(`Invitation link copied for ${guest.name}`);
    } catch {
      push("Could not copy the link. Copy it manually from the row.", "error");
    }
  }

  async function saveGuest(form: GuestFormValues, existing: Guest | null) {
    setBusy(true);
    try {
      const res = await fetch(existing ? `/api/admin/guests/${existing.id}` : "/api/admin/guests", {
        method: existing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        push(data.error || "Could not save the guest.", "error");
        return;
      }
      setGuests((gs) => (existing ? gs.map((g) => (g.id === data.guest.id ? data.guest : g)) : [data.guest, ...gs]));
      push(existing ? "Guest updated" : "Guest added");
      setEditing(null);
      setCreating(false);
    } catch {
      push("Could not reach the server.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function regenerate(guest: Guest) {
    const res = await fetch(`/api/admin/guests/${guest.id}/regenerate`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return push(data.error || "Could not regenerate the link.", "error");
    setGuests((gs) => gs.map((g) => (g.id === data.guest.id ? data.guest : g)));
    push("New invitation link generated. The old one no longer works.");
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/admin/guests/${deleting.id}`, { method: "DELETE" });
    if (!res.ok) return push("Could not remove the guest.", "error");
    setGuests((gs) => gs.filter((g) => g.id !== deleting.id));
    push(`${deleting.name} removed from the guest list`);
    setDeleting(null);
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ivory-50">Guests</h1>
          <p className="mt-1.5 text-sm text-ivory-100/50">{guests.length} on the guest list</p>
        </div>
        <div className="flex items-center gap-3">
          <AdminButton variant="ghost" onClick={exportToExcel} disabled={exporting || guests.length === 0}>
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
            {exporting ? "Exporting" : "Export to Excel"}
          </AdminButton>
          <AdminButton onClick={() => setCreating(true)}>
            <Plus size={14} /> Add guest
          </AdminButton>
        </div>
      </header>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ivory-100/30" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or phone"
            className="pl-9"
            aria-label="Search guests"
          />
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} aria-label="Filter by RSVP status" className="w-auto min-w-[150px]">
          <option value="all">All responses</option>
          <option value="accepted">Accepted</option>
          <option value="pending">Pending</option>
          <option value="declined">Declined</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={guests.length === 0 ? "No guests yet" : "No matching guests"}
          hint={guests.length === 0 ? "Add your first guest to generate a personal invitation link." : "Adjust your search or filter to find who you're looking for."}
        />
      ) : (
        <div className="card-glass rounded-md overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-[10px] tracking-[0.15em] uppercase text-ivory-100/40 border-b border-gold-400/15">
                <th className="px-4 py-3 font-normal">Guest</th>
                <th className="px-4 py-3 font-normal">Phone</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal">Party</th>
                <th className="px-4 py-3 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-400/10">
              {filtered.map((g) => (
                <tr key={g.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-ivory-50">{g.name}</td>
                  <td className="px-4 py-3 text-ivory-100/60">{g.phone}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] tracking-[0.12em] uppercase px-2.5 py-1 rounded-full border ${
                        g.rsvpStatus === "accepted"
                          ? "text-emerald-300 border-emerald-400/40"
                          : g.rsvpStatus === "declined"
                            ? "text-rose-300 border-rose-400/40"
                            : "text-gold-300 border-gold-400/40"
                      }`}
                    >
                      {g.rsvpStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ivory-100/60">{g.guestCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => copyInvite(g)} title="Copy invitation link" aria-label={`Copy invitation link for ${g.name}`} className="p-2 text-ivory-100/50 hover:text-gold-300 rounded-sm">
                        <Copy size={15} />
                      </button>
                      <button onClick={() => regenerate(g)} title="Regenerate invitation link" aria-label={`Regenerate invitation link for ${g.name}`} className="p-2 text-ivory-100/50 hover:text-gold-300 rounded-sm">
                        <RefreshCw size={15} />
                      </button>
                      <button onClick={() => setEditing(g)} title="Edit guest" aria-label={`Edit ${g.name}`} className="p-2 text-ivory-100/50 hover:text-gold-300 rounded-sm">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleting(g)} title="Remove guest" aria-label={`Remove ${g.name}`} className="p-2 text-ivory-100/50 hover:text-rose-300 rounded-sm">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <GuestForm
          guest={editing}
          busy={busy}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(form) => saveGuest(form, editing)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Remove guest"
          body={`${deleting.name} will be removed from the guest list and their invitation link will stop working. This cannot be undone.`}
          confirmLabel="Remove guest"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function GuestForm({ guest, busy, onClose, onSave }: { guest: Guest | null; busy: boolean; onClose: () => void; onSave: (form: GuestFormValues) => void }) {
  const [name, setName] = useState(guest?.name ?? "");
  const [phone, setPhone] = useState(guest?.phone ?? "");
  const [guestCount, setGuestCount] = useState(guest?.guestCount ?? 1);
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(guest?.rsvpStatus ?? "pending");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (name.trim().length < 2) return setError("Enter the guest's full name.");
    if (phone.trim().length < 5) return setError("Enter a valid phone number.");
    setError(null);
    const values: GuestFormValues = { name: name.trim(), phone: phone.trim(), guestCount };
    // Status is only meaningful on an existing guest; new ones always start pending.
    if (guest) values.rsvpStatus = rsvpStatus;
    onSave(values);
  }

  return (
    <Modal title={guest ? "Edit guest" : "Add guest"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Full name" htmlFor="g-name">
          <Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nana Ama Boateng" />
        </Field>
        <Field label="Phone number" htmlFor="g-phone">
          <Input id="g-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233 24 000 0000" />
        </Field>
        <Field label="Party size" htmlFor="g-count">
          <Input id="g-count" type="number" min={1} max={20} value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} />
        </Field>
        {guest && (
          <>
            <Field label="RSVP response" htmlFor="g-status">
              <Select id="g-status" value={rsvpStatus} onChange={(e) => setRsvpStatus(e.target.value as RsvpStatus)}>
                <option value="pending">Awaiting response</option>
                <option value="accepted">Accepted — attending</option>
                <option value="declined">Declined — not attending</option>
              </Select>
            </Field>
            <p className="-mt-1 text-[11px] leading-relaxed text-ivory-100/45">
              Set this yourself when someone replies by phone. Guests can only respond once
              through their link — switching back to &ldquo;Awaiting response&rdquo; lets them
              use it again.
            </p>
            <Field label="Invitation link">
              <Input readOnly value={`/invite/${guest.invitationToken}`} className="text-ivory-100/50" />
            </Field>
          </>
        )}
        {error && <p className="text-xs text-rose-200">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton onClick={submit} disabled={busy}>{guest ? "Save changes" : "Add guest"}</AdminButton>
        </div>
      </div>
    </Modal>
  );
}
