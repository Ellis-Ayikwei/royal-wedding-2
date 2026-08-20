"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { AdminUser } from "@/lib/auth";
import { AdminButton, ConfirmDialog, EmptyState, Field, Input, Modal, useToast } from "./AdminUI";

type FormValues = { email: string; password: string };

export function AdminUsersManager({ initialUsers, currentId }: { initialUsers: AdminUser[]; currentId: string }) {
  const { push } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(values: FormValues, existing: AdminUser | null) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: existing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(existing ? { id: existing.id } : {}), email: values.email, password: values.password || undefined }),
      });
      const data = await res.json();
      if (!res.ok) return push(data.error || "Could not save the user.", "error");
      setUsers((current) => existing ? current.map((user) => user.id === data.admin.id ? data.admin : user) : [...current, data.admin].sort((a, b) => a.email.localeCompare(b.email)));
      setEditing(null);
      setCreating(false);
      push(existing ? "Admin user updated" : "Admin user added");
    } catch {
      push("Could not reach the server.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    const res = await fetch(`/api/admin/users?id=${encodeURIComponent(deleting.id)}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return push(data.error || "Could not remove the user.", "error");
    setUsers((current) => current.filter((user) => user.id !== deleting.id));
    setDeleting(null);
    push("Admin user removed");
  }

  return (
    <section className="mt-10">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-ivory-50">Admin users</h2>
          <p className="mt-1.5 text-sm text-ivory-100/50">Manage who can sign in to the estate office</p>
        </div>
        <AdminButton onClick={() => setCreating(true)}><Plus size={14} /> Add user</AdminButton>
      </header>

      {users.length === 0 ? <EmptyState title="No admin users" hint="Add an administrator to manage this system." /> : (
        <div className="card-glass rounded-md overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead><tr className="text-left text-[10px] tracking-[0.15em] uppercase text-ivory-100/40 border-b border-gold-400/15">
              <th className="px-4 py-3 font-normal">Email</th><th className="px-4 py-3 font-normal">Access</th><th className="px-4 py-3 font-normal text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gold-400/10">
              {users.map((user) => <tr key={user.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-ivory-50">{user.email}</td>
                <td className="px-4 py-3 text-ivory-100/50">Administrator{user.id === currentId ? " (you)" : ""}</td>
                <td className="px-4 py-3"><div className="flex justify-end gap-1.5">
                  <button onClick={() => setEditing(user)} title="Edit user" aria-label={`Edit ${user.email}`} className="p-2 text-ivory-100/50 hover:text-gold-300 rounded-sm"><Pencil size={15} /></button>
                  <button onClick={() => setDeleting(user)} disabled={user.id === currentId} title={user.id === currentId ? "You cannot delete your own account" : "Remove user"} aria-label={`Remove ${user.email}`} className="p-2 text-ivory-100/50 hover:text-rose-300 rounded-sm disabled:opacity-25 disabled:hover:text-ivory-100/50"><Trash2 size={15} /></button>
                </div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && <AdminUserForm user={editing} busy={busy} onClose={() => { setCreating(false); setEditing(null); }} onSave={(values) => save(values, editing)} />}
      {deleting && <ConfirmDialog title="Remove admin user" body={`${deleting.email} will no longer be able to sign in. Existing sessions will also be ended.`} confirmLabel="Remove user" onConfirm={remove} onCancel={() => setDeleting(null)} />}
    </section>
  );
}

function AdminUserForm({ user, busy, onClose, onSave }: { user: AdminUser | null; busy: boolean; onClose: () => void; onSave: (values: FormValues) => void }) {
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!email.trim()) return setError("Enter an email address.");
    if (!user && password.length < 8) return setError("Password must be at least 8 characters.");
    if (password && password !== confirm) return setError("Passwords do not match.");
    if (user && email.trim() === user.email && !password) return setError("Nothing to update.");
    setError(null);
    onSave({ email: email.trim(), password });
  }

  return <Modal title={user ? "Edit admin user" : "Add admin user"} onClose={onClose}>
    <div className="space-y-4">
      <Field label="Email" htmlFor="admin-user-email"><Input id="admin-user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></Field>
      <Field label={user ? "New password (optional)" : "Password"} htmlFor="admin-user-password"><Input id="admin-user-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder={user ? "Leave blank to keep current password" : "At least 8 characters"} /></Field>
      <Field label="Confirm password" htmlFor="admin-user-confirm"><Input id="admin-user-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></Field>
      {error && <p className="text-xs text-rose-200">{error}</p>}
      <div className="flex justify-end gap-3 pt-2"><AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton><AdminButton onClick={submit} disabled={busy}>{user ? "Save changes" : "Add user"}</AdminButton></div>
    </div>
  </Modal>;
}
