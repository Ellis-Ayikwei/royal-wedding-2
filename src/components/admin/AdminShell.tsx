"use client";

import { ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, CalendarDays, UtensilsCrossed, Images, Camera, Radio, MapPin, UserCog, LogOut, Menu, X } from "lucide-react";
import { Monogram } from "../ui/Monogram";
import { ToastProvider } from "./AdminUI";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/guests", label: "Guests", icon: Users },
  { href: "/admin/events", label: "Event Lineup", icon: CalendarDays },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/photos", label: "Photo Wall", icon: Camera },
  { href: "/admin/streaming", label: "Live Stream", icon: Radio },
  { href: "/admin/venue", label: "Venue", icon: MapPin },
  { href: "/admin/account", label: "Account", icon: UserCog },
];

export function AdminShell({ children, adminEmail }: { children: ReactNode; adminEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-6 py-6 border-b border-gold-400/15">
        <Monogram className="h-8 w-8 text-gold-300" />
        <div>
          <p className="font-display text-sm text-ivory-50">Estate Office</p>
          <p className="text-[10px] tracking-[0.15em] uppercase text-ivory-100/40">Wedding Admin</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-sm transition-colors ${
                active ? "bg-gold-300/12 text-gold-200 border border-gold-400/25" : "text-ivory-100/60 hover:text-gold-200 hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gold-400/15">
        <p className="px-2 pb-3 text-[11px] text-ivory-100/40 truncate">{adminEmail}</p>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-sm text-sm text-ivory-100/60 hover:text-rose-200 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen flex bg-navy-950">
        <aside className="hidden lg:block w-64 shrink-0 border-r border-gold-400/15 bg-navy-900">{sidebar}</aside>

        {open && (
          <>
            <div className="fixed inset-0 z-[90] bg-navy-950/80 lg:hidden" onClick={() => setOpen(false)} />
            <aside className="fixed left-0 top-0 bottom-0 z-[95] w-64 bg-navy-900 border-r border-gold-400/20 lg:hidden">
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-6 text-gold-200">
                <X size={20} />
              </button>
              {sidebar}
            </aside>
          </>
        )}

        <div className="flex-1 min-w-0">
          <header className="lg:hidden flex items-center gap-3 px-5 py-4 border-b border-gold-400/15 bg-navy-900">
            <button aria-label="Open menu" onClick={() => setOpen(true)} className="text-gold-200">
              <Menu size={22} />
            </button>
            <span className="font-display text-sm text-ivory-50">Estate Office</span>
          </header>
          <main className="p-5 sm:p-8 max-w-6xl">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
