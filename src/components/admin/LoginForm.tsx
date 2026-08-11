"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Monogram } from "../ui/Monogram";
import { Field, Input, AdminButton } from "./AdminUI";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@") || password.length < 1) {
      setError("Enter your email and password to continue.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign in failed. Check your details and try again.");
        setLoading(false);
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Cannot reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-navy-950">
      <div className="absolute inset-0 pattern-dots opacity-[0.04]" />
      <div className="relative w-full max-w-sm card-glass rounded-md p-8 sm:p-10">
        <div className="text-center mb-8">
          <Monogram className="h-11 w-11 mx-auto text-gold-300" />
          <h1 className="mt-5 font-display text-2xl text-ivory-50">Estate Office</h1>
          <p className="mt-1.5 text-[11px] tracking-[0.2em] uppercase text-ivory-100/45">
            Wedding Administration
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@royalwedding.gh" autoComplete="username" />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </Field>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-200 bg-rose-500/10 border border-rose-400/30 rounded-sm px-3.5 py-2.5">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <AdminButton type="submit" className="w-full py-3" disabled={loading}>
            {loading ? <><Loader2 className="animate-spin" size={14} /> Signing in</> : "Sign in"}
          </AdminButton>
        </form>
      </div>
    </div>
  );
}
