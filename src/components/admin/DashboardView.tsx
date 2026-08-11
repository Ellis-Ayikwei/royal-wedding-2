"use client";

import Link from "next/link";
import { Users, CalendarDays, UtensilsCrossed, Radio, ArrowRight } from "lucide-react";
import type { Guest } from "@/lib/types";

interface Stats {
  total: number;
  accepted: number;
  pending: number;
  declined: number;
  totalGuestCount: number;
  recent: Guest[];
}

function StatCard({ label, value, hint, accent }: { label: string; value: number | string; hint?: string; accent?: string }) {
  return (
    <div className="card-glass rounded-md p-5">
      <p className="text-[10px] tracking-[0.2em] uppercase text-ivory-100/45">{label}</p>
      <p className={`mt-2 font-display text-3xl ${accent ?? "text-ivory-50"}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-ivory-100/40">{hint}</p>}
    </div>
  );
}

export function DashboardView({ stats, eventCount, menuMode, streamEnabled }: { stats: Stats; eventCount: number; menuMode: string; streamEnabled: boolean }) {
  const responseRate = stats.total > 0 ? Math.round(((stats.accepted + stats.declined) / stats.total) * 100) : 0;

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ivory-50">Dashboard</h1>
        <p className="mt-1.5 text-sm text-ivory-100/50">An overview of invitations and celebration settings.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Invitations" value={stats.total} hint="Total sent" />
        <StatCard label="Accepted" value={stats.accepted} accent="text-emerald-400" hint={`${stats.totalGuestCount} attending`} />
        <StatCard label="Pending" value={stats.pending} accent="text-gold-300" hint="Awaiting reply" />
        <StatCard label="Declined" value={stats.declined} accent="text-rose-300" hint="Sending regrets" />
      </div>

      <div className="mt-4 card-glass rounded-md p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] tracking-[0.2em] uppercase text-ivory-100/45">Response rate</p>
          <p className="font-display text-lg text-gold-300">{responseRate}%</p>
        </div>
        <div className="h-2 w-full bg-navy-950 rounded-full overflow-hidden border border-gold-400/15">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-gold-400 transition-all" style={{ width: `${responseRate}%` }} />
        </div>
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="font-display text-lg text-ivory-50 mb-3">Recent responses</h2>
          {stats.recent.length === 0 ? (
            <div className="border border-dashed border-gold-400/20 rounded-sm p-8 text-center">
              <p className="text-sm text-ivory-100/50">No guests yet.</p>
              <Link href="/admin/guests" className="mt-2 inline-block text-xs tracking-[0.15em] uppercase text-gold-300 hover:underline">
                Add your first guest
              </Link>
            </div>
          ) : (
            <ul className="card-glass rounded-md divide-y divide-gold-400/10">
              {stats.recent.map((g) => (
                <li key={g.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-ivory-50 truncate">{g.name}</p>
                    <p className="text-[11px] text-ivory-100/40">{g.phone}</p>
                  </div>
                  <span
                    className={`text-[10px] tracking-[0.12em] uppercase px-2.5 py-1 rounded-full border shrink-0 ${
                      g.rsvpStatus === "accepted"
                        ? "text-emerald-300 border-emerald-400/40"
                        : g.rsvpStatus === "declined"
                          ? "text-rose-300 border-rose-400/40"
                          : "text-gold-300 border-gold-400/40"
                    }`}
                  >
                    {g.rsvpStatus}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-display text-lg text-ivory-50 mb-3">Celebration setup</h2>
          <ul className="card-glass rounded-md divide-y divide-gold-400/10">
            {[
              { href: "/admin/guests", icon: Users, label: "Guests", value: `${stats.total} on the list` },
              { href: "/admin/events", icon: CalendarDays, label: "Event lineup", value: `${eventCount} events` },
              { href: "/admin/menu", icon: UtensilsCrossed, label: "Menu visibility", value: menuMode },
              { href: "/admin/streaming", icon: Radio, label: "Live stream", value: streamEnabled ? "Enabled" : "Disabled" },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <li key={row.href}>
                  <Link href={row.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors">
                    <Icon size={16} className="text-gold-300 shrink-0" />
                    <span className="text-sm text-ivory-50 flex-1">{row.label}</span>
                    <span className="text-[11px] text-ivory-100/45 capitalize">{row.value}</span>
                    <ArrowRight size={14} className="text-ivory-100/30" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
