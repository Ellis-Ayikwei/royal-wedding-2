"use client";

import { useState, FormEvent } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { AdminButton, Field, Input, useToast } from "./AdminUI";

export function AdminAccountManager({ email: initialEmail }: { email: string }) {
  const { push } = useToast();
  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!currentPassword) return setError("Enter your current password to make changes.");
    if (newPassword && newPassword.length < 8) return setError("New password must be at least 8 characters.");
    if (newPassword && newPassword !== confirmPassword) return setError("New passwords do not match.");
    if (email.trim() === initialEmail && !newPassword) return setError("Nothing to update.");

    setBusy(true);
    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          email: email.trim() !== initialEmail ? email.trim() : undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update the account.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      push("Account updated");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-ivory-50">Account</h1>
        <p className="mt-1.5 text-sm text-ivory-100/50">Update the login email or password for this admin account</p>
      </header>

      <div className="card-glass rounded-md p-6 sm:p-8 max-w-lg">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Email" htmlFor="acc-email">
            <Input id="acc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </Field>

          <div className="pt-2 border-t border-gold-400/15">
            <p className="pt-4 text-[11px] tracking-[0.15em] uppercase text-ivory-100/45 mb-3">New password (optional)</p>
            <div className="space-y-4">
              <Field label="New password" htmlFor="acc-new-password">
                <Input
                  id="acc-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm new password" htmlFor="acc-confirm-password">
                <Input
                  id="acc-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </Field>
            </div>
          </div>

          <div className="pt-2 border-t border-gold-400/15">
            <Field label="Current password (required to save)" htmlFor="acc-current-password">
              <Input
                id="acc-current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-4"
              />
            </Field>
          </div>

          {error && <p className="text-xs text-rose-200">{error}</p>}

          <AdminButton type="submit" disabled={busy} className="w-full py-3">
            {busy ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving
              </>
            ) : (
              <>
                <KeyRound size={14} /> Save changes
              </>
            )}
          </AdminButton>
        </form>
      </div>
    </div>
  );
}
